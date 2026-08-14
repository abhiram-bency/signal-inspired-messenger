from typing import Optional, Tuple
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.database.models import User, Session

class AuthService:
    MOCK_OTP = "123456"

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def register(self, display_name: str, username: Optional[str] = None, phone: Optional[str] = None) -> Tuple[User, bool]:
        if not username and not phone:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Username or phone is required")
            
        identifier = username or phone
        existing_user = await self.user_repo.get_user_by_identifier(identifier)
        if existing_user:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

        user = await self.user_repo.create_user(display_name=display_name, username=username, phone=phone)
        return user, True

    async def login_step1(self, identifier: str) -> bool:
        user = await self.user_repo.get_user_by_identifier(identifier)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return True # OTP required

    async def verify_otp(self, identifier: str, otp: str) -> Tuple[User, Session]:
        if otp != self.MOCK_OTP:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP")
            
        user = await self.user_repo.get_user_by_identifier(identifier)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
        session = await self.user_repo.create_session(user_id=user.id)
        return user, session

    async def logout(self, session_id: str) -> None:
        await self.user_repo.revoke_session(session_id)
