# MASTER PROJECT SPECIFICATION

## Signal-Inspired Messenger

**Project Type:** Full-Stack SDE Assignment
**Target Role:** Software Development Engineer Intern — Scalar AI Labs
**Status:** Authoritative Engineering Specification
**Version:** 1.0
**Date:** 2026-08-13

---

# 1. Purpose

This document is the authoritative specification for the Signal-Inspired Messenger project.

The application is a full-stack, real-time messaging platform inspired by the interaction patterns, visual language, and privacy-focused user experience of Signal Messenger.

The implementation must reproduce the core messaging workflows specified by the assignment while remaining an independently implemented application.

The project is **not** intended to implement the actual Signal Protocol or production-grade end-to-end cryptography. Encryption-related functionality may be mocked or simulated as explicitly permitted by the assignment.

This document is the primary source of truth for:

* application architecture
* technology choices
* feature scope
* database requirements
* API behavior
* WebSocket behavior
* frontend responsibilities
* backend responsibilities
* security boundaries
* testing requirements
* deployment expectations
* implementation priorities

If another document or AI-generated suggestion conflicts with this specification, this specification takes precedence unless it is explicitly updated.

---

# 2. Assignment Requirements

The application must support the following mandatory capabilities.

## 2.1 Authentication / Onboarding

The application must provide:

* user registration
* phone number or username registration
* mocked OTP verification
* display name setup
* profile avatar
* login
* logout
* session persistence

Real phone verification is not required.

Real cryptographic key exchange is not required.

---

## 2.2 Contacts and Conversations

The application must provide:

* conversation list
* conversations sorted by recent activity
* contact search
* conversation search
* adding contacts
* unread indicators
* last-message previews
* timestamps
* online indicators
* last-seen indicators

Presence information may be simulated.

---

## 2.3 One-to-One Messaging

The application must provide:

* real-time direct messaging
* text messages
* message persistence
* timestamps
* sending status
* sent status
* delivered status
* read status
* typing indicators
* delivery/read receipts
* message history

---

## 2.4 Group Messaging

The application must provide:

* group creation
* group name
* group members
* group messaging
* persistent group messages
* viewing group members
* adding members
* removing members
* administrator controls

---

## 2.5 Signal-Inspired Experience

The interface must provide a coherent Signal-inspired experience including:

* conversation navigation
* chat pane
* message bubbles
* search
* forms
* dialogs/modals
* filters where appropriate
* notifications/toasts
* settings
* privacy placeholders
* notification settings
* appearance settings
* responsive behavior

The application must feel like a messaging application rather than a generic CRUD demonstration.

---

# 3. Optional Features

The following features are secondary to the mandatory functionality.

They should only be implemented after all mandatory functionality is stable.

Priority order:

1. Dark mode
2. Message reactions
3. Reply-to messages
4. Responsive mobile layout
5. Attachments
6. Disappearing messages
7. Keyboard shortcuts

Optional features must never destabilize core messaging.

---

# 4. Placeholder Features

The following features may be represented by polished placeholder interfaces:

* voice calls
* video calls
* stories
* linked devices
* real end-to-end encryption
* cryptographic key exchange

Placeholder interactions should communicate:

> Coming Soon

or an equivalent polished message.

---

# 5. Engineering Goals

The project must optimize for the following qualities:

1. Functional correctness
2. Visual quality
3. Real-time reliability
4. Clean database design
5. Sensible API design
6. Modularity
7. Maintainability
8. Code readability
9. Testability
10. Deployment reliability
11. Developer experience
12. Ease of explanation during evaluation

The implementation should demonstrate sound software engineering judgment rather than unnecessary complexity.

---

# 6. Non-Goals

The following are explicitly outside the project's scope:

* production Signal Protocol implementation
* real SMS infrastructure
* real phone verification
* production identity verification
* microservice architecture
* Kafka/event streaming infrastructure
* Redis requirement
* PostgreSQL
* Kubernetes
* production-grade media storage
* voice/video infrastructure
* distributed presence infrastructure
* cryptographic key exchange

Do not introduce these technologies unless a specific implementation blocker requires them.

---

# 7. Technology Stack

## 7.1 Frontend

Required:

* Next.js
* TypeScript

Selected supporting technologies:

* Tailwind CSS
* Zustand
* React Hook Form
* Zod
* Lucide React

The frontend must use strongly typed interfaces for API and WebSocket data.

---

## 7.2 Backend

Required:

* Python
* FastAPI

Selected supporting technologies:

* SQLAlchemy 2.x
* Pydantic v2
* WebSockets
* PyJWT or equivalent JWT implementation
* passlib/bcrypt or equivalent password hashing library where passwords are used

