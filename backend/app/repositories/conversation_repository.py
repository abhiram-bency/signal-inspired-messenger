from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.orm import selectinload

from app.database.models import Conversation, ConversationMember, Message, User, generate_uuid, utc_now

class ConversationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_conversations(self, user_id: str) -> List[Conversation]:
        # Need to return conversations sorted by updated_at desc, with members eager loaded
        # The API_SPEC lists "unread_count" and "last_message". We can fetch the conversations
        # first, then decorate them with last_message if needed, or join. 
        # For MVP, simpler to fetch conversations and rely on relationships or a second query.
        result = await self.session.execute(
            select(Conversation)
            .join(ConversationMember)
            .where(ConversationMember.user_id == user_id)
            .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
            .order_by(desc(Conversation.updated_at))
        )
        return list(result.scalars().unique().all())

    async def get_conversation_by_id(self, conv_id: str) -> Optional[Conversation]:
        result = await self.session.execute(
            select(Conversation)
            .where(Conversation.id == conv_id)
            .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        )
        return result.scalar_one_or_none()

    async def get_direct_conversation(self, user1_id: str, user2_id: str) -> Optional[Conversation]:
        # Subqueries to find conversation where both are members and type is direct
        stmt = (
            select(Conversation)
            .join(ConversationMember, Conversation.id == ConversationMember.conversation_id)
            .where(Conversation.type == "direct")
            .where(
                Conversation.id.in_(
                    select(ConversationMember.conversation_id)
                    .where(ConversationMember.user_id == user1_id)
                )
            )
            .where(
                Conversation.id.in_(
                    select(ConversationMember.conversation_id)
                    .where(ConversationMember.user_id == user2_id)
                )
            )
            .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create_conversation(self, conv_type: str, created_by: str, name: Optional[str] = None) -> Conversation:
        conv = Conversation(
            id=generate_uuid(),
            type=conv_type,
            name=name,
            created_by=created_by
        )
        self.session.add(conv)
        await self.session.flush()
        return conv

    async def add_member(self, conv_id: str, user_id: str, role: str) -> ConversationMember:
        member = ConversationMember(
            id=generate_uuid(),
            conversation_id=conv_id,
            user_id=user_id,
            role=role
        )
        self.session.add(member)
        return member

    async def get_member(self, conv_id: str, user_id: str) -> Optional[ConversationMember]:
        result = await self.session.execute(
            select(ConversationMember)
            .where(
                and_(
                    ConversationMember.conversation_id == conv_id,
                    ConversationMember.user_id == user_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def remove_member(self, member: ConversationMember) -> None:
        await self.session.delete(member)
        await self.session.flush()

    async def get_last_message(self, conv_id: str) -> Optional[Message]:
        result = await self.session.execute(
            select(Message)
            .where(Message.conversation_id == conv_id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()
