"""
Pydantic v2 schemas package.

Schemas define the request/response contracts for the REST API.
They are separate from SQLAlchemy ORM models.

Will contain:
  auth.py          — RegisterRequest, OTPVerifyRequest, LoginRequest, TokenResponse
  user.py          — UserPublic, UserProfile, UpdateProfileRequest
  contact.py       — ContactResponse, AddContactRequest
  conversation.py  — ConversationResponse, CreateDirectRequest, CreateGroupRequest
  message.py       — MessageResponse, CreateMessageRequest, ReceiptResponse
  group.py         — MemberResponse, AddMemberRequest, ChangeMemberRoleRequest

Spec reference: API_SPEC §8 (standard response format)
Not implemented in Phase 0.
"""
