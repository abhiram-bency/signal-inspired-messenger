# Architecture — Signal-Inspired Messenger

**Project:** Signal-Inspired Messenger
**Status:** Authoritative Architecture Specification
**Version:** 1.0
**Last Updated:** 2026-08-13

---

# 1. Purpose

This document defines the implementation architecture for the Signal-Inspired Messenger.

It translates the requirements in `MASTER_PROJECT_SPEC.md` into concrete:

* system boundaries
* application layers
* frontend structure
* backend structure
* data flow
* authentication flow
* real-time communication architecture
* state management strategy
* deployment topology
* module responsibilities
* dependency rules

This document is subordinate only to:

```text
docs/MASTER_PROJECT_SPEC.md
```

If an implementation decision conflicts with this document, the conflict must be resolved before implementation proceeds.

---

# 2. Architecture Goals

The architecture is designed around six goals:

1. **Fast development**
2. **Clear separation of concerns**
3. **Real-time messaging**
4. **Strong relational data modeling**
5. **Easy testing**
6. **Easy explanation during technical evaluation**

The architecture intentionally avoids unnecessary enterprise infrastructure.

This is a single deployable application consisting of:

```text
Next.js frontend
        +
FastAPI backend
        +
SQLite database
```

with WebSockets providing real-time communication.

---

# 3. High-Level System Architecture

```text
                         ┌───────────────────────┐
                         │        USER           │
                         │      Browser          │
                         └───────────┬───────────┘
                                     │
                       HTTPS / WSS   │
                                     │
                ┌────────────────────┴───────────────────┐
                │                                        │
                ▼                                        ▼
       ┌─────────────────┐                     ┌──────────────────┐
       │    Next.js      │                     │    WebSocket     │
       │    Frontend     │                     │    Connection    │
       │                 │                     │                  │
       │ React Components│                     │ Real-time events │
       │ Zustand         │                     │ Typing           │
       │ API Client      │                     │ Presence         │
       │ WS Client       │                     │ Messages         │
       └────────┬────────┘                     └────────┬─────────┘
                │                                       │
                │ REST                                  │ WS
                └────────────────┬──────────────────────┘
                                 ▼
                     ┌────────────────────────┐
                     │        FastAPI         │
                     │                        │
                     │ API Layer              │
                     │ Service Layer          │
                     │ WebSocket Layer        │
                     │ Authentication         │
                     └───────────┬────────────┘
                                 │
                                 ▼
                     ┌────────────────────────┐
                     │     Repository Layer   │
                     │                        │
                     │ User Repository        │
                     │ Conversation Repository│
                     │ Message Repository     │
                     │ Group Repository       │
                     └───────────┬────────────┘
                                 │
                                 ▼
                     ┌────────────────────────┐
                     │        SQLite          │
                     │                        │
                     │ Users                  │
                     │ Contacts               │
                     │ Conversations          │
                     │ Members                │
                     │ Messages               │
                     │ Receipts               │
                     │ Reactions              │
                     │ Sessions               │
                     └────────────────────────┘
```

---

# 4. Architectural Style

The backend follows a lightweight layered architecture.

```text
HTTP / WebSocket
       │
       ▼
Transport Layer
       │
       ▼
Service Layer
       │
       ▼
Repository Layer
       │
       ▼
Database
```

The frontend follows a component-oriented architecture:

```text
Pages / Routes
      │
      ▼
Feature Components
      │
      ├──────────────┐
      ▼              ▼
Custom Hooks      Zustand Stores
      │              │
      └──────┬───────┘
             ▼
       API / WebSocket
```

---

# 5. Architectural Principles

## 5.1 Single Responsibility

Each module should have one clear responsibility.

Examples:

```text
message_service.py
```

handles message business logic.

It should not render UI.

```text
MessageBubble.tsx
```

renders a message.

It should not directly access SQLite.

---

## 5.2 Dependency Direction

Dependencies flow inward:

```text
API / WebSocket
       ↓
Services
       ↓
Repositories
       ↓
Database
```

The reverse direction should not occur.

For example:

```text
Repository ❌ → FastAPI route
Database    ❌ → React component
Service     ❌ → React component
```

---

## 5.3 Transport Independence