---

## 7.3 Database

Required:

* SQLite

ORM:

* SQLAlchemy 2.x

The schema must use proper:

* primary keys
* foreign keys
* uniqueness constraints
* indexes
* timestamps
* relationship modeling

---

## 7.4 Testing

Backend:

* pytest

Frontend:

* Vitest and/or React Testing Library where practical

At minimum, tests must cover critical backend behavior.

---

## 7.5 Deployment

Target:

* frontend → Vercel
* backend → Render or equivalent
* SQLite → persistent storage where supported

The deployment architecture must support WebSocket connections.

The final deployed application must be accessible through a public URL.

---

# 8. Repository Structure

The target repository structure is:

```text
signal-inspired-messenger/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── stores/
│   ├── types/
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── database/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── websocket/
│   │
│   ├── tests/
│   ├── seed.py
│   └── ...
│
├── docs/
│   ├── MASTER_PROJECT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_SPEC.md
│   ├── WEBSOCKET_PROTOCOL.md
│   ├── IMPLEMENTATION_PLAN.md
│   └── AI_AGENT_RULES.md
│
├── screenshots/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── README.md
├── docker-compose.yml
├── .gitignore
└── LICENSE
```

The exact internal organization may evolve slightly during implementation, but the architectural boundaries must remain intact.

---

# 9. High-Level Architecture

The system follows a layered client-server architecture.

```text
┌───────────────────────────────────────────────────────────────┐
│                         USER BROWSER                          │
│                                                               │
│                    Next.js / React / TS                       │
│                                                               │
│  Auth │ Conversations │ Contacts │ Chat │ Groups │ Settings   │
└───────────────────────┬───────────────────────┬───────────────┘
                        │                       │
                  HTTPS / REST              WebSocket
                        │                       │
                        └───────────┬───────────┘
                                    ▼
┌───────────────────────────────────────────────────────────────┐
│                         FASTAPI                               │
│                                                               │
│ API Layer                                                    │
│ ├── Authentication                                           │
│ ├── Users                                                    │
│ ├── Contacts                                                 │
│ ├── Conversations                                            │
│ ├── Messages                                                 │
│ └── Groups                                                   │
│                                                               │
│ Service Layer                                                │
│ ├── Auth Service                                             │
│ ├── Conversation Service                                     │
│ ├── Message Service                                          │
│ ├── Group Service                                            │
│ └── Presence Service                                         │
│                                                               │
│ WebSocket Layer                                              │
│ ├── Connection Manager                                       │
│ ├── Event Validation                                         │
│ └── Conversation Broadcasting                                │
│                                                               │
│ Repository Layer                                             │
└────────────────────────────┬──────────────────────────────────┘
                             ▼
┌───────────────────────────────────────────────────────────────┐
│                          SQLite                               │
│                                                               │
│ Users │ Contacts │ Conversations │ Members │ Messages         │
│ Receipts │ Reactions │ Attachments │ Sessions                 │
└───────────────────────────────────────────────────────────────┘
```

---

# 10. Architectural Rules

## Rule 1 — Frontend never accesses the database

The frontend must communicate only through:

* REST API
* WebSocket

It must never contain database access logic.

---

## Rule 2 — API routes do not contain complex business logic

API endpoints should:

1. authenticate request
2. validate input
3. call service
4. return response

Business logic belongs in services.

---

## Rule 3 — Services own business rules

Examples:

* validating conversation membership
* determining group administrator permissions
* creating messages
* updating read receipts
* adding/removing members
* determining unread counts

---

## Rule 4 — Repositories own database operations

Repository classes/functions should handle:

* queries
* inserts
* updates
* deletes
* relationship loading

---

## Rule 5 — WebSocket events follow a defined protocol

WebSocket messages must not be arbitrary JSON structures.

Every event must contain a predictable event type and payload.

---

## Rule 6 — Persistence happens before broadcast

For outgoing messages:

```text
Validate
   ↓
Persist
   ↓
Generate message state
   ↓
Broadcast
```

The application must not broadcast a successfully-looking message that failed to persist.

---

## Rule 7 — Authorization is enforced server-side

The frontend must never be trusted to determine:

* group administrator privileges
* conversation membership
* message ownership
* contact ownership

The backend must validate all permissions.

---

## Rule 8 — Core functionality before bonuses

Optional features must never delay or destabilize:

* authentication
* conversations
* messaging
* WebSockets
* receipts
* groups

---

# 11. Domain Model

The core domain is centered around:

