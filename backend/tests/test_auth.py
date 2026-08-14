import pytest
import sqlite3
from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.database.database import get_db, Base

TEST_DB_URL = "sqlite+aiosqlite:///./test_messenger_auth.db"
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
    
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def auth_client() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_register_flow(auth_client: AsyncClient):
    # Register user
    reg_response = await auth_client.post("/api/v1/auth/register", json={
        "username": "testuser1",
        "display_name": "Test User 1"
    })
    assert reg_response.status_code == 201
    assert reg_response.json()["data"]["user"]["username"] == "testuser1"
    assert reg_response.json()["data"]["otp_required"] is True
    
    # Verify OTP
    verify_response = await auth_client.post("/api/v1/auth/verify-otp", json={
        "identifier": "testuser1",
        "otp": "123456"
    })
    assert verify_response.status_code == 200
    assert verify_response.json()["data"]["authenticated"] is True
    
    # Check cookie is set
    assert "session_token" in verify_response.cookies
    
    # Get current user (me)
    me_response = await auth_client.get("/api/v1/auth/me", cookies=verify_response.cookies)
    assert me_response.status_code == 200
    assert me_response.json()["data"]["username"] == "testuser1"
    
    # Logout
    logout_response = await auth_client.post("/api/v1/auth/logout", cookies=verify_response.cookies)
    assert logout_response.status_code == 204
    
    # Verify me fails
    me_response_after = await auth_client.get("/api/v1/auth/me", cookies=verify_response.cookies)
    assert me_response_after.status_code == 401

@pytest.mark.asyncio
async def test_invalid_otp(auth_client: AsyncClient):
    await auth_client.post("/api/v1/auth/register", json={
        "username": "testuser2",
        "display_name": "Test User 2"
    })
    
    verify_response = await auth_client.post("/api/v1/auth/verify-otp", json={
        "identifier": "testuser2",
        "otp": "wrongotp"
    })
    assert verify_response.status_code == 401

@pytest.mark.asyncio
async def test_login_flow(auth_client: AsyncClient):
    await auth_client.post("/api/v1/auth/register", json={
        "username": "testuser3",
        "display_name": "Test User 3"
    })
    
    # Login Step 1
    login1 = await auth_client.post("/api/v1/auth/login", json={
        "identifier": "testuser3"
    })
    assert login1.status_code == 200
    assert login1.json()["data"]["otp_required"] is True
    
    # Login Step 2
    login2 = await auth_client.post("/api/v1/auth/login", json={
        "identifier": "testuser3",
        "otp": "123456"
    })
    assert login2.status_code == 200
    assert login2.json()["data"]["authenticated"] is True
    assert "session_token" in login2.cookies