Business logic should not depend heavily on whether an operation was triggered through:

* REST
* WebSocket
* internal service call

For example:

```text
MessageService.create_message()
```

should contain message creation rules.

Both:

```text
POST /messages
```

and:

```text
message.send
```

may call the same service behavior.

---

## 5.4 Server as Source of Truth

The frontend may use optimistic state for responsiveness, but the backend remains authoritative for:

* identity
* permissions
* conversation membership
* message persistence
* message IDs
* timestamps
* delivery/read state

---

# 6. Frontend Architecture

The frontend uses Next.js with TypeScript.

Recommended structure:

```text
frontend/
├── app/
│   ├── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── chat/
│       └── page.tsx
│
├── components/
│   ├── auth/
│   ├── chat/
│   ├── contacts/
│   ├── groups/
│   ├── settings/
│   ├── modals/
│   └── ui/
│
├── hooks/
│   ├── useAuth.ts
│   ├── useChat.ts
│   ├── useWebSocket.ts
│   └── usePresence.ts
│
├── lib/
│   ├── api.ts
│   ├── websocket.ts
│   └── utils.ts
│
├── stores/
│   ├── authStore.ts
│   ├── chatStore.ts
│   └── uiStore.ts
│
├── types/
│   ├── auth.ts
│   ├── user.ts
│   ├── conversation.ts
│   ├── message.ts
│   └── group.ts
│
└── ...
```

The exact directory structure may be adjusted slightly if implementation requires it, but feature boundaries must remain clear.

---

# 7. Frontend Route Architecture

## Public routes

```text
/
 /login
 /register
```

The root route may redirect according to authentication state.

---

## Protected routes

```text
/chat
```

Future settings may use:

```text
/settings
```

or an internal settings panel.

Authentication must be checked before rendering protected application state.

---

# 8. Frontend Component Responsibilities

## ChatLayout

Responsible for the primary desktop/mobile messaging layout.

It coordinates:

```text
ConversationList
+
ChatPane
```

It must not contain detailed message business logic.

---

## ConversationList

Responsible for:

* displaying conversations
* search
* sorting
* unread indicators
* selecting conversation

It receives conversation data from state/hooks.

---

## ConversationItem

Responsible for rendering one conversation preview.

Displays:

* avatar
* name
* last message
* timestamp
* unread count
* presence indicator

---

## ChatHeader

Responsible for:

* conversation identity
* participant status
* group information
* header actions

---

## MessageList

Responsible for:

* rendering message history
* date separators
* scrolling
* loading older messages
* grouping messages visually

---

## MessageBubble

Responsible for displaying one message.

Displays:

* content
* timestamp
* sender
* status
* reactions
* reply preview where enabled

---

## MessageComposer

Responsible for:

* input
* sending
* typing events
* attachment controls where enabled
* emoji/reaction controls where enabled

It must not directly manipulate the database.

---

# 9. Frontend State Management

Zustand is used for application-wide state that genuinely needs to be shared.

Recommended stores:

```text
authStore
chatStore
uiStore
```

---

# 10. Authentication State

`authStore` may contain:

```text
user
isAuthenticated
isLoading
```

It may expose:

```text
login()
logout()
restoreSession()
```

The server remains the source of truth.

---

# 11. Chat State

`chatStore` may contain:

```text
conversations
activeConversationId
messagesByConversation
typingUsers
presence
connectionState
```

The store should not contain raw persistence logic.

For example:

```text
chatStore.sendMessage()
```

may call the WebSocket client/service.

It should not contain SQL logic.

---

# 12. UI State

`uiStore` may contain:

```text
sidebarOpen
activeModal
theme
toast
mobileView
```

Transient component-specific state should remain inside components.

---

# 13. API Client

All REST requests should pass through a centralized API client.

Recommended:

```text
frontend/lib/api.ts
```

Responsibilities:

* base URL
* credentials
* JSON serialization
* common error handling
* authentication handling
* typed responses where practical

Components should avoid manually constructing fetch calls everywhere.

---

# 14. WebSocket Client

WebSocket functionality should be centralized.

Recommended:

```text
frontend/lib/websocket.ts
```

Responsibilities:

* connection
* authentication
* event serialization
* event parsing
* reconnection
* connection state
* event dispatch

