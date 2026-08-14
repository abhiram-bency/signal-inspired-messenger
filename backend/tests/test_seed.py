import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.models import User, Conversation, Message, Contact
from app.database.seed import seed_database
import sqlite3
from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.database.database import Base

TEST_DB_URL = "sqlite+aiosqlite:///./test_messenger_seed.db"
engine = create_async_engine(TEST_DB_URL, echo=False)

@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    else:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

TestingSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

@pytest.fixture
async def db_session():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with TestingSessionLocal() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
async def test_seed_database_idempotency(db_session: AsyncSession):
    """
    Tests that the seed_database function properly populates the db
    and running it a second time does not duplicate records.
    """
    # 1. First seed
    await seed_database(db_session)
    
    # Check users created
    result = await db_session.execute(select(User))
    users = result.scalars().all()
    assert len(users) >= 5
    
    # Check conversations created
    result_conv = await db_session.execute(select(Conversation))
    conversations = result_conv.scalars().all()
    assert len(conversations) >= 3
    
    # Check messages created
    result_msg = await db_session.execute(select(Message))
    messages = result_msg.scalars().all()
    assert len(messages) >= 4

    # 2. Second seed
    await seed_database(db_session)
    
    # Check counts remain the same (idempotent)
    result2 = await db_session.execute(select(User))
    users2 = result2.scalars().all()
    assert len(users) == len(users2)
    
    result_conv2 = await db_session.execute(select(Conversation))
    conversations2 = result_conv2.scalars().all()
    assert len(conversations) == len(conversations2)
