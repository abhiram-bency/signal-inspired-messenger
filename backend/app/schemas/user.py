from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class UserResponse(BaseModel):
    id: str
    username: Optional[str] = None
    phone: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None
    is_online: bool = False
    last_seen_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    username: Optional[str] = None