React components should interact with a hook/store rather than directly managing raw sockets.

---

# 15. WebSocket Connection Lifecycle

```text
Component/Application starts
          │
          ▼
Check authentication
          │
          ▼
Open WebSocket
          │
          ▼
Authenticate connection
          │
          ▼
CONNECTED
          │
          ├───────────────┐
          │               │
          ▼               ▼
      Messages         Typing/Presence
          │               │
          └───────┬───────┘
                  │
                  ▼
              DISCONNECT
                  │
                  ▼
             RECONNECT
                  │
                  ▼
              CONNECTED
```

---

# 16. WebSocket Reconnection

The frontend should automatically attempt reconnection after an unexpected disconnect.

Recommended strategy:

```text
attempt 1 → 1 second
attempt 2 → 2 seconds
attempt 3 → 4 seconds
attempt 4 → 8 seconds
```

A reasonable upper bound may be applied.

After successful reconnection:

1. restore authenticated connection
2. refresh conversation state if necessary
3. synchronize messages that may have been missed

For the assignment, a simple synchronization through REST is acceptable.

---

# 17. Backend Architecture

Recommended structure:

```text
backend/
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── contacts.py
│   │   ├── conversations.py
│   │   ├── messages.py
│   │   └── groups.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── dependencies.py
│   │
│   ├── database/
│   │   ├── database.py
│   │   ├── models.py
│   │   └── seed.py
│   │
│   ├── repositories/
│   │   ├── user_repository.py
│   │   ├── contact_repository.py
│   │   ├── conversation_repository.py
│   │   ├── message_repository.py
│   │   └── group_repository.py
│   │
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── contact.py
│   │   ├── conversation.py
│   │   ├── message.py
│   │   └── group.py
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── contact_service.py
│   │   ├── conversation_service.py
│   │   ├── message_service.py
│   │   ├── group_service.py
│   │   └── presence_service.py
│   │
│   └── websocket/
│       ├── manager.py
│       ├── handlers.py
│       └── events.py
│
└── tests/
```

---

# 18. API Layer

The API layer is responsible for:

* receiving requests
* dependency injection
* authentication
* validation
* invoking services
* serializing responses
* HTTP status codes

API routes should remain thin.

Example conceptual flow:

```text
POST /api/v1/conversations/{id}/messages
                │
                ▼
         Validate request
                │
                ▼
        Authenticate user
                │
                ▼
        MessageService
                │
                ▼
       MessageRepository
                │
                ▼
             SQLite
```

---

# 19. Service Layer

Services contain business rules.

Example:

```text
MessageService
```

may:

1. validate conversation
2. verify membership
3. validate message content
4. create message
5. create initial receipt
6. update conversation timestamp
7. return domain result

The service should not know about React or frontend components.

---

# 20. Repository Layer

Repositories encapsulate database operations.

Example:

```text
MessageRepository
```

may expose:

```text
create()
get_by_id()
get_conversation_messages()
update()
delete()
```

Repositories should not make authorization decisions.

Authorization belongs to services.

---

# 21. Database Layer

SQLAlchemy models represent persistent entities.

The database layer is responsible for:

* engine configuration
* session creation
* ORM models
* schema initialization/migrations if used
* seed data

SQLite foreign keys must be enabled.

---

# 22. Database Session Strategy

Each API request should obtain an appropriate database session.

Conceptually:

```text
Request
   ↓
get_db()
   ↓
SQLAlchemy Session
   ↓
Service
   ↓
Repository
   ↓
commit/rollback
   ↓
Session close
```

Transactions must be used for multi-step operations where consistency matters.

---

# 23. Authentication Architecture

Authentication consists of:

```text
Registration
     ↓
OTP verification
     ↓
Credential/session creation
     ↓
Authenticated requests
```

The backend owns identity.

The frontend stores only what is necessary for UI state.

---

# 24. Authentication Request Flow

```text
Browser
   │
   │ POST /auth/register
   ▼
FastAPI
   │
   ▼
AuthService
   │
   ├── validate user
   └── create pending registration
   │
   ▼
OTP verification
   │
   ▼
Session/JWT
   │
   ▼
HTTP-only cookie
```

---

# 25. Protected API Flow