```text
User
  │
  ├── Contacts
  │
  └── Conversation Membership
            │
            ▼
       Conversation
            │
            └── Messages
                    │
                    ├── Receipts
                    ├── Reactions
                    ├── Reply
                    └── Attachments
```

Both direct and group messaging use the same `Conversation` abstraction.

---

# 12. User Model

A user represents an application account.

Required properties:

```text
id
username
phone_number
password_hash / authentication credential
display_name
avatar_url
status
last_seen
created_at
updated_at
```

Rules:

* username must be unique
* phone number must be unique when provided
* display name is required
* avatar is optional
* status may represent online/offline state
* last_seen must be persisted

---

# 13. Contact Model

Contacts represent user-to-user relationships.

A contact belongs to an owner.

Example:

```text
Alice → Bob
```

does not automatically imply:

```text
Bob → Alice
```

unless explicitly created.

The implementation may provide a symmetric contact experience at the application layer, but database ownership must remain unambiguous.

Required properties:

```text
id
owner_id
contact_id
created_at
```

Constraint:

```text
UNIQUE(owner_id, contact_id)
```

A user cannot add themselves as a contact.

---

# 14. Conversation Model

A conversation represents a messaging channel.

Supported types:

```text
direct
group
```

Required properties:

```text
id
type
name
avatar_url
created_by
created_at
updated_at
```

For direct conversations:

* exactly two members

For group conversations:

* one or more members
* at least one administrator

---

# 15. Conversation Membership

Required properties:

```text
conversation_id
user_id
role
joined_at
left_at
```

Roles:

```text
admin
member
```

Primary key:

```text
(conversation_id, user_id)
```

Rules:

* a user can appear only once in a conversation
* direct conversations cannot contain more than two active participants
* groups must always retain an administrator
* only administrators may remove members
* only administrators may modify group membership

---

# 16. Message Model

A message represents user-generated content.

Required fields:

```text
id
conversation_id
sender_id
content
message_type
reply_to_id
created_at
edited_at
expires_at
```

Supported message types initially:

```text
text
```

Optional future values:

```text
image
file
system
```

A message belongs to exactly one conversation.

A message sender must be a member of the conversation.

---

# 17. Message Receipts

Message delivery state must be represented separately from the message itself.

Supported states:

```text
sent
delivered
read
```

Conceptual state machine:

```text
SENDING
   │
   ▼
 SENT
   │
   ▼
DELIVERED
   │
   ▼
 READ
```

For a direct conversation:

```text
Sender sends message
       ↓
Database persistence
       ↓
SENT
       ↓
Recipient WebSocket receives
       ↓
DELIVERED
       ↓
Recipient opens conversation
       ↓
READ
```

The UI must translate these states into a Signal-inspired checkmark experience.

---

# 18. Typing Indicators

Typing indicators are transient state.

They do not need to be persisted.

Events:

```text
typing.start
typing.stop
```

The backend should forward typing events only to relevant conversation members.

Typing indicators should automatically expire on the frontend if a stop event is missed.

Recommended timeout:

```text
3 seconds
```

---

# 19. Presence

Presence is also primarily transient.

Supported conceptual states:

```text
online
offline
```

`last_seen` should be persisted.

Presence may be simulated for demo purposes.

The application should clearly separate:

```text
current online state
```

from:

```text
persisted last-seen timestamp
```

---

# 20. Group Model

Groups are specialized conversations.

Required functionality:

* create group
* set name
* select initial members
* send messages
* display group avatar/name
* view members
* add members
* remove members
* administrator controls

Group creation flow:

```text
New Group
   ↓
Group Name
   ↓
Select Contacts
   ↓
Create
   ↓
Conversation Created
```

The creator automatically becomes an administrator.

---

# 21. Group Administration

Only administrators may:

* add members
* remove members
* change group settings where supported

Members may:

* view members
* send messages
* leave group

If the last administrator attempts to leave:

* either transfer administration
* or prevent leaving

For the time-constrained implementation, preventing the final administrator from leaving is acceptable.

---

# 22. Authentication

Authentication is intentionally mocked.

Recommended flow:

```text
Register
   ↓
username / phone
   ↓
OTP
   ↓
fixed verification code
   ↓
profile setup
   ↓
authenticated session
```

Demo OTP:

```text
123456
```

The OTP must not be represented as a real SMS mechanism.

---

# 23. Session Management

The application must maintain authentication across page refreshes.

Recommended implementation:

```text
JWT/session token
+
HTTP-only cookie
```

The frontend should obtain authenticated user information through an API request rather than trusting locally stored identity data.

Logout must invalidate the client session.

---

# 24. Authentication API

