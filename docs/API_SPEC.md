# `docs/API_SPEC.md`

````markdown
# API Specification — Signal-Inspired Messenger

**Project:** Signal-Inspired Messenger  
**Status:** Authoritative API Contract  
**Version:** 1.0  
**Backend:** Python + FastAPI  
**API Style:** REST + WebSocket  
**Database:** SQLite  
**Base Path:** `/api/v1`  
**Last Updated:** 2026-08-13

---

# 1. Purpose

This document defines the authoritative HTTP API contract between the frontend and backend.

It specifies:

- endpoints
- HTTP methods
- authentication requirements
- request schemas
- response schemas
- status codes
- validation rules
- authorization rules
- pagination
- search behavior
- error handling
- resource relationships

The frontend and backend must implement this contract consistently.

If implementation requirements conflict with this document, this document must be updated before introducing the conflicting behavior.

---

# 2. API Architecture

The application uses two communication mechanisms:

```text
                    Frontend
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        REST API             WebSocket
        /api/v1              /ws/...
             │                   │
             ▼                   ▼
        FastAPI Router      Connection Manager
             │                   │
             └─────────┬─────────┘
                       ▼
                   Services
                       │
                       ▼
                 Repositories
                       │
                       ▼
                    SQLite
````

REST is responsible for:

* authentication
* user/profile operations
* contacts
* conversation retrieval
* message history
* group management
* settings
* search

WebSockets are responsible for:

* real-time messages
* typing indicators
* presence
* delivery/read events
* real-time conversation updates
* real-time group events

---

# 3. Base URL

Development:

```text
http://localhost:8000/api/v1
```

Production:

```text
https://<backend-domain>/api/v1
```

The frontend must not hardcode the production URL.

Use an environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

# 4. API Versioning

All REST endpoints are versioned:

```text
/api/v1/...
```

This allows future versions to evolve without immediately breaking the frontend.

---

# 5. Authentication Model

Authentication is intentionally simplified for the assignment.

Supported onboarding:

```text
Register
   ↓
OTP verification (mocked)
   ↓
Profile setup
   ↓
Authenticated session
```

The OTP may use a fixed development value.

Example:

```text
123456
```

The exact value must be documented as development-only.

---

# 6. Authentication Strategy

The backend creates a persistent session after successful authentication.

Recommended browser implementation:

```text
HttpOnly session cookie
```

Alternative:

```text
Bearer token
```

may be used if the implementation architecture requires it.

The frontend must not store sensitive authentication credentials in insecure persistent browser storage when an HttpOnly cookie approach is available.

---

# 7. Authentication Header

If Bearer authentication is used:

```http
Authorization: Bearer <token>
```

If cookie authentication is used, the browser automatically sends the session cookie.

The final implementation must use one consistent strategy.

---

# 8. Standard Response Format

Successful responses should use predictable JSON structures.

Single resource:

```json
{
  "data": {}
}
```

Collection:

```json
{
  "data": [],
  "meta": {}
}
```

The API should avoid returning unrelated fields.

---

# 9. Standard Error Format

All API errors should use:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Conversation not found",
    "details": null
  }
}
```

For validation errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {
      "username": "Username is required"
    }
  }
}
```

---

# 10. Standard Error Codes

Recommended error codes:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
INVALID_OTP
SESSION_EXPIRED
USER_ALREADY_EXISTS
CONTACT_ALREADY_EXISTS
CONVERSATION_ALREADY_EXISTS
NOT_A_MEMBER
NOT_AN_ADMIN
MESSAGE_NOT_FOUND
INVALID_MESSAGE
INVALID_OPERATION
INTERNAL_ERROR
```

---

# 11. HTTP Status Code Policy

| Status | Meaning                                    |
| ------ | ------------------------------------------ |
| `200`  | Successful operation                       |
| `201`  | Resource created                           |
| `204`  | Successful operation with no response body |
| `400`  | Invalid request                            |
| `401`  | Authentication required/invalid            |
| `403`  | Authenticated but unauthorized             |
| `404`  | Resource not found                         |
| `409`  | Resource conflict                          |
| `422`  | Validation failure                         |
| `429`  | Rate limited                               |
| `500`  | Internal server error                      |