```text
Request
   │
   ▼
Authentication dependency
   │
   ▼
Extract session/JWT
   │
   ▼
Resolve current user
   │
   ▼
API endpoint
   │
   ▼
Service authorization
```

Authentication and authorization are separate concepts.

Authentication answers:

> Who is this user?

Authorization answers:

> Is this user allowed to perform this operation?

---

# 26. Authorization Model

Authorization must be enforced for:

### Conversations

User must be a member.

### Messages

Sender must belong to the conversation.

### Groups

Only administrators may:

* add members
* remove members
* modify group settings

### Contacts

User may only mutate their own contact list.

---

# 27. Direct Conversation Architecture

Direct messaging uses the same conversation abstraction as groups.

```text
Conversation
type = direct
       │
       ├── Member A
       └── Member B
```

A direct conversation must not have more than two active participants.

When starting a direct conversation:

```text
User A
  +
User B
  ↓
Find existing direct conversation
  │
  ├── exists → return it
  │
  └── doesn't exist
          ↓
      create it
```

This prevents duplicate direct conversations.

---

# 28. Group Conversation Architecture

```text
Conversation
type = group
       │
       ├── Admin A
       ├── Member B
       ├── Member C
       └── Member D
```

All messages use:

```text
conversation_id
```

There is no separate group-message implementation.

---

# 29. Message Creation Architecture

The canonical message creation flow is:

```text
Client
  │
  │ message.send
  ▼
WebSocket Handler
  │
  ▼
MessageService
  │
  ├── authenticate
  ├── authorize
  ├── validate
  │
  ▼
MessageRepository
  │
  ▼
SQLite
  │
  ▼
Message created
  │
  ├── update conversation
  ├── create receipt
  │
  ▼
WebSocket Manager
  │
  ▼
Broadcast to members
```

---

# 30. Message Status Architecture

The client may initially display:

```text
sending
```

The server confirms persistence:

```text
sent
```

When the recipient's active connection receives the message:

```text
delivered
```

When the recipient opens/views the conversation:

```text
read
```

The backend persists durable receipt state.

---

# 31. Typing Architecture

Typing is intentionally ephemeral.

```text
User presses key
       │
       ▼
typing.start
       │
       ▼
WebSocket server
       │
       ▼
Conversation members
       │
       ▼
typing.started
```

When the user stops:

```text
typing.stop
```

No database record is required.

---

# 32. Presence Architecture

Presence is managed through active WebSocket connections.

Conceptually:

```text
WebSocket connected
        ↓
user = online

WebSocket disconnected
        ↓
user = offline
        ↓
persist last_seen
```

Presence updates are broadcast to relevant users.

---

# 33. Conversation List Synchronization

Whenever a new message is created:

```text
message.created
      ↓
conversation.updated
      ↓
conversation.updated_at changes
      ↓
conversation list reorders
```

The latest conversation should appear at the top.

Unread counts should update for users who are not currently viewing the conversation.

---

# 34. Read Receipt Architecture

When a user opens a conversation:

```text
Frontend
   │
   │ message.read
   ▼
Backend
   │
   ├── verify membership
   ├── identify unread messages
   └── update receipts
   │
   ▼
Broadcast message.read
```

The sender's UI then updates from:

```text
delivered
```

to:

```text
read
```

---

# 35. Unread Count Architecture

Unread messages are determined from receipt state and/or conversation read position.

For the assignment, the implementation may use message receipts.

Conceptually:

```text
unread =
messages where
sender != current_user
AND receipt != read
```

The query should be optimized rather than loading every message into memory.

---

# 36. Optimistic Message Architecture

Frontend:

```text
Generate temporary client ID
        ↓
Render immediately
        ↓
status = sending
        ↓
Send WebSocket event
```

Server:

```text
Persist
   ↓
Return canonical message ID
```

Frontend reconciles:

```text
temporary ID
      ↓
canonical server ID
```

If the server fails:

```text
status = failed
```

and the UI provides retry behavior.

---

# 37. REST vs WebSocket Responsibilities

REST is responsible for:

```text
authentication
profile management
contact management
conversation creation
message history
group management
fallback operations
initial synchronization
```

WebSocket is responsible for:

```text
real-time messages
typing
presence
delivery events
read events
real-time conversation updates
```

