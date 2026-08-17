from typing import Tuple, List, Optional
from fastapi import HTTPException, status
from app.repositories.message_repository import MessageRepository
from app.repositories.conversation_repository import ConversationRepository
from app.schemas.message import MessageResponse, CreateMessageResponse, MessageSender

class MessageService:
    def __init__(self, msg_repo: MessageRepository, conv_repo: ConversationRepository):
        self.msg_repo = msg_repo
        self.conv_repo = conv_repo

    async def get_messages(self, current_user_id: str, conversation_id: str, limit: int = 50, before: Optional[str] = None) -> Tuple[List[MessageResponse], bool, Optional[str]]:
        if limit > 100:
            limit = 100
        elif limit < 1:
            limit = 50

        # Verify membership
        conv = await self.conv_repo.get_conversation_by_id(conversation_id)
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        
        if not any(m.user_id == current_user_id for m in conv.members):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")

        raw_messages = await self.msg_repo.get_messages(conversation_id, limit=limit, before_id=before)
        
        has_more = len(raw_messages) > limit
        if has_more:
            raw_messages = raw_messages[:limit]
            
        next_cursor = raw_messages[-1].id if has_more else None

        results = []
        for msg in raw_messages:
            sender_schema = MessageSender(
                id=msg.sender.id,
                display_name=msg.sender.display_name,
                avatar_url=msg.sender.avatar_url
            )
            
            # Determine status based on receipts
            msg_status = "sent"
            if msg.sender_id == current_user_id and msg.receipts:
                if any(r.status == "read" for r in msg.receipts):
                    msg_status = "read"
                elif any(r.status == "delivered" for r in msg.receipts):
                    msg_status = "delivered"
            elif msg.sender_id != current_user_id and msg.receipts:
                # Get the current user's own receipt state for this received message
                user_receipt = next((r for r in msg.receipts if r.user_id == current_user_id), None)
                if user_receipt:
                    msg_status = user_receipt.status
            
            resp = MessageResponse(
                id=msg.id,
                conversation_id=msg.conversation_id,
                sender=sender_schema,
                content=msg.content,
                message_type=msg.message_type,
                reply_to=msg.reply_to_id,
                created_at=msg.created_at,
                edited_at=msg.edited_at,
                deleted_at=msg.deleted_at,
                status=msg_status
            )
            results.append(resp)
            
        return results, has_more, next_cursor

    async def create_message(self, current_user_id: str, conversation_id: str, content: str, message_type: str = "text", reply_to_id: Optional[str] = None) -> CreateMessageResponse:
        if not content or not content.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message content cannot be empty")

        # Verify membership
        conv = await self.conv_repo.get_conversation_by_id(conversation_id)
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        
        if not any(m.user_id == current_user_id for m in conv.members):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")

        msg = await self.msg_repo.create_message(
            conversation_id=conversation_id,
            sender_id=current_user_id,
            content=content,
            message_type=message_type,
            reply_to_id=reply_to_id
        )
        
        await self.msg_repo.session.commit()

        return CreateMessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_id=msg.sender_id,
            content=msg.content,
            message_type=msg.message_type,
            created_at=msg.created_at
        )

    async def update_receipt(self, message_id: str, current_user_id: str, status_val: str) -> None:
        if status_val not in ["delivered", "read"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
            
        await self.msg_repo.update_receipt(message_id, current_user_id, status_val)
        await self.msg_repo.session.commit()
