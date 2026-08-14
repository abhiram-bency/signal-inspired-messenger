import pytest
import sqlite3
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.database.database import get_db, Base
from app.database.seed import seed_database
from app.database.models import User, Conversation

TEST_DB_URL = "sqlite+aiosqlite:///./test_messenger_msgs.db"
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
    
    # Seed the test DB
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
async def auth_client_david() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        verify = await ac.post("/api/v1/auth/verify-otp", json={"identifier": "david", "otp": "123456"})
        ac.cookies.update(verify.cookies)
        yield ac

@pytest.fixture
async def unauth_client() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_create_and_get_message(auth_client_alice: AsyncClient):
    # Get conversation
    conv_resp = await auth_client_alice.get("/api/v1/conversations")
    assert conv_resp.status_code == 200
    conv_id = conv_resp.json()["data"][0]["id"]
    
    # Send message
    msg_resp = await auth_client_alice.post(f"/api/v1/conversations/{conv_id}/messages", json={
        "content": "Hello world from Alice",
        "message_type": "text"
    })
    
    assert msg_resp.status_code == 201
    msg_data = msg_resp.json()["data"]
    assert msg_data["content"] == "Hello world from Alice"
    assert msg_data["conversation_id"] == conv_id
    msg_id = msg_data["id"]
    
    # Retrieve message
    history_resp = await auth_client_alice.get(f"/api/v1/conversations/{conv_id}/messages")
    assert history_resp.status_code == 200
    hist_data = history_resp.json()["data"]
    
    assert len(hist_data) >= 1
    # Check if our message is at the top (newest first)
    assert hist_data[0]["id"] == msg_id
    assert hist_data[0]["content"] == "Hello world from Alice"
    assert "sender" in hist_data[0]
    assert hist_data[0]["sender"]["display_name"] == "Alice Demo"

@pytest.mark.asyncio
async def test_unauthorized_message_access(unauth_client: AsyncClient):
    # Cannot access without auth
    resp = await unauth_client.get("/api/v1/conversations/fake-id/messages")
    assert resp.status_code == 401

@pytest.mark.asyncio
async def test_non_member_access(auth_client_alice: AsyncClient, auth_client_david: AsyncClient):
    # David creates a private direct conversation with someone (not Alice)
    async with TestingSessionLocal() as session:
        result = await session.execute(select(User).where(User.username == "charlie"))
        charlie = result.scalar_one_or_none()
        
    create_resp = await auth_client_david.post("/api/v1/conversations/direct", json={"user_id": charlie.id})
    assert create_resp.status_code in (200, 201)
    conv_id = create_resp.json()["data"]["id"]
    
    # Alice tries to read messages
    read_resp = await auth_client_alice.get(f"/api/v1/conversations/{conv_id}/messages")
    assert read_resp.status_code == 403
    
    # Alice tries to send message
    send_resp = await auth_client_alice.post(f"/api/v1/conversations/{conv_id}/messages", json={
        "content": "Sneaky message"
    })
    assert send_resp.status_code == 403

@pytest.mark.asyncio
async def test_pagination(auth_client_alice: AsyncClient):
    conv_resp = await auth_client_alice.get("/api/v1/conversations")
    conv_id = conv_resp.json()["data"][0]["id"]
    
    # Send 3 messages
    for i in range(3):
        await auth_client_alice.post(f"/api/v1/conversations/{conv_id}/messages", json={"content": f"Msg {i}"})
        
    # Get with limit=2
    list_resp = await auth_client_alice.get(f"/api/v1/conversations/{conv_id}/messages?limit=2")
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert len(data["data"]) == 2
    assert data["meta"]["has_more"] is True
    assert data["meta"]["next_cursor"] is not None
    
    # Get next page
    next_cursor = data["meta"]["next_cursor"]
    list_resp_2 = await auth_client_alice.get(f"/api/v1/conversations/{conv_id}/messages?limit=2&before={next_cursor}")
    assert list_resp_2.status_code == 200
    data2 = list_resp_2.json()
    assert len(data2["data"]) >= 1
    # Check ordering - first page should have 'Msg 2', 'Msg 1', second page 'Msg 0' (assuming no seeded msgs, else it keeps going)