This separation prevents the WebSocket layer from becoming the entire application API.

---

# 38. Error Handling Architecture

Backend errors should follow consistent HTTP semantics.

Examples:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error
```

The frontend maps known errors to user-friendly messages.

---

# 39. WebSocket Error Handling

WebSocket errors use structured events.

Conceptual:

```json id="pyx3rs"
{
  "type": "error",
  "payload": {
    "code": "MESSAGE_NOT_ALLOWED",
    "message": "You are not a member of this conversation."
  }
}
```

The client must not crash because of malformed or unexpected events.

---

# 40. Transaction Boundaries

Operations involving multiple database changes should use transactions.

Example group creation:

```text
BEGIN
  create conversation
  create creator membership
  create other memberships
COMMIT
```

If any required operation fails:

```text
ROLLBACK
```

The application must not leave partially created groups.

---

# 41. Concurrency Considerations

SQLite is sufficient for the assignment but has limited write concurrency.

The application should:

* keep transactions short
* avoid unnecessary long-running transactions
* avoid holding database sessions during WebSocket waits
* persist before broadcasting
* avoid blocking operations inside async WebSocket handlers where practical

This is sufficient for the expected demo scale.

---

# 42. Deployment Architecture

Target deployment:

```text
                     Internet
                         │
                         ▼
              ┌───────────────────┐
              │      Vercel       │
              │                   │
              │ Next.js Frontend  │
              └─────────┬─────────┘
                        │
                  HTTPS / WSS
                        │
                        ▼
              ┌───────────────────┐
              │      Render       │
              │                   │
              │ FastAPI Backend   │
              │ WebSocket Server  │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │       SQLite      │
              │ Persistent Disk   │
              └───────────────────┘
```

The exact cloud providers may change if deployment constraints require it, but the logical topology should remain.

---

# 43. CORS

Production CORS must allow only the deployed frontend origin.

Development may allow:

```text
http://localhost:3000
```

Production must not use:

```text
allow_origins=["*"]
```

when credentials are enabled.

---

# 44. Environment Separation

Development:

```text
localhost frontend
localhost backend
local SQLite
```

Production:

```text
Vercel frontend
Render backend
persistent SQLite
```

All environment-specific values must be configurable.

---

# 45. Logging

Backend logging should provide useful operational information.

Examples:

```text
WebSocket connected
WebSocket disconnected
Message persisted
Authentication failure
Authorization failure
Unhandled exception
```

Never log:

* passwords
* OTP secrets where inappropriate
* session tokens
* JWTs
* private message contents unnecessarily

---

# 46. Observability

For the assignment, full production observability infrastructure is unnecessary.

At minimum, provide:

* structured application logs
* health endpoint
* useful error messages
* WebSocket connection logging

Health endpoint:

```text
GET /health
```

Expected response:

```json id="6wkl1t"
{
  "status": "ok"
}
```

---

# 47. Security Boundaries

The following boundaries are mandatory:

```text
Browser
  │
  │ untrusted
  ▼
API
  │
  │ authenticated
  ▼
Service
  │
  │ authorized
  ▼
Repository
  │
  ▼
Database
```

Never assume frontend state is trustworthy.

---

# 48. Encryption Boundary

The application does not implement real Signal Protocol encryption.

Therefore:

```text
Client
   ↓
TLS
   ↓
Backend
   ↓
SQLite
```

is the actual transport/storage model.

Any UI encryption indicator must be clearly treated as simulated.

The README must disclose this limitation.

---

# 49. Dependency Management

Dependencies should be minimal.

Before adding a dependency, determine whether:

1. it solves a real requirement
2. it is maintained
3. the same result can reasonably be achieved with existing dependencies

AI agents must not add libraries merely because they are familiar.

---

# 50. Frontend Dependency Boundaries

UI components may depend on:

```text
React
Next.js
Tailwind
Lucide
Zod
React Hook Form
```

Feature components may depend on:

```text
hooks
stores
API client
types
```

Low-level utilities must not import high-level feature components.

---

# 51. Backend Dependency Boundaries

```text
API
 ↓
Services
 ↓
Repositories
 ↓
