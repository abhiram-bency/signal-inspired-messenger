import pytest
import sqlite3
import asyncio
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.database.database import get_db, Base
from app.database.seed import seed_database
from app.database.models import User
from fastapi.testclient import TestClient

TEST_DB_URL = "sqlite+aiosqlite:///./test_messenger_unread.db"
engine = create_async_engine(TEST_DB_URL, echo=False)

@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

TestingSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestingSessionLocal() as session:
        await seed_database(session)

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def auth_client_alice() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        verify = await ac.post("/api/v1/auth/verify-otp", json={"identifier": "alice", "otp": "123456"})
        ac.cookies.update(verify.cookies)
        yield ac

@pytest.fixture
async def auth_client_bob() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        verify = await ac.post("/api/v1/auth/verify-otp", json={"identifier": "bob", "otp": "123456"})
        ac.cookies.update(verify.cookies)
        yield ac

@pytest.mark.asyncio
async def test_unread_count_and_persistence(auth_client_alice: AsyncClient, auth_client_bob: AsyncClient):
    # Find Bob
    async with TestingSessionLocal() as session:
        result = await session.execute(select(User).where(User.username == "bob"))
        bob = result.scalar_one_or_none()

    # Alice creates a direct conversation with Bob
    create_resp = await auth_client_alice.post("/api/v1/conversations/direct", json={"user_id": bob.id})
    conv_id = create_resp.json()["data"]["id"]

    # Bob sends a message to Alice
    msg_resp = await auth_client_bob.post(f"/api/v1/conversations/{conv_id}/messages", json={"content": "Hi Alice!"})
    msg_id = msg_resp.json()["data"]["id"]

    # Test A: Unread Count
    # Alice should see 1 unread message
    conv_list_alice = await auth_client_alice.get("/api/v1/conversations")
    alice_conv = next(c for c in conv_list_alice.json()["data"] if c["id"] == conv_id)
    assert alice_conv["unread_count"] == 1

    # Test B: Own messages are not counted
    # Bob should see 0 unread messages (he sent it)
    conv_list_bob = await auth_client_bob.get("/api/v1/conversations")
    bob_conv = next(c for c in conv_list_bob.json()["data"] if c["id"] == conv_id)
    assert bob_conv["unread_count"] == 0

    # Test D: Unread Persists Across Fetch
    # Another fetch simulates fresh service/repository fetch, it should still be 1 for Alice
    conv_list_alice_2 = await auth_client_alice.get("/api/v1/conversations")
    alice_conv_2 = next(c for c in conv_list_alice_2.json()["data"] if c["id"] == conv_id)
    assert alice_conv_2["unread_count"] == 1

def test_websocket_receipt_and_history():
    client = TestClient(app)
    
    # Login Alice
    alice_verify = client.post("/api/v1/auth/verify-otp", json={"identifier": "alice", "otp": "123456"})
    alice_token = alice_verify.cookies.get("session_token")
    client_alice = TestClient(app, cookies={"session_token": alice_token})
    
    # Login Bob
    bob_verify = client.post("/api/v1/auth/verify-otp", json={"identifier": "bob", "otp": "123456"})
    bob_token = bob_verify.cookies.get("session_token")
    client_bob = TestClient(app, cookies={"session_token": bob_token})

    # Get Alice's ID via contacts (Alice Demo)
    contacts_resp = client_bob.get("/api/v1/contacts")
    alice_id = next(c["contact"]["id"] for c in contacts_resp.json()["data"] if c["contact"]["display_name"] == "Alice Demo")

    # Bob creates direct conversation with Alice
    create_resp = client_bob.post("/api/v1/conversations/direct", json={"user_id": alice_id})
    conv_id = create_resp.json()["data"]["id"]

    # Open both WebSockets
    with client_alice.websocket_connect("/ws") as ws_alice, client_bob.websocket_connect("/ws") as ws_bob:
        
        # Connection.init
        ws_alice.send_json({"type": "connection.init", "payload": {"client_version": "1.0"}})
        assert ws_alice.receive_json()["type"] == "connection.ready"
        
        ws_bob.send_json({"type": "connection.init", "payload": {"client_version": "1.0"}})
        assert ws_bob.receive_json()["type"] == "connection.ready"

        # Bob sends message
        client_msg_id = "test-msg-123"
        ws_bob.send_json({
            "type": "message.send",
            "payload": {
                "client_message_id": client_msg_id,
                "conversation_id": conv_id,
                "content": "Hello Alice WS"
            }
        })

        # Bob should get message.ack
        ack = ws_bob.receive_json()
        assert ack["type"] == "message.ack"
        msg_id = ack["payload"]["message"]["id"]

        # Alice should get message.new
        msg_new = ws_alice.receive_json()
        assert msg_new["type"] == "message.new"

        # Alice sends delivered receipt
        ws_alice.send_json({
            "type": "receipt.update",
            "payload": {
                "message_id": msg_id,
                "conversation_id": conv_id,
                "status": "delivered"
            }
        })
        
        # Bob should receive receipt.update(delivered)
        receipt_delivered = ws_bob.receive_json()
        assert receipt_delivered["type"] == "receipt.update"
        assert receipt_delivered["payload"]["status"] == "delivered"

        # Alice sends read receipt
        ws_alice.send_json({
            "type": "receipt.update",
            "payload": {
                "message_id": msg_id,
                "conversation_id": conv_id,
                "status": "read"
            }
        })

        # Bob should receive receipt.update(read)
        receipt_read = ws_bob.receive_json()
        assert receipt_read["type"] == "receipt.update"
        assert receipt_read["payload"]["status"] == "read"

        # Alice tries to downgrade to delivered
        ws_alice.send_json({
            "type": "receipt.update",
            "payload": {
                "message_id": msg_id,
                "conversation_id": conv_id,
                "status": "delivered"
            }
        })

        # Bob receives broadcast
        receipt_downgrade = ws_bob.receive_json()
        assert receipt_downgrade["type"] == "receipt.update"

    # Sockets closed. Now check HTTP histories
    # Bob checks history. It should be "read" (Test F: no downgrade)
    hist_bob = client_bob.get(f"/api/v1/conversations/{conv_id}/messages")
    assert hist_bob.json()["data"][0]["status"] == "read"

    # Alice checks history. She should also see "read" (Test G: message history status)
    hist_alice = client_alice.get(f"/api/v1/conversations/{conv_id}/messages")
    assert hist_alice.json()["data"][0]["status"] == "read"

    # Test C: Read Clears Unread
    conv_list_alice = client_alice.get("/api/v1/conversations")
    alice_conv = next(c for c in conv_list_alice.json()["data"] if c["id"] == conv_id)
    assert alice_conv["unread_count"] == 0
