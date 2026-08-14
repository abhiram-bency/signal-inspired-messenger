import pytest
import sqlite3
import sqlalchemy.exc
from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.database import Base
from app.database.models import User, Contact, Conversation, ConversationMember, Message, Session, utc_now

# File-based test DB is necessary for reliable FK enforcement and schema sharing 
# across connections in async test setups.
TEST_DB_URL = "sqlite+aiosqlite:///./test_messenger.db"

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
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session():
    async with TestingSessionLocal() as session:
        yield session

@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    user = User(username="alice", phone="1234567890", display_name="Alice")
    db_session.add(user)
    await db_session.commit()
    
    assert user.id is not None
    assert user.created_at is not None

@pytest.mark.asyncio
async def test_foreign_key_enforcement(db_session: AsyncSession):
    session_obj = Session(user_id="nonexistent", token_hash="abc", expires_at=utc_now())
    db_session.add(session_obj)
    with pytest.raises(sqlalchemy.exc.IntegrityError) as exc_info:
        await db_session.commit()
    assert "FOREIGN KEY" in str(exc_info.value).upper() or "FOREIGN KEY constraint failed" in str(exc_info.value)

@pytest.mark.asyncio
async def test_unique_constraint(db_session: AsyncSession):
    user1 = User(username="u1", display_name="U1")
    user2 = User(username="u2", display_name="U2")
    db_session.add_all([user1, user2])
    await db_session.commit()

    contact1 = Contact(owner_id=user1.id, contact_id=user2.id, nickname="U2 Nick")
    db_session.add(contact1)
    await db_session.commit()

    contact2 = Contact(owner_id=user1.id, contact_id=user2.id, nickname="Duplicate")
    db_session.add(contact2)
    with pytest.raises(sqlalchemy.exc.IntegrityError):
        await db_session.commit()

@pytest.mark.asyncio
async def test_full_model_chain(db_session: AsyncSession):
    # User
    user = User(username="charlie", display_name="Charlie")
    db_session.add(user)
    await db_session.commit()

    # Conversation
    conv = Conversation(type="direct")
    db_session.add(conv)
    await db_session.commit()

    # Member
    member = ConversationMember(conversation_id=conv.id, user_id=user.id, role="member")
    db_session.add(member)
    await db_session.commit()

    # Message
    msg = Message(conversation_id=conv.id, sender_id=user.id, content="Hello", message_type="text")
    db_session.add(msg)
    await db_session.commit()

    assert msg.id is not None
