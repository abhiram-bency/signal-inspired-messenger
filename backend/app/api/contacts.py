from fastapi import APIRouter, Depends, status
from typing import Any, List

from app.database.models import User
from app.core.dependencies import get_current_user, get_user_repo
from app.repositories.user_repository import UserRepository
from app.repositories.contact_repository import ContactRepository
from app.services.contact_service import ContactService
from app.schemas.auth import ApiResponse
from app.schemas.contact import ContactResponse, AddContactRequest
from app.database.database import get_db

router = APIRouter(prefix="/contacts", tags=["contacts"])

def get_contact_service(
    db = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repo)
) -> ContactService:
    contact_repo = ContactRepository(db)
    return ContactService(contact_repo, user_repo)

@router.get("", response_model=ApiResponse[List[ContactResponse]])
async def list_contacts(
    current_user: User = Depends(get_current_user),
    contact_service: ContactService = Depends(get_contact_service)
) -> Any:
    contacts = await contact_service.get_contacts(current_user.id)
    return ApiResponse(data=[ContactResponse.model_validate(c) for c in contacts])

@router.post("", status_code=status.HTTP_201_CREATED, response_model=ApiResponse[ContactResponse])
async def add_contact(
    request: AddContactRequest,
    current_user: User = Depends(get_current_user),
    contact_service: ContactService = Depends(get_contact_service)
) -> Any:
    contact = await contact_service.add_contact(current_user.id, request.user_id, request.nickname)
    return ApiResponse(data=ContactResponse.model_validate(contact))

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_contact(
    user_id: str,
    current_user: User = Depends(get_current_user),
    contact_service: ContactService = Depends(get_contact_service)
) -> None:
    await contact_service.remove_contact(current_user.id, user_id)
    return None
