from typing import Optional, Dict, Any, Generic, TypeVar
from pydantic import BaseModel, Field, constr
from .user import UserResponse

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    data: T
    meta: Optional[Dict[str, Any]] = None

class RegisterRequest(BaseModel):
    username: Optional[constr(min_length=3, max_length=32)] = None
    phone: Optional[str] = None
    display_name: constr(min_length=1, max_length=64)

class RegisterData(BaseModel):
    user: UserResponse
    otp_required: bool

class VerifyOTPRequest(BaseModel):
    identifier: str
    otp: str

class LoginRequest(BaseModel):
    identifier: str
    otp: Optional[str] = None

class AuthData(BaseModel):
    authenticated: bool
    user: UserResponse
