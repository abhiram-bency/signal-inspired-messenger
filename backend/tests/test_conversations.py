import pytest
import sqlite3
from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.database.database import get_db, Base
from app.database.seed import seed_database
from app.database.models import User
from sqlalchemy import select

TEST_DB_URL = "sqlite+aiosqlite:///./test_messenger_convs.db"
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
        # Login Alice
        verify = await ac.post("/api/v1/auth/verify-otp", json={
            "identifier": "alice",
            "otp": "123456"
        })
        # Set cookies for subsequent requests
        ac.cookies.update(verify.cookies)
        yield ac

@pytest.mark.asyncio
async def test_list_conversations(auth_client_alice: AsyncClient):
    response = await auth_client_alice.get("/api/v1/conversations")
    assert response.status_code == 200
    data = response.json()["data"]
    
    # Alice should be in multiple seeded conversations
    assert len(data) >= 1
    # Check shape
    conv = data[0]
    assert "id" in conv
    assert "type" in conv
    assert "name" in conv
    assert "updated_at" in conv

@pytest.mark.asyncio
async def test_get_conversation_detail(auth_client_alice: AsyncClient):
    # List to get an ID
    list_resp = await auth_client_alice.get("/api/v1/conversations")
    conv_id = list_resp.json()["data"][0]["id"]
    
    # Get detail
    detail_resp = await auth_client_alice.get(f"/api/v1/conversations/{conv_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()["data"]
    assert detail["id"] == conv_id
    assert "members" in detail
    assert len(detail["members"]) >= 2

@pytest.mark.asyncio
async def test_create_direct_conversation(auth_client_alice: AsyncClient):
    # Find David (Alice doesn't have a direct conversation with him seeded initially, or she might. Let's just create one)
    async with TestingSessionLocal() as session:
        result = await session.execute(select(User).where(User.username == "david"))
        david = result.scalar_one_or_none()

    response = await auth_client_alice.post("/api/v1/conversations/direct", json={
        "user_id": david.id
    })
    
    assert response.status_code in (200, 201)
    data = response.json()["data"]
    assert data["type"] == "direct"
    # Name should be David's display name for Alice
    assert data["name"] == david.display_name
    member_ids = [m["id"] for m in data["members"]]
    assert david.id in member_ids

@pytest.mark.asyncio
async def test_create_group_conversation(auth_client_alice: AsyncClient):
    async with TestingSessionLocal() as session:
        bob_res = await session.execute(select(User).where(User.username == "bob"))
        bob = bob_res.scalar_one_or_none()
        charlie_res = await session.execute(select(User).where(User.username == "charlie"))
        charlie = charlie_res.scalar_one_or_none()

    response = await auth_client_alice.post("/api/v1/conversations/group", json={
        "name": "New Test Group",
        "member_ids": [bob.id, charlie.id]
    })
    
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["type"] == "group"
    assert data["name"] == "New Test Group"
    member_ids = [m["id"] for m in data["members"]]
    assert bob.id in member_ids
    assert charlie.id in member_ids
    
    # Alice should be admin
    alice_member = next(m for m in data["members"] if m["display_name"] == "Alice Demo")
    assert alice_member["role"] == "admin"