Expected conceptual endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/verify-otp
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

Exact request/response schemas are defined in:

```text
docs/API_SPEC.md
```

---

# 25. User API

Expected endpoints:

```text
GET   /api/v1/users/me
PATCH /api/v1/users/me
GET   /api/v1/users/search
GET   /api/v1/users/{user_id}
```

The search endpoint must support finding users by:

* username
* display name
* phone number where permitted

---

# 26. Contacts API

Expected endpoints:

```text
GET    /api/v1/contacts
POST   /api/v1/contacts
DELETE /api/v1/contacts/{contact_id}
GET    /api/v1/contacts/search
```

Server-side validation is required.

---

# 27. Conversation API

Expected endpoints:

```text
GET  /api/v1/conversations
POST /api/v1/conversations/direct
POST /api/v1/conversations/group
GET  /api/v1/conversations/{conversation_id}
GET  /api/v1/conversations/{conversation_id}/messages
```

Conversation list ordering:

```text
conversation.updated_at DESC
```

The latest message activity should update the conversation timestamp.

---

# 28. Message API

Expected endpoints:

```text
POST /api/v1/conversations/{conversation_id}/messages
GET  /api/v1/conversations/{conversation_id}/messages
POST /api/v1/messages/{message_id}/read
PATCH /api/v1/messages/{message_id}
DELETE /api/v1/messages/{message_id}
```

The WebSocket is preferred for real-time creation, while REST remains useful for:

* history loading
* fallback operations
* initial synchronization
* explicit state changes

---

# 29. Group API

Expected endpoints:

```text
GET    /api/v1/conversations/{conversation_id}/members
POST   /api/v1/conversations/{conversation_id}/members
DELETE /api/v1/conversations/{conversation_id}/members/{user_id}
PATCH  /api/v1/conversations/{conversation_id}
```

Every membership mutation must validate administrator permissions.

---

# 30. WebSocket Architecture

WebSocket endpoint:

```text
/ws
```

or equivalent versioned endpoint.

Authentication must occur during WebSocket connection establishment.

The backend maintains a connection manager conceptually equivalent to:

```text
user_id → active websocket connections
```

and may additionally track:

```text
conversation_id → connected users
```

---

# 31. WebSocket Client Events

Supported events:

```text
message.send
message.read
typing.start
typing.stop
presence.update
```

---

# 32. WebSocket Server Events

Supported events:

```text
message.created
message.status
message.read
typing.started
typing.stopped
presence.changed
conversation.updated
```

---

# 33. Message Event Contract

Conceptual event:

```json
{
  "type": "message.created",
  "payload": {
    "id": "message-id",
    "conversation_id": "conversation-id",
    "sender_id": "user-id",
    "content": "Hello",
    "message_type": "text",
    "created_at": "2026-08-13T12:00:00Z"
  }
}
```

All timestamps must use ISO 8601 representation.

---

# 34. Real-Time Message Lifecycle

The expected flow is:

```text
┌──────────────┐
│ User types   │
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ Client creates  │
│ optimistic msg │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ WebSocket send  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Authenticate    │
│ + authorize     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Persist message │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Broadcast       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Recipients      │
│ receive message │
└─────────────────┘
```

---

# 35. Frontend State Management

Global application state should be limited to genuinely global concerns.

Recommended stores:

```text
authStore
chatStore
uiStore
```

The chat store may manage:

```text
activeConversation
conversations
messages
typingUsers
presence
connectionState
```

Avoid putting every component state into global state.

Local UI state should remain local.

---

# 36. Frontend Component Architecture

Core components should include:

```text
ChatLayout
ConversationList
ConversationItem
ChatHeader
MessageList
MessageBubble
MessageComposer
TypingIndicator
MessageStatus
SearchBar
ContactList
GroupDetails
GroupMemberList
NewConversationModal
NewGroupModal
SettingsPanel
```

Components must have focused responsibilities.

Avoid massive components containing:

* API calls
* WebSocket management
* database-like state manipulation
* rendering
* business rules

all in one file.

---

# 37. Signal-Inspired Visual Language

The interface should prioritize:

* minimalism
* clean spacing
* rounded message bubbles
* subtle borders
* restrained colors
* clear typography
* strong hierarchy
* familiar messaging patterns
* low visual noise

The UI must not look like:

* Discord
* Slack
* Telegram
* a generic Bootstrap admin dashboard

The goal is specifically a Signal-inspired messaging experience.

---

