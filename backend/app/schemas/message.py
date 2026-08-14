from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class MessageSender(BaseModel):
    id: str
    display_name: str
    avatar_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender: MessageSender
    content: str
    message_type: str = "text"
    reply_to: Optional[str] = None
    created_at: datetime
    edited_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    status: str = "sent" # simplified for MVP
    
    model_config = ConfigDict(from_attributes=True)

class CreateMessageRequest(BaseModel):
    content: str
    message_type: str = "text"
    reply_to_id: Optional[str] = None

class CreateMessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    content: str
    message_type: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MessageListMeta(BaseModel):
    limit: int
    has_more: bool
    next_cursor: Optional[str] = None