Database
```

Schemas should be shared only where appropriate.

Repositories must not import API routes.

Services must not import frontend code.

---

# 52. Testing Architecture

Testing follows three levels.

## Unit

Test isolated:

* services
* utility functions
* validation

## Integration

Test:

* API + database
* authentication
* conversation creation
* message persistence
* group permissions

## Real-Time

Test:

* WebSocket connection
* message broadcast
* typing events
* receipt events

Full end-to-end testing is desirable but secondary if time is limited.

---

# 53. Development Environment

Recommended local development:

```text
Terminal 1
──────────
cd backend
uvicorn app.main:app --reload

Terminal 2
──────────
cd frontend
npm run dev
```

Expected:

```text
Frontend → http://localhost:3000
Backend  → http://localhost:8000
API Docs → http://localhost:8000/docs
```

---

# 54. Docker Architecture

Docker is optional for local development but recommended for reproducibility.

Conceptually:

```text
docker-compose
      │
      ├── frontend
      │
      └── backend
             │
             └── SQLite volume
```

The Docker setup must not become a prerequisite for simple local development unless practical.

---

# 55. Health and Startup Sequence

Backend startup:

```text
load environment
      ↓
initialize logging
      ↓
initialize database
      ↓
create/validate schema
      ↓
optional seed
      ↓
start FastAPI
```

Seed operations must be idempotent.

Running seed multiple times must not create duplicate users/conversations.

---

# 56. Migration Strategy

Because SQLite is required and development time is limited, the initial implementation may use SQLAlchemy metadata/schema initialization.

If time permits, Alembic may be introduced for migrations.

If Alembic is used, migrations must remain synchronized with the actual models.

The project must not introduce a migration system merely for appearance.

---

# 57. Seed Strategy

Seed data should be isolated from production runtime logic.

Recommended:

```text
backend/seed.py
```

or:

```text
backend/app/database/seed.py
```

The seed command should be explicit.

Example:

```text
python seed.py
```

The README must document it.

---

# 58. UI Architecture Principles

The frontend must follow these principles:

### Reusable

Repeated patterns become components.

### Predictable

Component names should describe their responsibility.

### Typed

Avoid `any` unless genuinely necessary.

### Accessible

Interactive controls must have labels.

### Responsive

Do not build desktop-only components.

### Minimal

Avoid excessive UI abstractions.

---

# 59. Visual Architecture

The primary visual hierarchy is:

```text
Application
   │
   ├── Sidebar
   │     ├── Profile
   │     ├── Search
   │     └── Conversations
   │
   └── Chat
         ├── Header
         ├── Messages
         └── Composer
```

The visual system should use consistent:

* spacing
* typography
* radius
* borders
* shadows
* iconography
* interaction states

---

# 60. Mobile Architecture

The mobile application uses a navigation state:

```text
LIST
 │
 └── select conversation
          ↓
        CHAT
          │
          └── back
               ↓
             LIST
```

The desktop layout may display both simultaneously.

---

# 61. Performance Architecture

The frontend should:

* paginate messages
* debounce search
* avoid unnecessary state updates
* use stable keys
* avoid rendering unnecessary messages
* maintain efficient WebSocket listeners

The backend should:

* use indexed queries
* paginate message history
* avoid N+1 queries where practical
* avoid long database transactions

---

# 62. Message History Loading

Initial history:

```text
50 messages
```

Older messages:

```text
GET /messages?before=<cursor>
```

Cursor-based pagination is preferred over large offset queries.

The exact pagination contract is defined in `API_SPEC.md`.

---

# 63. Conversation Ordering

Conversation order is based on latest activity.

Primary rule:

```text
updated_at DESC
```

A new message updates:

```text
conversation.updated_at
```

Therefore the conversation automatically moves to the top.

---

# 64. Data Flow — Login

```text
User
 │
 ▼
Login Form
 │
 ▼
API Client
 │
 ▼
POST /auth/login
 │
 ▼
FastAPI
 │
 ▼
AuthService
 │
 ▼
Database
 │
 ▼
Session
 │
 ▼
HTTP-only Cookie
 │
 ▼
Frontend restore session
 │
 ▼
Chat Application
```

---

# 65. Data Flow — Add Contact

```text
User
 │
 ▼
Search
 │
 ▼
