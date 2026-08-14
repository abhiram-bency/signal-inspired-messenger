import pytest
import sqlite3
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from fastapi.testclient import TestClient
import uuid
import json
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database.database import get_db, Base
from app.database.seed import seed_database
from app.database.models import User
from app.websocket.connection_manager import ConnectionManager

TEST_DB_URL = "sqlite+aiosqlite:///./test_messenger_ws.db"
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
async def get_alice_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        verify = await ac.post("/api/v1/auth/verify-otp", json={"identifier": "alice", "otp": "123456"})
        return verify.cookies.get("session_token")

def test_websocket_unauthenticated():
    client = TestClient(app)
    # Missing session_token should fail
    with pytest.raises(Exception):
        with client.websocket_connect("/ws") as ws:
            pass

@pytest.mark.asyncio
async def test_websocket_authenticated_init(get_alice_token):
    token = get_alice_token
    client = TestClient(app, cookies={"session_token": token})
    
    with client.websocket_connect("/ws") as ws:
        # Send connection init
        ws.send_json({
            "type": "connection.init",
            "payload": {"client_version": "1.0"}
        })
        
        # Expect connection.ready
        response = ws.receive_json()
        assert response["type"] == "connection.ready"
        assert "connection_id" in response["payload"]
        
        ws.close()

@pytest.mark.asyncio
async def test_connection_manager_logic():
    manager = ConnectionManager()
    class DummyWS:
        def __init__(self):
            self.accepted = False
            self.messages = []
        async def accept(self):
            self.accepted = True
        async def send_json(self, msg):
            self.messages.append(msg)
            
    ws1 = DummyWS()
    ws2 = DummyWS()
    
    # Test connect
    await manager.connect(ws1, "user_1")
    await manager.connect(ws2, "user_1")
    assert len(manager.active_connections["user_1"]) == 2
    
    # Test send user message
    await manager.send_user_message({"hello": "world"}, "user_1")
    assert len(ws1.messages) == 1
    assert len(ws2.messages) == 1
    
    # Test broadcast
    await manager.broadcast_to_users({"hello": "everyone"}, ["user_1"])
    assert len(ws1.messages) == 2
    
    # Test disconnect
    manager.disconnect(ws1, "user_1")
    assert len(manager.active_connections["user_1"]) == 1
    manager.disconnect(ws2, "user_1")
    assert "user_1" not in manager.active_connections
