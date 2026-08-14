from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.database.database import get_db
from app.database.models import User
from app.core.config import get_settings
from app.core.dependencies import get_user_repo, get_current_user, get_current_session_id
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.schemas.auth import (
    RegisterRequest, RegisterData, VerifyOTPRequest, AuthData, 
    LoginRequest, ApiResponse
)
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

def get_auth_service(user_repo: UserRepository = Depends(get_user_repo)) -> AuthService:
    return AuthService(user_repo)

def set_auth_cookie(response: Response, token: str):
    settings = get_settings()
    is_prod = settings.environment == "production"

    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        max_age=30 * 24 * 60 * 60,
        samesite="none" if is_prod else "lax",
        secure=is_prod,
        path="/",
    )

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=ApiResponse[RegisterData])
async def register(
    request: RegisterRequest, 
    auth_service: AuthService = Depends(get_auth_service)
) -> Any:
    user, otp_required = await auth_service.register(
        display_name=request.display_name,
        username=request.username,
        phone=request.phone
    )
    return ApiResponse(
        data=RegisterData(
            user=UserResponse.model_validate(user),
            otp_required=otp_required
        )
    )

@router.post("/verify-otp", response_model=ApiResponse[AuthData])
async def verify_otp(
    request: VerifyOTPRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
) -> Any:
    user, session = await auth_service.verify_otp(request.identifier, request.otp)
    set_auth_cookie(response, session.token_hash)
    
    return ApiResponse(
        data=AuthData(
            authenticated=True,
            user=UserResponse.model_validate(user)
        )
    )

@router.post("/login", response_model=ApiResponse[Any])
async def login(
    request: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
) -> Any:
    if request.otp:
        user, session = await auth_service.verify_otp(request.identifier, request.otp)
        set_auth_cookie(response, session.token_hash)
        return ApiResponse(
            data=AuthData(
                authenticated=True,
                user=UserResponse.model_validate(user)
            )
        )
    else:
        # Step 1: verify identifier exists and request OTP
        await auth_service.login_step1(request.identifier)
        return ApiResponse(data={"otp_required": True})

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    session_id: str = Depends(get_current_session_id),
    auth_service: AuthService = Depends(get_auth_service)
) -> None:
    await auth_service.logout(session_id)
    response.delete_cookie("session_token")
    return None

@router.get("/me", response_model=ApiResponse[UserResponse])
async def get_me(current_user: User = Depends(get_current_user)) -> Any:
    return ApiResponse(data=UserResponse.model_validate(current_user))
