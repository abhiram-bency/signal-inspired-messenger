from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.schemas.user import UpdateProfileRequest
from app.database.models import User

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def update_profile(self, user: User, request: UpdateProfileRequest) -> User:
        if request.display_name is not None:
            if not request.display_name.strip():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Display name cannot be empty")
            user.display_name = request.display_name.strip()
            
        if request.avatar_url is not None:
            user.avatar_url = request.avatar_url.strip() if request.avatar_url.strip() else None
            
        if request.username is not None:
            new_username = request.username.strip()
            if not new_username:
                user.username = None
            else:
                # Check for uniqueness if changed
                if user.username != new_username:
                    existing = await self.user_repo.get_user_by_identifier(new_username)
                    if existing and existing.id != user.id:
                        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
                user.username = new_username
                
        return await self.user_repo.update_user(user)