# 38. Main Application Layout

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│                         Application                          │
├───────────────────────┬─────────────────────────────────────┤
│ Conversation Sidebar  │ Chat Pane                           │
│                       │                                     │
│ Profile               │ Chat Header                         │
│ Search                ├─────────────────────────────────────┤
│                       │                                     │
│ Conversation 1        │ Message                             │
│ Conversation 2        │                                     │
│ Conversation 3        │              Message               │
│ Group                 │                                     │
│                       │ Message                             │
│                       │                                     │
│                       ├─────────────────────────────────────┤
│                       │ Message Composer                    │
└───────────────────────┴─────────────────────────────────────┘
```

On mobile, the layout should transition between:

```text
conversation list
```

and:

```text
chat view
```

rather than displaying both simultaneously.

---

# 39. Message Bubble Requirements

Outgoing messages:

* aligned right
* distinct bubble style
* timestamp
* delivery status

Incoming messages:

* aligned left
* sender information where appropriate
* timestamp

Consecutive messages from the same sender should visually group together.

---

# 40. Conversation List Requirements

Each conversation item should show:

```text
Avatar
Name
Last message preview
Timestamp
Unread count
```

Example:

```text
┌──────────────────────────────────────┐
│  [A] Alice Johnson             8:42  │
│      Are we still meeting?       2   │
└──────────────────────────────────────┘
```

Selected conversations must have a clear visual state.

---

# 41. Search

Search must support:

* conversation names
* contact names
* usernames

Search should be responsive and visually integrated with the sidebar.

Search results must not expose unauthorized user information.

---

# 42. Notifications and Toasts

Use non-intrusive toast notifications for:

* login errors
* invalid OTP
* message send failures
* contact added
* group created
* member added/removed
* connection lost
* reconnection
* unexpected server errors

Do not overuse notifications.

---

# 43. Error Handling

Backend errors must use consistent HTTP responses.

Frontend must display human-readable errors.

Example:

```json
{
  "detail": "You are not a member of this conversation."
}
```

The UI should never display raw stack traces.

---

# 44. Loading States

Every network-dependent UI should have appropriate loading behavior.

Examples:

```text
Loading conversations...
Loading messages...
Sending...
Creating group...
Updating profile...
```

Skeletons or subtle spinners are preferred over blank screens.

---

# 45. Empty States

Required empty states include:

### No conversation selected

```text
Select a conversation to start messaging.
```

### No search results

```text
No conversations found.
```

### No contacts

```text
You haven't added any contacts yet.
```

### No group members

Not applicable to valid groups, but defensive UI should exist.

---

# 46. Offline / WebSocket Failure

The frontend must track WebSocket state:

```text
connected
connecting
disconnected
reconnecting
```

When disconnected:

* show a subtle connection indicator
* attempt reconnection
* avoid crashing the chat UI

Messages that fail to send should visibly indicate failure.

---

# 47. Optimistic UI

Message sending should feel instantaneous.

Recommended flow:

```text
Click Send
    ↓
Immediately render message
    ↓
status = sending
    ↓
server acknowledgement
    ↓
status = sent
```

If the server rejects the message:

```text
status = failed
```

The user should have an opportunity to retry.

---

# 48. Database Indexing

Indexes should be added for common query patterns.

At minimum consider indexes on:

```text
users.username
users.phone_number
messages.conversation_id
messages.created_at
conversation_members.user_id
conversation_members.conversation_id
message_receipts.message_id
message_receipts.user_id
```

Avoid indiscriminately indexing every column.

---

# 49. Database Integrity

Foreign key constraints must be enabled for SQLite.

The backend must enforce:

* valid foreign keys
* unique usernames
* unique phone numbers
* unique conversation memberships
* valid message sender membership
* valid group administration

Database constraints should complement, not replace, service-level validation.

---

# 50. Seed Data

The application must ship with meaningful seed data.

Minimum recommended seed:

```text
6–8 users
3+ direct conversations
2+ group conversations
30+ messages
multiple unread messages
different receipt states
realistic timestamps
```

Seed users should have:

* names
* usernames
* avatars
* online/offline states

The demo environment should never open to an empty application.

---

# 51. Demo Accounts

At least one easy-to-use demo account must exist.

Recommended:

```text
Username: demo
OTP: 123456
```

Additional users:

```text
alice
bob
charlie
```

with the same mocked OTP.

The exact credentials must be documented in README.

---

# 52. Mock Encryption

The UI may communicate privacy-oriented concepts but must not falsely claim real end-to-end encryption.

If an encryption indicator is displayed, it should be clearly understood as simulated.

Recommended implementation:

```text
Message content
      ↓
simulated encryption metadata
      ↓
