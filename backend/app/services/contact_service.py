from typing import List
from fastapi import HTTPException, status
from app.repositories.contact_repository import ContactRepository
from app.repositories.user_repository import UserRepository
from app.database.models import Contact

class ContactService:
    def __init__(self, contact_repo: ContactRepository, user_repo: UserRepository):
        self.contact_repo = contact_repo
        self.user_repo = user_repo

    async def get_contacts(self, user_id: str) -> List[Contact]:
        return await self.contact_repo.get_contacts(user_id)

    async def add_contact(self, owner_id: str, target_user_id: str, nickname: str = None) -> Contact:
        if owner_id == target_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add yourself as a contact")
            
        target_user = await self.user_repo.get_user_by_id(target_user_id)
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
        existing = await self.contact_repo.get_contact(owner_id, target_user_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Contact already exists")
            
        return await self.contact_repo.add_contact(owner_id, target_user_id, nickname)

    async def remove_contact(self, owner_id: str, target_user_id: str):
        success = await self.contact_repo.remove_contact(owner_id, target_user_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