GET /users/search
 │
 ▼
Select user
 │
 ▼
POST /contacts
 │
 ▼
ContactService
 │
 ▼
Database
 │
 ▼
Updated contact list
```

---

# 66. Data Flow — Create Direct Conversation

```text
User selects contact
        │
        ▼
POST /conversations/direct
        │
        ▼
ConversationService
        │
        ├── check existing direct conversation
        │
        ├── create if absent
        │
        └── create members
        │
        ▼
Conversation returned
```

---

# 67. Data Flow — Create Group

```text
User
 │
 ▼
New Group Modal
 │
 ├── name
 └── members
 │
 ▼
POST /conversations/group
 │
 ▼
GroupService
 │
 ├── validate members
 ├── create conversation
 ├── create memberships
 └── assign creator as admin
 │
 ▼
Database
 │
 ▼
Group conversation
```

---

# 68. Data Flow — Send Message

```text
MessageComposer
      │
      ▼
Chat Store
      │
      ▼
WebSocket Client
      │
      ▼
FastAPI WebSocket
      │
      ▼
MessageService
      │
      ├── authenticate
      ├── authorize
      ├── validate
      │
      ▼
MessageRepository
      │
      ▼
SQLite
      │
      ▼
Broadcast
      │
      ├───────────────┐
      ▼               ▼
Sender             Recipient
```

---

# 69. Data Flow — Read Receipt

```text
Recipient opens conversation
          │
          ▼
Frontend identifies unread messages
          │
          ▼
message.read
          │
          ▼
FastAPI
          │
          ▼
MessageService
          │
          ▼
ReceiptRepository
          │
          ▼
SQLite
          │
          ▼
Broadcast message.read
          │
          ▼
Sender UI → ✓✓
```

---

# 70. Data Flow — Typing

```text
Keyboard input
      │
      ▼
typing.start
      │
      ▼
WebSocket
      │
      ▼
Conversation members
      │
      ▼
typing.started
      │
      ▼
UI
```

No database write occurs.

---

# 71. Data Flow — Presence

```text
WebSocket connection
       │
       ▼
Connection Manager
       │
       ▼
User marked online
       │
       ▼
Broadcast presence.changed
```

On disconnect:

```text
Connection lost
       │
       ▼
User marked offline
       │
       ▼
last_seen persisted
       │
       ▼
Broadcast
```

---

# 72. Failure Isolation

A failure in an optional subsystem must not break core messaging.

For example:

```text
Reaction failure
```

must not prevent:

```text
message delivery
```

Likewise:

```text
Presence unavailable
```

must not prevent:

```text
message sending
```

---

# 73. Graceful Degradation

If WebSocket temporarily fails:

```text
UI remains usable
        +
reconnection attempted
        +
REST may synchronize history
```

If an optional feature fails:

```text
core messaging remains functional
```

---

# 74. Architectural Anti-Patterns

The following are prohibited unless explicitly justified.

## Giant component

```text
ChatPage.tsx
```

containing:

* API
* WebSocket
* all state
* all rendering
* all business logic

---

## Giant backend route

One endpoint implementing:

* authorization
* database queries
* message creation
* broadcasting
* formatting

---

## Direct database access from routes everywhere

Use repositories/services for meaningful operations.

---

## Duplicate direct/group message logic

Use the common `Conversation` model.

---

## Frontend authorization

Never trust:

```text
isAdmin === true
```

from the browser.

---

## Polling for real-time messaging

WebSockets are required for the primary real-time path.

---

## Unnecessary infrastructure

Do not introduce:

```text
Redis
Kafka
Celery
Kubernetes
microservices
```

without a real requirement.

---

# 75. Architectural Trade-Offs

## SQLite

### Advantages

* required by assignment
* simple
* zero external database dependency
* easy local setup

### Limitations

* limited write concurrency
* not suitable for high-scale production

This is acceptable because assignment scale is small.

---

## WebSockets

### Advantages

* true real-time communication
* typing indicators
* presence
* delivery events

### Limitations

* connection lifecycle management
* reconnect complexity

The benefits directly match assignment requirements.

---

## Zustand

### Advantages

* small API
* simple global state
* less boilerplate

### Limitation

* requires discipline to avoid putting too much state globally

Therefore only major application state belongs in stores.

---

# 76. Scalability Boundary

The architecture is intentionally designed for a small-to-medium demonstration deployment.

It can conceptually evolve toward:

```text
Next.js
    ↓