database
```

Do not implement actual cryptographic protocol behavior merely to imitate Signal.

README must explicitly state that cryptography is mocked.

---

# 53. Security Requirements

Even though this is a mock assignment, basic security practices are required.

The backend must:

* validate all input
* authenticate protected endpoints
* authorize conversation membership
* authorize group administration
* prevent self-contact
* avoid exposing sensitive fields
* avoid trusting frontend roles
* use secure session handling where possible
* avoid logging passwords or tokens

The application must not hardcode production secrets.

---

# 54. Environment Configuration

Configuration must be environment-based.

Example:

```text
DATABASE_URL
JWT_SECRET
FRONTEND_URL
CORS_ORIGINS
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_WS_URL
```

Development defaults may be provided where safe.

Secrets must never be committed.

---

# 55. API Versioning

All REST endpoints should use:

```text
/api/v1/
```

This makes the API structure explicit and allows future evolution.

---

# 56. API Documentation

FastAPI's automatically generated documentation should remain enabled in development.

Expected:

```text
/docs
```

and:

```text
/openapi.json
```

The README should link to the deployed API documentation where publicly available.

---

# 57. Testing Strategy

Testing should prioritize business-critical paths.

Backend tests must cover at least:

```text
registration
OTP verification
login
conversation creation
message creation
message persistence
conversation authorization
group creation
group membership authorization
message receipts
```

Integration testing should verify the critical message lifecycle.

---

# 58. Frontend Testing Priority

Frontend tests should focus on:

```text
authentication UI
conversation rendering
message rendering
composer behavior
message status
group member UI
```

Do not spend excessive time creating tests for trivial presentational components.

---

# 59. End-to-End Verification

Before submission, manually verify:

```text
□ Register
□ OTP verification
□ Login
□ Logout
□ Refresh session
□ Search user
□ Add contact
□ Start direct conversation
□ Send message
□ Receive message in second browser
□ Typing indicator
□ Delivered receipt
□ Read receipt
□ Unread count
□ Create group
□ Add group members
□ Remove group member
□ Group messaging
□ Profile update
□ Settings
□ Dark mode if implemented
□ Mobile layout
□ WebSocket reconnect
□ Seed data
```

---

# 60. Git Strategy

Commits should represent meaningful milestones.

Preferred examples:

```text
feat: initialize full-stack project
feat: implement database schema
feat: add seed data
feat: implement authentication
feat: implement contacts and conversations
feat: implement direct messaging
feat: add websocket messaging
feat: add delivery and read receipts
feat: implement group conversations
feat: add Signal-inspired interface
feat: add message reactions
feat: add dark mode
test: add messaging integration tests
docs: add architecture and API documentation
chore: configure deployment
```

Avoid giant meaningless commits.

---

# 61. CI Requirements

GitHub Actions should execute:

```text
frontend lint
frontend build
backend lint
backend tests
```

A pull request or push should fail when critical checks fail.

The CI workflow must remain lightweight.

---

# 62. Documentation Requirements

README must include:

1. Project overview
2. Screenshots
3. Live demo
4. Features
5. Tech stack
6. Architecture
7. Database schema
8. API overview
9. WebSocket overview
10. Local setup
11. Environment variables
12. Demo credentials
13. Testing
14. Deployment
15. Assumptions
16. Security limitations
17. Mock encryption disclaimer
18. Future improvements

---

# 63. Architecture Documentation

`docs/ARCHITECTURE.md` must explain:

```text
Frontend
Backend
REST
WebSockets
Services
Repositories
Database
Authentication
Real-time event flow
Deployment
```

Include architecture diagrams.

---

# 64. Database Documentation

`docs/DATABASE_DESIGN.md` must explain:

* entities
* relationships
* keys
* constraints
* indexes
* design decisions
* direct vs group conversation modeling

Include an ER diagram.

---

# 65. API Documentation

`docs/API_SPEC.md` must document:

* endpoint
* method
* authentication
* request body
* response
* errors

The documentation must correspond to the actual implementation.

---

# 66. WebSocket Documentation

`docs/WEBSOCKET_PROTOCOL.md` must document:

* connection
* authentication
* client events
* server events
* payloads
* message lifecycle
* reconnection
* errors

---

# 67. AI-Assisted Development Rules

AI tools are explicitly permitted by the assignment.

AI may be used extensively.

However:

* generated code must be reviewed
* generated code must be tested
* architecture must remain under project control
* AI must not introduce unnecessary dependencies
* AI must not rewrite working components without justification
* AI must not invent APIs
* AI must not invent database fields without updating schema documentation
* AI must not silently change architectural decisions

Every major AI-generated feature must be understood by the developer before submission.

---

# 68. AI Agent Constraints

Coding agents must:

1. Read this specification before implementation.
2. Read the relevant architecture documents.
3. Inspect existing code before modifying it.
4. Preserve working functionality.
5. Follow established naming conventions.
6. Avoid unnecessary dependencies.
7. Run tests after meaningful changes.
8. Report failures rather than hiding them.
9. Avoid speculative refactoring.
10. Keep implementation proportional to assignment scope.

Agents must not:

* replace SQLite with another database
* replace FastAPI
* replace Next.js
* introduce microservices
* implement unnecessary infrastructure
* remove required features to simplify implementation
* claim a feature works without testing it

---

# 69. Scope Control

The following priority hierarchy is mandatory.

## P0 — Critical

```text
Authentication
Database
Conversation list
Direct messaging
Persistence
WebSockets
Receipts
Typing
Groups
Signal-like UI
Deployment
```

## P1 — Important

```text
Search
Contacts
Presence
Unread counts
Settings
Responsive design
Dark mode
```

## P2 — Bonus

```text
Reactions
Reply-to
Attachments
Disappearing messages
Keyboard shortcuts
```

## P3 — Placeholder

```text
Calls
Stories
Linked devices
Real E2EE
```

If time becomes limited:

```text
P3 → P2 → P1
```

features may be reduced.

P0 functionality must not be sacrificed.

---

# 70. Performance Expectations

This is a small assignment application, not a high-scale production messaging system.

Nevertheless:

* avoid unnecessary database queries
* paginate message history
* avoid loading entire message history unnecessarily
* debounce search
* avoid unnecessary React rerenders
* maintain a single WebSocket connection per active authenticated session where practical

Recommended message pagination:

```text
initial load: 50 messages
```

Older messages may be loaded incrementally.

---

# 71. Accessibility

The application should include:

* keyboard-accessible controls
* semantic buttons
* visible focus states
* accessible labels
* sufficient contrast
* sensible keyboard navigation

Accessibility should be treated as part of UI quality.

---

# 72. Responsive Design

Desktop is the primary demonstration target.

The application must still provide a usable:

```text
mobile
tablet
desktop
```

experience.

Mobile behavior:

```text
Conversation List
       ↓
