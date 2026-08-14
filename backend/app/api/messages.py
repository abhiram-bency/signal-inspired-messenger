from typing import List, Optional, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import User
from app.core.dependencies import get_current_user
from app.repositories.message_repository import MessageRepository
from app.repositories.conversation_repository import ConversationRepository
from app.services.message_service import MessageService
from app.schemas.auth import ApiResponse
from app.schemas.message import (
    MessageResponse, CreateMessageRequest, CreateMessageResponse, MessageListMeta
)

router = APIRouter(prefix="/conversations/{conversation_id}/messages", tags=["messages"])

def get_message_service(db: AsyncSession = Depends(get_db)) -> MessageService:
    return MessageService(MessageRepository(db), ConversationRepository(db))

@router.get("", response_model=ApiResponse[List[MessageResponse]])
async def list_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=100),
    before: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    msg_service: MessageService = Depends(get_message_service)
) -> Any:
    results, has_more, next_cursor = await msg_service.get_messages(
        current_user_id=current_user.id,
        conversation_id=conversation_id,
        limit=limit,
        before=before
    )
    
    meta = MessageListMeta(
        limit=limit,
        has_more=has_more,
        next_cursor=next_cursor
    )
    
    return ApiResponse(data=results, meta=meta.model_dump())

@router.post("", status_code=status.HTTP_201_CREATED, response_model=ApiResponse[CreateMessageResponse])
async def create_message(
    conversation_id: str,
    request: CreateMessageRequest,
    current_user: User = Depends(get_current_user),
    msg_service: MessageService = Depends(get_message_service)
) -> Any:
    result = await msg_service.create_message(
        current_user_id=current_user.id,
        conversation_id=conversation_id,
        content=request.content,
        message_type=request.message_type,
        reply_to_id=request.reply_to_id
    )
    
    return ApiResponse(data=result)
