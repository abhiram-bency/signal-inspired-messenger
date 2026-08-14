"""
Database package — Phase 1.

Contains:
  database.py  — SQLAlchemy engine, SessionLocal, init_db(), get_db(), FK PRAGMA
  models.py    — All ORM model classes (users, sessions, contacts, etc.)
"""

from .database import engine, AsyncSessionLocal, Base, get_db, init_db
from .models import (
    User,
    Session,
    Contact,
    Conversation,
    ConversationMember,
    Message,
    MessageReceipt,
    MessageReaction,
    Attachment,
)

__all__ = [
    "engine",
    "AsyncSessionLocal",
    "Base",
    "get_db",
    "init_db",
    "User",
    "Session",
    "Contact",
    "Conversation",
    "ConversationMember",
    "Message",
    "MessageReceipt",
    "MessageReaction",
    "Attachment",
]