select conversation
       ↓
Chat View
       ↓
Back
       ↓
Conversation List
```

---

# 73. Dark Mode

If implemented, dark mode must cover:

* sidebar
* chat background
* message bubbles
* inputs
* dialogs
* settings
* text
* borders
* hover states

No component should remain visually broken when switching themes.

---

# 74. Optional Message Reactions

If implemented:

```text
message
   ↓
reaction picker
   ↓
emoji
   ↓
reaction stored
   ↓
broadcast
```

Multiple users may react to the same message.

A user should not duplicate the same reaction unless intentionally supported.

---

# 75. Optional Reply-to

If implemented, messages may reference another message:

```text
reply_to_id
```

UI:

```text
┌───────────────────────────────┐
│ Alice                         │
│ "Are we meeting at 5?"       │
├───────────────────────────────┤
│ Yes, I'll be there.           │
└───────────────────────────────┘
```

The referenced message must belong to the same conversation.

---

# 76. Optional Disappearing Messages

If implemented:

```text
expires_at
```

determines message expiration.

The backend must not simply hide expired messages on the frontend.

Expiration should be enforced by backend/database behavior.

For the assignment, a simple periodic cleanup mechanism is sufficient.

---

# 77. Optional Attachments

If implemented, attachments must use metadata:

```text
file_name
mime_type
file_size
file_url
```

Large binary files must not be stored directly in SQLite as the default design.

For a demo implementation, local/cloud file storage may be used.

---

# 78. Settings

The settings interface must include polished placeholders or functional controls for:

```text
Profile
Privacy
Notifications
Appearance
About
```

Examples:

```text
Privacy
  Read receipts       ON
  Typing indicators   ON
  Last seen           ON

Notifications
  Notifications       ON
  Sounds              ON

Appearance
  Theme               System
```

Settings may be persisted locally if backend persistence is not necessary.

---

# 79. Error Recovery

The system must degrade gracefully.

Examples:

### Backend unavailable

Display:

```text
Unable to connect to server.
Retrying...
```

### WebSocket unavailable

Display:

```text
Reconnecting...
```

### Message failure

Display:

```text
Failed to send
Retry
```

### Invalid group operation

Display a clear server error.

---

# 80. Deployment Requirements

Before submission:

```text
Frontend deployed
Backend deployed
Database initialized
Seed data available
WebSocket functioning
Environment variables configured
CORS configured
Demo credentials working
```

The deployed application must not depend on the developer's local machine.

---

# 81. Production Configuration

Development and production configurations must be separated.

Production must:

* use production API URLs
* use secure cookie configuration where supported
* restrict CORS
* avoid debug stack traces
* use production frontend builds
* use persistent database storage

---

# 82. Demo Experience

The deployed application must open into a polished onboarding experience.

A reviewer should be able to:

```text
Open URL
   ↓
