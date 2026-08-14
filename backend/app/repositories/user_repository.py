from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.models import User, Session, utc_now
import uuid
import secrets
from datetime import timedelta

class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_by_identifier(self, identifier: str) -> Optional[User]:
        # Identifier can be username or phone
        result = await self.session.execute(
            select(User).where((User.username == identifier) | (User.phone == identifier))
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_user(self, display_name: str, username: Optional[str] = None, phone: Optional[str] = None) -> User:
        user = User(
            id=str(uuid.uuid4()),
            username=username,
            phone=phone,
            display_name=display_name
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def create_session(self, user_id: str, days: int = 30) -> Session:
        token_hash = secrets.token_urlsafe(64)
        expires_at = utc_now() + timedelta(days=days)
        
        db_session = Session(
            id=str(uuid.uuid4()),
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        self.session.add(db_session)
        await self.session.commit()
        await self.session.refresh(db_session)
        return db_session

    async def get_session_by_token(self, token_hash: str) -> Optional[Session]:
        from sqlalchemy.orm import joinedload
        result = await self.session.execute(
            select(Session)
            .options(joinedload(Session.user))
            .where(Session.token_hash == token_hash)
            .where(Session.expires_at > utc_now())
            .where(Session.revoked_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def revoke_session(self, session_id: str) -> None:
        result = await self.session.execute(
            select(Session).where(Session.id == session_id)
        )
        db_session = result.scalar_one_or_none()
        if db_session:
            db_session.revoked_at = utc_now()
            await self.session.commit()
