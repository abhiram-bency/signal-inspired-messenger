from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.database.models import Message, Conversation, generate_uuid, utc_now

class MessageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_message(self, conversation_id: str, sender_id: str, content: str, message_type: str = "text", reply_to_id: Optional[str] = None) -> Message:
        msg = Message(
            id=generate_uuid(),
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
            message_type=message_type,
            reply_to_id=reply_to_id
        )
        self.session.add(msg)
        
        # update conversation updated_at
        result = await self.session.execute(select(Conversation).where(Conversation.id == conversation_id))
        conv = result.scalar_one_or_none()
        if conv:
            conv.updated_at = utc_now()

        await self.session.flush()
        
        # Load sender to return in full message response if needed
        # We'll just refresh with selectinload for sender
        result = await self.session.execute(
            select(Message)
            .where(Message.id == msg.id)
            .options(selectinload(Message.sender))
        )
        return result.scalar_one()

    async def get_messages(self, conversation_id: str, limit: int = 50, before_id: Optional[str] = None) -> List[Message]:
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .options(selectinload(Message.sender))
            .order_by(desc(Message.created_at))
        )
        
        if before_id:
            # Need to get the created_at of the 'before' message to paginate backward in time
            cursor_res = await self.session.execute(select(Message.created_at).where(Message.id == before_id))
            cursor_time = cursor_res.scalar_one_or_none()
            if cursor_time:
                stmt = stmt.where(Message.created_at < cursor_time)
                
        stmt = stmt.limit(limit + 1)
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
