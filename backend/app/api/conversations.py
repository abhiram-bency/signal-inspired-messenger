from typing import List, Any
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import User
from app.core.dependencies import get_current_user, get_user_repo
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.user_repository import UserRepository
from app.services.conversation_service import ConversationService
from app.schemas.auth import ApiResponse
from app.schemas.conversation import (
    ConversationListItem, ConversationDetail, 
    CreateDirectRequest, CreateGroupRequest, AddMemberRequest
)

router = APIRouter(prefix="/conversations", tags=["conversations"])

def get_conversation_service(
    db: AsyncSession = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repo)
) -> ConversationService:
    conv_repo = ConversationRepository(db)
    return ConversationService(conv_repo, user_repo)

@router.get("", response_model=ApiResponse[List[ConversationListItem]])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    conv_service: ConversationService = Depends(get_conversation_service)
) -> Any:
    convs = await conv_service.get_user_conversations(current_user.id)
    return ApiResponse(data=convs, meta={"count": len(convs)})

@router.get("/{conversation_id}", response_model=ApiResponse[ConversationDetail])
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    conv_service: ConversationService = Depends(get_conversation_service)
) -> Any:
    detail = await conv_service.get_conversation(conversation_id, current_user.id)
    return ApiResponse(data=detail)

@router.post("/direct", response_model=ApiResponse[ConversationDetail])
async def create_direct(
    request: CreateDirectRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    conv_service: ConversationService = Depends(get_conversation_service)
) -> Any:
    detail, created = await conv_service.create_direct_conversation(current_user.id, request.user_id)
    if created:
        response.status_code = status.HTTP_201_CREATED
    else:
        response.status_code = status.HTTP_200_OK
    return ApiResponse(data=detail)

@router.post("/group", status_code=status.HTTP_201_CREATED, response_model=ApiResponse[ConversationDetail])
async def create_group(
    request: CreateGroupRequest,
    current_user: User = Depends(get_current_user),
    conv_service: ConversationService = Depends(get_conversation_service)
) -> Any:
    detail = await conv_service.create_group_conversation(current_user.id, request.name, request.member_ids)
    return ApiResponse(data=detail)

@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    conv_service: ConversationService = Depends(get_conversation_service)
) -> None:
    await conv_service.delete_conversation(conversation_id, current_user.id)

@router.post("/{conversation_id}/members", response_model=ApiResponse[ConversationDetail])
async def add_group_member(
    conversation_id: str,
    request: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    conv_service: ConversationService = Depends(get_conversation_service)
) -> Any:
    detail = await conv_service.add_group_member(conversation_id, current_user.id, request.user_id)
    return ApiResponse(data=detail)

@router.delete("/{conversation_id}/members/{user_id}", response_model=ApiResponse[ConversationDetail])
async def remove_group_member(
    conversation_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    conv_service: ConversationService = Depends(get_conversation_service)
) -> Any:
    detail = await conv_service.remove_group_member(conversation_id, current_user.id, user_id)
    return ApiResponse(data=detail)
