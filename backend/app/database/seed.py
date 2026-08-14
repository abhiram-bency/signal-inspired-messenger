import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.database import AsyncSessionLocal
from app.database.models import (
    User, Contact, Conversation, ConversationMember, Message,
    MessageReceipt, generate_uuid, utc_now
)

async def seed_database(session: AsyncSession = None):
    """
    Seeds the database with deterministic demo data.
    Idempotent: will not duplicate data if run multiple times.
    """
    owns_session = False
    if session is None:
        session = AsyncSessionLocal()
        owns_session = True

    try:
        # Check if already seeded to ensure idempotency
        result = await session.execute(select(User).where(User.username == "alice"))
        if result.scalar_one_or_none():
            print("Database already seeded. Skipping seed operation.")
            return

        print("Seeding database...")
        
        # 1. Users
        alice = User(id=generate_uuid(), username="alice", phone="1111111111", display_name="Alice Demo", is_online=True)
        bob = User(id=generate_uuid(), username="bob", phone="2222222222", display_name="Bob Demo", is_online=False, last_seen_at=utc_now() - timedelta(minutes=5))
        charlie = User(id=generate_uuid(), username="charlie", phone="3333333333", display_name="Charlie Demo", is_online=True)
        david = User(id=generate_uuid(), username="david", phone="4444444444", display_name="David Demo", is_online=False)
        emma = User(id=generate_uuid(), username="emma", phone="5555555555", display_name="Emma Demo", is_online=True)
        
        users = [alice, bob, charlie, david, emma]
        session.add_all(users)
        await session.flush()
        
        # 2. Contacts
        # Alice knows Bob and Charlie
        session.add(Contact(owner_id=alice.id, contact_id=bob.id, nickname="Bobby"))
        session.add(Contact(owner_id=alice.id, contact_id=charlie.id))
        # Bob knows Alice
        session.add(Contact(owner_id=bob.id, contact_id=alice.id))
        # Emma knows David
        session.add(Contact(owner_id=emma.id, contact_id=david.id))
        await session.flush()

        # 3. Conversations
        # Direct: Alice and Bob
        conv_ab = Conversation(type="direct", created_by=alice.id)
        session.add(conv_ab)
        await session.flush()
        
        session.add_all([
            ConversationMember(conversation_id=conv_ab.id, user_id=alice.id, role="member"),
            ConversationMember(conversation_id=conv_ab.id, user_id=bob.id, role="member")
        ])
        
        # Direct: Alice and Charlie
        conv_ac = Conversation(type="direct", created_by=charlie.id)
        session.add(conv_ac)
        await session.flush()
        
        session.add_all([
            ConversationMember(conversation_id=conv_ac.id, user_id=alice.id, role="member"),
            ConversationMember(conversation_id=conv_ac.id, user_id=charlie.id, role="member")
        ])
        
        # Group: Alice, Bob, Emma
        conv_group = Conversation(type="group", name="Project Team", created_by=alice.id)
        session.add(conv_group)
        await session.flush()
        
        session.add_all([
            ConversationMember(conversation_id=conv_group.id, user_id=alice.id, role="admin"),
            ConversationMember(conversation_id=conv_group.id, user_id=bob.id, role="member"),
            ConversationMember(conversation_id=conv_group.id, user_id=emma.id, role="member")
        ])
        await session.flush()

        # 4. Messages
        now = utc_now()
        
        # Alice <-> Bob messages
        msg1 = Message(
            conversation_id=conv_ab.id, sender_id=alice.id, content="Hey Bob!", 
            message_type="text", created_at=now - timedelta(hours=2)
        )
        msg2 = Message(
            conversation_id=conv_ab.id, sender_id=bob.id, content="Hi Alice, how are you?", 
            message_type="text", created_at=now - timedelta(hours=1, minutes=55)
        )
        session.add_all([msg1, msg2])
        await session.flush()
        
        # Receipts for Alice <-> Bob
        session.add(MessageReceipt(message_id=msg1.id, user_id=bob.id, status="read", delivered_at=msg1.created_at, read_at=msg1.created_at + timedelta(minutes=1)))
        session.add(MessageReceipt(message_id=msg2.id, user_id=alice.id, status="read", delivered_at=msg2.created_at, read_at=msg2.created_at + timedelta(minutes=2)))
        
        # Group messages
        msg_g1 = Message(
            conversation_id=conv_group.id, sender_id=alice.id, content="Welcome to the team group!", 
            message_type="text", created_at=now - timedelta(days=1)
        )
        msg_g2 = Message(
            conversation_id=conv_group.id, sender_id=emma.id, content="Thanks Alice!", 
            message_type="text", created_at=now - timedelta(days=1) + timedelta(minutes=30)
        )
        session.add_all([msg_g1, msg_g2])
        await session.flush()
        
        # Receipts for group
        session.add(MessageReceipt(message_id=msg_g1.id, user_id=bob.id, status="delivered", delivered_at=msg_g1.created_at))
        session.add(MessageReceipt(message_id=msg_g1.id, user_id=emma.id, status="read", delivered_at=msg_g1.created_at, read_at=msg_g1.created_at + timedelta(minutes=10)))
        
        await session.commit()
        print("Database successfully seeded.")
        
    finally:
        if owns_session:
            await session.close()
