from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from .user import UserResponse

class ContactResponse(BaseModel):
    id: str
    contact: UserResponse
    nickname: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AddContactRequest(BaseModel):
    user_id: str
    nickname: Optional[str] = None