Load Balancer
    ↓
Multiple FastAPI instances
    ↓
Redis Pub/Sub
    ↓
PostgreSQL
```

but that architecture is explicitly outside the current assignment.

Do not implement it.

---

# 77. Deployment Security

Production configuration should include:

```text
HTTPS
secure cookies where applicable
restricted CORS
non-debug mode
environment secrets
```

WebSocket connections must use:

```text
wss://
```

when deployed behind HTTPS.

---

# 78. Final Module Responsibility Matrix

| Module                   | Responsibility                   |
| ------------------------ | -------------------------------- |
| `app/api`                | HTTP transport                   |
| `app/services`           | business logic                   |
| `app/repositories`       | persistence                      |
| `app/database`           | ORM/database                     |
| `app/schemas`            | request/response validation      |
| `app/core`               | configuration/security           |
| `app/websocket`          | real-time transport              |
| `frontend/components`    | UI                               |
| `frontend/hooks`         | reusable frontend behavior       |
| `frontend/stores`        | shared client state              |
| `frontend/lib/api`       | REST client                      |
| `frontend/lib/websocket` | WebSocket client                 |
| `frontend/types`         | shared frontend type definitions |

---

# 79. Final Architecture Diagram

```text
                              USER
                               │
                               ▼
                    ┌────────────────────┐
                    │      Next.js       │
                    │      Frontend      │
                    ├────────────────────┤
                    │ Pages              │
                    │ Components         │
                    │ Hooks              │
                    │ Zustand            │
                    │ API Client         │
                    │ WebSocket Client   │
                    └───────┬─────┬──────┘
                            │     │
                       HTTPS│     │WSS
                            │     │
             ┌──────────────┘     └──────────────┐
             ▼                                    ▼
     ┌─────────────────────────────────────────────────┐
     │                    FASTAPI                      │
     ├─────────────────────────────────────────────────┤
     │                                                 │
     │  REST API              WebSocket Layer          │
     │      │                       │                  │
     │      └───────────┬───────────┘                  │
     │                  ▼                              │
     │             Services                           │
     │                  │                              │
     │                  ▼                              │
     │             Repositories                       │
     │                  │                              │
     └──────────────────┼──────────────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │    SQLite     │
                ├───────────────┤
                │ Users         │
                │ Contacts      │
                │ Conversations │
                │ Members       │
                │ Messages      │
                │ Receipts      │
                │ Reactions     │
                │ Attachments   │
                │ Sessions      │
                └───────────────┘
```

---

# 80. Architecture Acceptance Criteria

This architecture is considered correctly implemented when:

```text
✓ Frontend never accesses SQLite directly
✓ API routes remain thin
✓ Business rules reside in services
✓ Database operations reside in repositories
✓ WebSocket logic is isolated
✓ Authentication is centralized
✓ Authorization occurs server-side
✓ Direct and group messaging share Conversation
✓ Messages persist before broadcast
✓ Typing is transient
✓ Presence is primarily transient
✓ Receipts are persistent
✓ Frontend state is separated from transport
✓ REST and WebSocket responsibilities are clear
✓ Deployment supports WebSockets
✓ No unnecessary infrastructure exists
✓ Core functionality remains explainable
```

---

# 81. Implementation Rule

Before implementing any feature, determine:

```text
1. Which domain does it belong to?
2. Which layer owns the behavior?
3. Which persistent entities are involved?
4. Does it require REST, WebSocket, or both?
5. How is it authorized?
6. How is it tested?
7. How does the frontend represent its state?
```

If these questions cannot be answered clearly, the feature architecture is not ready for implementation.

---

# 82. Final Principle

The architecture should remain:

```text
                    SIMPLE
                       │
                       ▼
                 MODULAR
                       │
                       ▼
                 TESTABLE
                       │
                       ▼
                  REAL-TIME
                       │
                       ▼
                   POLISHED
```

The system should demonstrate professional engineering judgment without introducing complexity that does not contribute to the assignment.

**End of ARCHITECTURE.md**