Login
   ↓
See seeded conversations
   ↓
Open chat
   ↓
Send message
   ↓
See real-time behavior
```

without reading the source code.

---

# 83. Recruiter Evaluation Strategy

The project should make the following engineering decisions easy to identify:

### Why FastAPI?

Lightweight asynchronous API framework with native WebSocket support and automatic API documentation.

### Why SQLite?

Explicit assignment requirement and sufficient for the application's scale.

### Why a unified Conversation model?

Avoids duplicating direct/group message logic.

### Why WebSockets?

Required real-time communication without polling.

### Why service/repository separation?

Separates business rules from persistence and API transport.

### Why mock encryption?

The assignment explicitly permits simulated encryption and focuses on messaging workflows rather than cryptographic protocol implementation.

---

# 84. Interview Explanation Requirements

The developer must be able to explain:

```text
1. Overall architecture
2. Database relationships
3. Authentication flow
4. WebSocket connection lifecycle
5. Message persistence flow
6. Delivery/read receipts
7. Group permissions
8. State management
9. Error handling
10. Deployment architecture
```

The project must not contain abstractions that cannot be explained.

---

# 85. Final Quality Bar

Before submission, the application must satisfy:

```text
FUNCTIONALITY
✓ Core workflows work

REAL-TIME
✓ Messages arrive without refresh

DATABASE
✓ Normalized relational design

BACKEND
✓ Clean API boundaries

FRONTEND
✓ Reusable components

UI
✓ Strong Signal-inspired visual language

SECURITY
✓ Server-side authorization

TESTING
✓ Critical paths tested

DOCUMENTATION
✓ README complete

DEPLOYMENT
✓ Public working URL

GITHUB
✓ Clean repository

CODE UNDERSTANDING
✓ Every major subsystem explainable
```

---

# 86. Definition of Done

The project is considered complete only when:

### Authentication

```text
✓ Registration works
✓ OTP verification works
✓ Login works
✓ Logout works
✓ Session survives refresh
```

### Contacts

```text
✓ User search works
✓ Add contact works
✓ Contact list works
```

### Conversations

```text
✓ Direct conversations work
✓ Conversation list sorted correctly
✓ Last message preview works
✓ Unread counts work
✓ Search works
```

### Messaging

```text
✓ Messages send
✓ Messages persist
✓ Messages appear in real time
✓ Timestamps display
✓ Sending state works
✓ Sent state works
✓ Delivered state works
✓ Read state works
✓ Typing indicator works
```

### Groups

```text
✓ Group creation works
✓ Group messages work
✓ Members can be viewed
✓ Admin can add members
✓ Admin can remove members
✓ Data persists
```

### UI

```text
✓ Signal-inspired layout
✓ Responsive behavior
✓ Loading states
✓ Empty states
✓ Error states
✓ Toasts
✓ Settings
```

### Deployment

```text
✓ Frontend deployed
✓ Backend deployed
✓ Database initialized
✓ Seed data loaded
✓ WebSockets work
✓ Demo account works
```

### Documentation

```text
✓ README
✓ Architecture
✓ Database design
✓ API documentation
✓ WebSocket protocol
✓ Assumptions
✓ Security limitations
```

---

# 87. Final Architectural Principle

The project should follow this principle:

```text
                    SIMPLE
                      │
                      ▼
                 WELL DESIGNED
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

The goal is not to reproduce every internal detail of Signal.

The goal is to demonstrate that the developer can take a product specification, design a coherent full-stack architecture, implement persistent real-time workflows, produce a polished user interface, deploy it, document it, and explain every important engineering decision.

---

# 88. Specification Authority

This document is the authoritative project specification.

Implementation decisions must remain consistent with this specification.

If a requirement needs to change, the change must be intentional and reflected in the relevant documentation.

The following documents provide implementation-level details:

```text
docs/ARCHITECTURE.md
docs/DATABASE_DESIGN.md
docs/API_SPEC.md
docs/WEBSOCKET_PROTOCOL.md
docs/IMPLEMENTATION_PLAN.md
docs/AI_AGENT_RULES.md
```

Those documents must not contradict this specification.

**End of MASTER_PROJECT_SPEC.md**
