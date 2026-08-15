from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.database.database import get_db
from app.database.models import User
from app.core.dependencies import get_current_user, get_user_repo
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService
from app.schemas.auth import ApiResponse
from app.schemas.user import UserResponse, UpdateProfileRequest

router = APIRouter(prefix="/users", tags=["users"])

def get_user_service(user_repo: UserRepository = Depends(get_user_repo)) -> UserService:
    return UserService(user_repo)

@router.get("/me", response_model=ApiResponse[UserResponse])
async def get_my_profile(current_user: User = Depends(get_current_user)) -> Any:
    return ApiResponse(data=UserResponse.model_validate(current_user))

@router.put("/me", response_model=ApiResponse[UserResponse])
async def update_my_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
) -> Any:
    updated_user = await user_service.update_profile(current_user, request)
    return ApiResponse(data=UserResponse.model_validate(updated_user))

@router.get("/search", response_model=ApiResponse[list[UserResponse]])
async def search_users(
    q: str,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repo)
) -> Any:
    if not q or len(q.strip()) < 2:
        return ApiResponse(data=[])
        
    users = await user_repo.search_users(q.strip(), current_user.id)
    return ApiResponse(data=[UserResponse.model_validate(u) for u in users])
