from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from .user import UserResponse

class MessagePreview(BaseModel):
    id: str
    content: str
    sender_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ConversationListItem(BaseModel):
    id: str
    type: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    last_message: Optional[MessagePreview] = None
    unread_count: int = 0
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ConversationMemberSchema(BaseModel):
    id: str
    display_name: str
    role: str
    model_config = ConfigDict(from_attributes=True)

class ConversationDetail(BaseModel):
    id: str
    type: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_by: str
    members: List[ConversationMemberSchema] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CreateDirectRequest(BaseModel):
    user_id: str

class CreateGroupRequest(BaseModel):
    name: str
    member_ids: List[str]

class AddMemberRequest(BaseModel):
    user_id: str