---

# 12. Authentication Endpoints

```text
POST   /auth/register
POST   /auth/verify-otp
POST   /auth/login
POST   /auth/logout
GET    /auth/me
```

---

# 13. Register

```http
POST /api/v1/auth/register
```

Creates a new user account.

## Request

```json
{
  "username": "alice",
  "phone": null,
  "display_name": "Alice"
}
```

Phone-based registration:

```json
{
  "username": null,
  "phone": "+919876543210",
  "display_name": "Alice"
}
```

At least one identity field must be supplied.

---

# 14. Register Validation

Requirements:

```text
username: 3–32 characters
display_name: 1–64 characters
phone: normalized if provided
```

Username must be unique.

Phone must be unique when provided.

---

# 15. Register Response

```http
201 Created
```

Example:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "username": "alice",
      "phone": null,
      "display_name": "Alice",
      "avatar_url": null
    },
    "otp_required": true
  }
}
```

---

# 16. Verify OTP

```http
POST /api/v1/auth/verify-otp
```

Verifies the mocked OTP.

## Request

```json
{
  "identifier": "alice",
  "otp": "123456"
}
```

---

# 17. Verify OTP Response

```http
200 OK
```

Example:

```json
{
  "data": {
    "authenticated": true,
    "user": {
      "id": "uuid",
      "username": "alice",
      "display_name": "Alice"
    }
  }
}
```

The server creates an authenticated session.

---

# 18. Login

```http
POST /api/v1/auth/login
```

## Request

```json
{
  "identifier": "alice"
}
```

If OTP is required:

```json
{
  "identifier": "alice",
  "otp": "123456"
}
```

The exact implementation may use a two-step login.

---

# 19. Login Response

```json
{
  "data": {
    "authenticated": true,
    "user": {
      "id": "uuid",
      "username": "alice",
      "display_name": "Alice",
      "avatar_url": null
    }
  }
}
```

---

# 20. Logout

```http
POST /api/v1/auth/logout
```

Authentication required.

Revokes the current session.

Response:

```http
204 No Content
```

---

# 21. Current User

```http
GET /api/v1/auth/me
```

Authentication required.

Response:

```json
{
  "data": {
    "id": "uuid",
    "username": "alice",
    "phone": null,
    "display_name": "Alice",
    "avatar_url": null,
    "is_online": true,
    "last_seen_at": null
  }
}
```

---

# 22. User/Profile Endpoints

```text
GET   /users/me
PATCH /users/me
GET   /users/search
GET   /users/{user_id}
```

---

# 23. Get Current Profile

```http
GET /api/v1/users/me
```

Authentication required.

Returns the current user's profile.

---

# 24. Update Profile

```http
PATCH /api/v1/users/me
```

Authentication required.

## Request

```json
{
  "display_name": "Alice Smith",
  "avatar_url": "/uploads/avatars/alice.png"
}
```

Fields are optional.

---

# 25. Update Profile Response

```json
{
  "data": {
    "id": "uuid",
    "username": "alice",
    "display_name": "Alice Smith",
    "avatar_url": "/uploads/avatars/alice.png"
  }
}
```

---

# 26. User Search

```http
GET /api/v1/users/search?q=alice
```

Authentication required.

Searches:

```text
username
display_name
phone
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "username": "alice",
      "display_name": "Alice",
      "avatar_url": null,
      "is_online": true,
      "last_seen_at": null
    }
  ],
  "meta": {
    "count": 1
  }
}
```

---

# 27. Get User

```http
GET /api/v1/users/{user_id}
```

Authentication required.

Returns publicly visible profile information.

Private authentication information must never be returned.

---

# 28. Contact Endpoints

```text
GET    /contacts
POST   /contacts
DELETE /contacts/{user_id}
GET    /contacts/search
```

---

# 29. List Contacts

```http
GET /api/v1/contacts
```

Authentication required.

Response:

```json
{
  "data": [
    {
      "user": {
        "id": "uuid",
        "username": "bob",
        "display_name": "Bob",
        "avatar_url": null,
        "is_online": false,
        "last_seen_at": "2026-08-13T12:00:00Z"
      },
      "nickname": null,
      "created_at": "2026-08-13T10:00:00Z"
    }
  ],
  "meta": {
    "count": 1
  }
}
```

---

# 30. Add Contact

```http
POST /api/v1/contacts
```

## Request

```json
{
  "user_id": "uuid",
  "nickname": "Bob"
}
```

---

# 31. Add Contact Rules

The request must fail if:

```text
target user does not exist
target user == current user
contact already exists
```

Response:

```http
201 Created
```

---

# 32. Delete Contact

```http
DELETE /api/v1/contacts/{user_id}
```

Authentication required.

The contact relationship belonging to the current user is removed.

Existing conversations remain.

Response:

```http
204 No Content
```

---

# 33. Conversation Endpoints

```text
GET    /conversations
POST   /conversations/direct
POST   /conversations/group
GET    /conversations/{conversation_id}
DELETE /conversations/{conversation_id}
```

---

# 34. List Conversations

```http
GET /api/v1/conversations
```

Authentication required.

Returns conversations where the current user is an active member.

Default order:

```text
updated_at DESC
```

---

# 35. Conversation List Response

```json
{
  "data": [
    {
      "id": "conversation-uuid",
      "type": "direct",
      "name": "Bob",
      "avatar_url": null,
      "last_message": {
        "id": "message-uuid",
        "content": "See you tomorrow!",
        "sender_id": "uuid",
        "created_at": "2026-08-13T13:30:00Z"
      },
      "unread_count": 2,
      "updated_at": "2026-08-13T13:30:00Z"
    }
  ],
  "meta": {
    "count": 1
  }
}
```

---

# 36. Create Direct Conversation

```http
POST /api/v1/conversations/direct
```

## Request

```json
{
  "user_id": "target-user-uuid"
}
```

---

# 37. Direct Conversation Rules

The backend must:

1. authenticate requester
2. validate target user
3. prevent self-conversation
4. check whether direct conversation already exists
5. return existing conversation if appropriate
6. otherwise create a new conversation
7. create two memberships

The operation should be idempotent from the client's perspective.

---

# 38. Direct Conversation Response

```http
201 Created
```

or:

```http
200 OK
```

if an existing conversation is returned.

Example:

```json
{
  "data": {
    "id": "conversation-uuid",
    "type": "direct",
    "name": "Bob",
    "members": [
      {
        "id": "uuid",
        "display_name": "Alice"
      },
      {
        "id": "uuid",
        "display_name": "Bob"
      }
    ],
    "created_at": "2026-08-13T13:00:00Z"
  }
}
```

---

# 39. Create Group

```http
POST /api/v1/conversations/group
```

## Request

```json
{
  "name": "Engineering Team",
  "member_ids": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
}
```

The creator does not need to include themselves.

The backend automatically adds the creator as an admin.

---

# 40. Create Group Rules

The backend must:

```text
validate group name
validate all users
remove duplicate member IDs
add creator
assign creator = admin
assign others = member
create conversation
create memberships
```

This operation must be transactional.

---

# 41. Group Response

```json
{
  "data": {
    "id": "conversation-uuid",
    "type": "group",
    "name": "Engineering Team",
    "avatar_url": null,
    "members": [
      {
        "id": "uuid",
        "display_name": "Alice",
        "role": "admin"
      },
      {
        "id": "uuid",
        "display_name": "Bob",
        "role": "member"
      }
    ],
    "created_at": "2026-08-13T13:00:00Z"
  }
}
```

---

# 42. Get Conversation

```http
GET /api/v1/conversations/{conversation_id}
```

Authentication required.

The current user must be an active member.

Response:

```json
{
  "data": {
    "id": "uuid",
    "type": "group",
    "name": "Engineering Team",
    "avatar_url": null,
    "created_by": "uuid",
    "members": [],
    "created_at": "2026-08-13T13:00:00Z",
    "updated_at": "2026-08-13T13:45:00Z"
  }
}
```

---

# 43. Conversation Authorization

Every conversation endpoint must verify:

```text
current_user ∈ active conversation members
```

A frontend-selected conversation ID must never be trusted without backend verification.

---

# 44. Group Member Endpoints

```text
GET    /conversations/{conversation_id}/members
POST   /conversations/{conversation_id}/members
DELETE /conversations/{conversation_id}/members/{user_id}
PATCH  /conversations/{conversation_id}/members/{user_id}
```

---

# 45. List Group Members

```http
GET /api/v1/conversations/{conversation_id}/members
```

Authentication required.

Response:

```json
{
  "data": [
    {
      "user_id": "uuid",
      "display_name": "Alice",
      "avatar_url": null,
      "role": "admin",
      "joined_at": "2026-08-13T13:00:00Z"
    }
  ]
}
```

---

# 46. Add Group Member

```http
POST /api/v1/conversations/{conversation_id}/members
```

Authentication:

```text
required
```

Authorization:

```text
admin only
```

Request:

```json
{
  "user_id": "uuid"
}
```

---

# 47. Remove Group Member

```http
DELETE /api/v1/conversations/{conversation_id}/members/{user_id}
```

Authorization:

```text
admin only
```

The implementation must prevent invalid states such as removing the final administrator unless another administrator is assigned first.

---

# 48. Change Member Role

```http
PATCH /api/v1/conversations/{conversation_id}/members/{user_id}
```

Request:

```json
{
  "role": "admin"
}
```

Only an administrator may change roles.

Allowed roles:

```text
member
admin
```

---

# 49. Group Rename

```http
PATCH /api/v1/conversations/{conversation_id}
```

Request:

```json
{
  "name": "New Engineering Team"
}
```

Only administrators may rename a group.

---

# 50. Message Endpoints

```text
GET  /conversations/{conversation_id}/messages
POST /conversations/{conversation_id}/messages
PATCH /messages/{message_id}
DELETE /messages/{message_id}
```

Real-time sending should normally happen over WebSocket after the WebSocket connection is established.

The REST create-message endpoint exists as a reliable fallback and for testing.

---

# 51. Get Messages

```http
GET /api/v1/conversations/{conversation_id}/messages
```

Authentication required.

Query parameters:

```text
limit
before
after
```

Example:

```text
GET /api/v1/conversations/abc/messages?limit=50
```

---

# 52. Message Pagination

Default:

```text
limit = 50
```

Maximum:

```text
limit = 100
```

The backend must clamp or reject larger requests.

---

# 53. Cursor Pagination

Preferred pagination model:

```text
before=<message-id>
```

Example:

```text
GET /messages?limit=50&before=message-uuid
```

This allows efficient history loading.

---

# 54. Message Response

```json
{
  "data": [
    {
      "id": "message-uuid",
      "conversation_id": "conversation-uuid",
      "sender": {
        "id": "user-uuid",
        "display_name": "Alice",
        "avatar_url": null
      },
      "content": "Hello!",
      "message_type": "text",
      "reply_to": null,
      "created_at": "2026-08-13T13:40:00Z",
      "edited_at": null,
      "deleted_at": null,
      "status": "read"
    }
  ],
  "meta": {
    "limit": 50,
    "has_more": true,
    "next_cursor": "message-uuid"
  }
}
```

---

# 55. Create Message

```http
POST /api/v1/conversations/{conversation_id}/messages
```

Authentication required.

Request:

```json
{
  "content": "Hello Bob!",
  "message_type": "text",
  "reply_to_id": null
}
```

---

# 56. Create Message Rules

The backend must:

1. authenticate user
2. verify conversation exists
3. verify user membership
4. validate content
5. validate reply target if provided
6. create message
7. update conversation activity
8. create necessary receipt state
9. commit transaction
10. broadcast event if WebSocket delivery is available

---

# 57. Create Message Response

```http
201 Created
```

Example:

```json
{
  "data": {
    "id": "message-uuid",
    "conversation_id": "conversation-uuid",
    "sender_id": "user-uuid",
    "content": "Hello Bob!",
    "message_type": "text",
    "created_at": "2026-08-13T13:45:00Z"
  }
}
```

---

# 58. Message Editing

```http
PATCH /api/v1/messages/{message_id}
```

Authentication required.

Only the message sender may edit their message.

Request:

```json
{
  "content": "Updated message"
}
```

The optional bonus feature may be implemented after all core functionality is complete.

---

# 59. Message Deletion

```http
DELETE /api/v1/messages/{message_id}
```

Authentication required.

Only the sender may delete their own message unless administrator moderation is intentionally implemented.

Recommended behavior:

```text
deleted_at = now
```

instead of physically deleting the row.

---

# 60. Receipt Endpoints

```text
POST /messages/{message_id}/delivered
POST /messages/{message_id}/read
GET  /messages/{message_id}/receipts
```

---

# 61. Mark Delivered

```http
POST /api/v1/messages/{message_id}/delivered
```

Authentication required.

The current user must be a recipient/member of the conversation.

Response:

```json
{
  "data": {
    "message_id": "uuid",
    "user_id": "uuid",
    "status": "delivered",
    "delivered_at": "2026-08-13T13:50:00Z"
  }
}
```

---

# 62. Mark Read

```http
POST /api/v1/messages/{message_id}/read
```

Authentication required.

The current user must be a recipient/member.

The transition is:

```text
sent → delivered → read
```

If the message is already `read`, the operation should be idempotent.

---

# 63. Get Receipts

```http
GET /api/v1/messages/{message_id}/receipts
```

Returns delivery/read states for the message.

Example:

```json
{
  "data": [
    {
      "user_id": "uuid",
      "status": "read",
      "delivered_at": "2026-08-13T13:50:00Z",
      "read_at": "2026-08-13T13:51:00Z"
    }
  ]
}
```

---

# 64. Search API

A unified search endpoint may be provided:

```http
GET /api/v1/search?q=<query>
```

It may search:

```text
contacts
users
conversations
```

However, separate resource-specific endpoints are preferred when the response semantics differ significantly.

---

# 65. Conversation Search

```http
GET /api/v1/conversations/search?q=project
```

Search may match:

* group names
* direct-contact display names
* usernames

---

# 66. Message Search

Optional endpoint:

```http
GET /api/v1/messages/search?q=deployment
```

This is not required for the core assignment.

If implemented, search is restricted to conversations accessible to the current user.

---

# 67. Settings Endpoints

Settings are mostly placeholders in the assignment.

Recommended:

```text
GET   /settings
PATCH /settings
```

Example:

```http
GET /api/v1/settings
```

Response:

```json
{
  "data": {
    "appearance": "system",
    "notifications_enabled": true,
    "privacy": {
      "read_receipts": true,
      "typing_indicators": true
    }
  }
}
```

---

# 68. Settings Scope

The following may be functional:

```text
appearance
notifications
read receipts
typing indicators
```

The following may remain placeholders:

```text
advanced privacy
linked devices
security keys
```

---

# 69. Placeholder Features

The following do not require complete backend APIs:

```text
voice calls
video calls
stories
linked devices
real end-to-end encryption
```

The UI may display:

```text
Coming Soon
```

or equivalent.

---

# 70. Health Endpoint

A health endpoint is required for deployment monitoring.

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

This endpoint does not require authentication.

---

# 71. Readiness Endpoint

Optional:

```http
GET /ready
```

Response:

```json
{
  "status": "ready",
  "database": "ok"
}
```

Useful for deployment platforms and debugging.

---

# 72. API Authentication Matrix

| Endpoint Group     | Auth |
| ------------------ | ---- |
| `/health`          | No   |
| `/auth/register`   | No   |
| `/auth/verify-otp` | No   |
| `/auth/login`      | No   |
| `/auth/logout`     | Yes  |
| `/auth/me`         | Yes  |
| `/users/*`         | Yes  |
| `/contacts/*`      | Yes  |
| `/conversations/*` | Yes  |
| `/messages/*`      | Yes  |
| `/settings/*`      | Yes  |

---

# 73. Authorization Matrix

| Operation              | User | Member | Admin |
| ---------------------- | ---: | -----: | ----: |
| View own conversations |    ✓ |        |       |
| View conversation      |      |      ✓ |     ✓ |
| Send message           |      |      ✓ |     ✓ |
| Read message           |      |      ✓ |     ✓ |
| View members           |      |      ✓ |     ✓ |
| Add group member       |      |        |     ✓ |
| Remove group member    |      |        |     ✓ |
| Rename group           |      |        |     ✓ |
| Change member role     |      |        |     ✓ |
| Edit own message       |    ✓ |      ✓ |     ✓ |
| Delete own message     |    ✓ |      ✓ |     ✓ |

---

# 74. API Validation

Validation occurs at multiple layers.

```text
Request
   ↓
Pydantic schema validation
   ↓
Authentication
   ↓
Authorization
   ↓
Service-level business validation
   ↓
Repository/database constraints
```

The API layer must not rely exclusively on frontend validation.

---

# 75. Pydantic Models

FastAPI request and response schemas should use Pydantic models.

Example:

```python
class CreateMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)
    message_type: Literal["text"] = "text"
    reply_to_id: UUID | None = None
```

Response models should explicitly define exposed fields.

Avoid returning raw SQLAlchemy model objects directly.

---

# 76. API Layer Separation

Routers should not contain complex business logic.

Preferred:

```text
Router
   ↓
Service
   ↓
Repository
   ↓
Database
```

Example:

```text
POST /conversations/{id}/messages
             ↓
messages_router
             ↓
message_service.send_message()
             ↓
message_repository.create()
             ↓
SQLAlchemy
```

---

# 77. Transaction Boundaries

Transactions belong around logical operations.

Examples:

```text
create group
send message
add group member
remove group member
mark message read
```

A multi-table operation should either fully succeed or fully fail.

---

# 78. Idempotency

Operations that may be retried should be designed to tolerate duplicate requests.

Examples:

```text
create direct conversation
mark message delivered
mark message read
add contact
```

For message creation, duplicate prevention is more complicated.

The preferred future-compatible approach is to support a client-generated idempotency key/message ID.

---

# 79. Client Message ID

For real-time messaging, the frontend may generate:

```text
client_message_id
```

Example:

```json
{
  "client_message_id": "uuid",
  "content": "Hello!"
}
```

The backend can use this to reconcile:

```text
sending
   ↓
sent
```

and prevent accidental duplicate creation after network retries.

If implemented, this field should be unique per sender.

---

# 80. API Request Correlation

The backend should support a request ID for debugging.

Example:

```http
X-Request-ID: uuid
```

If supplied, logs should include it.

If not supplied, the backend may generate one.

---

# 81. CORS

Development frontend:

```text
http://localhost:3000
```

must be allowed.

Production CORS must be restricted to the deployed frontend origin.

Do not use unrestricted:

```text
allow_origins=["*"]
```

when credentials are enabled.

---

# 82. Rate Limiting

A full production rate limiter is outside assignment scope.

However, authentication endpoints should avoid unlimited abuse.

At minimum, the implementation should have sensible validation around:

```text
registration
OTP verification
login
```

---

# 83. API Logging

Do not log:

```text
passwords
session tokens
OTP secrets
authorization headers
```

Safe logging examples:

```text
request method
route
status
duration
request ID
user ID
```

---

# 84. OpenAPI

FastAPI automatically exposes OpenAPI documentation.

Development:

```text
/docs
```

and:

```text
/openapi.json
```

These are useful for:

* frontend development
* debugging
* evaluation
* API inspection

The API implementation must keep the generated OpenAPI documentation meaningful.

---

# 85. Endpoint Summary

```text
AUTH
POST   /auth/register
POST   /auth/verify-otp
POST   /auth/login
POST   /auth/logout
GET    /auth/me

USERS
GET    /users/me
PATCH  /users/me
GET    /users/search
GET    /users/{user_id}

CONTACTS
GET    /contacts
POST   /contacts
DELETE /contacts/{user_id}

CONVERSATIONS
GET    /conversations
POST   /conversations/direct
POST   /conversations/group
GET    /conversations/{conversation_id}
PATCH  /conversations/{conversation_id}

GROUP MEMBERS
GET    /conversations/{conversation_id}/members
POST   /conversations/{conversation_id}/members
DELETE /conversations/{conversation_id}/members/{user_id}
PATCH  /conversations/{conversation_id}/members/{user_id}

MESSAGES
GET    /conversations/{conversation_id}/messages
POST   /conversations/{conversation_id}/messages
PATCH  /messages/{message_id}
DELETE /messages/{message_id}

RECEIPTS
POST   /messages/{message_id}/delivered
POST   /messages/{message_id}/read
GET    /messages/{message_id}/receipts

SETTINGS
GET    /settings
PATCH  /settings

SYSTEM
GET    /health
GET    /ready
```

---

# 86. REST vs WebSocket Responsibility

REST:

```text
Initial state
Historical state
CRUD
Authentication
Search
Settings
Group management
```

WebSocket:

```text
New messages
Typing
Presence
Delivery events
Read events
Real-time group events
Conversation activity
```

The WebSocket protocol is defined separately in:

```text
docs/WEBSOCKET_PROTOCOL.md
```

---

# 87. Example End-to-End Message Flow

```text
User types message
        │
        ▼
Frontend
        │
        │ WebSocket SEND_MESSAGE
        ▼
FastAPI WebSocket
        │
        ▼
Authentication
        │
        ▼
Membership validation
        │
        ▼
Message Service
        │
        ▼
Repository
        │
        ▼
SQLite
        │
        ▼
COMMIT
        │
        ├──────────────► Sender ACK
        │
        └──────────────► Recipient MESSAGE event
```

---

# 88. Example Conversation Loading Flow

```text
Frontend opens application
        │
        ▼
GET /auth/me
        │
        ▼
GET /conversations
        │
        ▼
User selects conversation
        │
        ▼
GET /conversations/{id}
        │
        ▼
GET /conversations/{id}/messages
        │
        ▼
Open WebSocket
        │
        ▼
Real-time session
```

---

# 89. Failure Handling

The frontend must handle:

```text
401 → redirect/login
403 → show permission error
404 → show not found
409 → show conflict
422 → show validation error
429 → retry later
500 → show generic error
network failure → offline/retry UI
```

Internal backend details must not be exposed to users.

---

# 90. Security Rules

The backend must never trust:

```text
conversation_id
user_id
message_id
role
```

provided by the frontend.

Every operation must validate ownership/membership/authorization server-side.

Example:

A user sending:

```text
POST /conversations/<Bob's conversation>/messages
```

does not prove that they belong to the conversation.

Membership must be checked.

---

# 91. API Acceptance Criteria

The API implementation is considered complete when:

```text
✓ Authentication works
✓ Session persists
✓ Logout revokes session
✓ Users can be searched
✓ Contacts can be added/removed
✓ Conversations can be listed
✓ Direct conversations can be created
✓ Groups can be created
✓ Group members can be listed
✓ Admins can add/remove members
✓ Messages can be loaded
✓ Messages persist
✓ Messages can be sent
✓ Receipts can be updated
✓ Authorization is enforced server-side
✓ Validation errors are consistent
✓ API responses are typed
✓ API documentation is available
✓ Health endpoint works
✓ Production CORS is restricted
```

---

# 92. Implementation Principle

The API should remain deliberately simple.

Do not build unnecessary microservices, GraphQL infrastructure, event buses, or distributed systems for this assignment.

The intended architecture is:

```text
Next.js
   │
   ├── REST
   │
   └── WebSocket
          │
          ▼
       FastAPI
          │
       Services
          │
    Repositories
          │
       SQLite
```

The goal is a clean, understandable full-stack system that can be confidently explained during the evaluation interview.

---

# 93. Authoritative Rule

This document defines the HTTP API contract.

If a frontend feature requires an endpoint not defined here:

1. determine whether it can use an existing endpoint
2. if not, define the endpoint here
3. update the implementation plan
4. then implement it

Do not silently invent API contracts inside frontend code.

**End of API_SPEC.md**

```
```
