````markdown
# Implementation Plan — Secure Messaging Platform

**Project:** Secure Messaging Platform (Signal Clone)  
**Role Target:** Software Development Engineer Intern  
**Assignment:** Scalar AI Labs — SDE Fullstack Assignment  
**Status:** Authoritative Implementation Plan  
**Version:** 1.0  
**Date:** 2026-08-13

---

# 1. Purpose

This document defines the implementation sequence for the Secure Messaging Platform.

It translates the project's product, architecture, database, REST API, and WebSocket contracts into an executable development plan.

This document does **not** redefine:

- product requirements
- database schema
- REST API contracts
- WebSocket event contracts
- frontend/backend architecture

Those responsibilities belong to:

```text
docs/MASTER_PROJECT_SPEC.md
docs/ARCHITECTURE.md
docs/DATABASE_DESIGN.md
docs/API_SPEC.md
docs/WEBSOCKET_PROTOCOL.md
````

If an implementation decision conflicts with those documents, the implementation must be corrected rather than silently changing the contract.

---

# 2. Primary Objective

The primary objective is to deliver a complete, polished, deployable messaging application that satisfies every mandatory requirement of the assignment.

The implementation must prioritize:

```text
FUNCTIONALITY
    ↓
REAL-TIME CORRECTNESS
    ↓
DATABASE INTEGRITY
    ↓
UI/UX FIDELITY
    ↓
CODE QUALITY
    ↓
TESTING
    ↓
DEPLOYMENT
    ↓
OPTIONAL BONUSES
```

The application must not sacrifice mandatory functionality merely to implement optional features.

---

# 3. Assignment Requirement Mapping

Every assignment requirement must map to an implementation milestone.

| Assignment Requirement     | Implementation Area | Priority    |
| -------------------------- | ------------------- | ----------- |
| Registration               | Authentication      | MUST        |
| Mock OTP                   | Authentication      | MUST        |
| Login                      | Authentication      | MUST        |
| Logout                     | Authentication      | MUST        |
| Session persistence        | Authentication      | MUST        |
| Display name               | Profile             | MUST        |
| Avatar                     | Profile             | MUST        |
| Conversation list          | Conversation module | MUST        |
| Most recent sorting        | Conversation module | MUST        |
| Search conversations       | Search              | MUST        |
| Search contacts            | Search              | MUST        |
| Add contact                | Contacts            | MUST        |
| Unread indicators          | Conversation module | MUST        |
| Last-message preview       | Conversation module | MUST        |
| Online/last-seen           | Presence            | MUST        |
| One-to-one conversations   | Messaging           | MUST        |
| Real-time messages         | WebSocket           | MUST        |
| Timestamps                 | Messaging           | MUST        |
| Delivery receipts          | Messaging           | MUST        |
| Read receipts              | Messaging           | MUST        |
| Typing indicators          | WebSocket           | MUST        |
| Message persistence        | Database            | MUST        |
| Message status             | Messaging           | MUST        |
| Group creation             | Groups              | MUST        |
| Group members              | Groups              | MUST        |
| Group messaging            | Messaging           | MUST        |
| Add members                | Groups              | MUST        |
| Remove members             | Groups              | MUST        |
| Admin controls             | Groups              | MUST        |
| Signal-like layout         | Frontend            | MUST        |
| Message bubbles            | Frontend            | MUST        |
| Thread/reply-ready UI      | Frontend            | MUST        |
| Forms/modals               | Frontend            | MUST        |
| Search/filter UX           | Frontend            | MUST        |
| Notifications/toasts       | Frontend            | MUST        |
| Settings placeholders      | Frontend            | MUST        |
| Calls placeholder          | Frontend            | PLACEHOLDER |
| Stories placeholder        | Frontend            | PLACEHOLDER |
| Linked devices placeholder | Frontend            | PLACEHOLDER |
| Mock encryption            | Messaging           | PLACEHOLDER |
| Attachments                | Messaging           | BONUS       |
| Reactions                  | Messaging           | BONUS       |
| Reply-to messages          | Messaging           | BONUS       |
| Disappearing messages      | Messaging           | BONUS       |
| Dark mode                  | Frontend            | BONUS       |
| Responsive UI              | Frontend            | BONUS       |
| Keyboard shortcuts         | Frontend            | BONUS       |
| Seed data                  | Database            | MUST        |
| README                     | Documentation       | MUST        |
| Public GitHub repository   | Delivery            | MUST        |
| Hosted application         | Deployment          | MUST        |

---

# 4. Priority Model

Implementation is divided into four priority levels.

## P0 — Mandatory

These must work before submission:

```text
Authentication
Contacts
Conversation list
Direct messaging
WebSockets
Message persistence
Delivery/read states
Typing indicators
Presence
Groups
Group administration
Signal-like UI
Seed data
Deployment
README
```

---

## P1 — High-Value Polish

Implement after P0 is stable:

```text
Responsive layout
Dark mode
Better empty states
Loading states
Error states
Toast notifications
Keyboard interactions
Search refinement
UI animations
Professional settings screens
```

---

## P2 — Bonus

Implement only after P0 and P1 are stable:

```text
Attachments
Emoji reactions
Reply-to messages
Disappearing messages
```

---

## P3 — Explicit Placeholders

These do not require full implementation:

```text
Voice calls
Video calls
Stories
Linked devices
Actual Signal cryptography
```

A polished placeholder is sufficient.

---

# 5. Dependency Graph

Implementation follows this dependency order:

```text
Repository Bootstrap
        │
        ▼
Backend Foundation
        │
        ├───────────────┐
        ▼               ▼
Database           Configuration
        │
        ▼
Models + Repositories
        │
        ▼
Services
        │
        ├───────────────┐
        ▼               ▼
REST API          WebSocket Layer
        │               │
        └───────┬───────┘
                ▼
          Frontend Shell
                │
                ▼
          Authentication
                │
                ▼
       Conversation System
                │
                ▼
        Direct Messaging
                │
                ▼
       Delivery/Read/Typing
                │
                ▼
             Groups
                │
                ▼
          UI/UX Polish
                │
                ▼
          Seed/Demo Data
                │
                ▼
             Testing
                │
                ▼
           Deployment
                │
                ▼
       Final Evaluation
```

No phase should depend on an unfinished downstream phase.

---

# 6. Repository Structure

The final repository should have a clear separation between frontend, backend, and documentation.

Recommended structure:

```text
secure-messaging-platform/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   └── styles/
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── websocket/
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── ...
│
├── docs/
│   ├── MASTER_PROJECT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_SPEC.md
│   ├── WEBSOCKET_PROTOCOL.md
│   └── IMPLEMENTATION_PLAN.md
│
├── .gitignore
├── .env.example
├── README.md
└── LICENSE
```

The exact package names must remain consistent with `ARCHITECTURE.md`.

---

# 7. Phase 0 — Repository Bootstrap

## Objective

Establish a clean development environment before implementing application functionality.

## Tasks

### Frontend

Initialize:

```text
Next.js
TypeScript
```

Configure:

```text
linting
formatting
environment variables
```

### Backend

Initialize:

```text
Python
FastAPI
```

Configure:

```text
environment variables
database connection
application entry point
CORS
logging
```

### Repository

Create:

```text
.gitignore
.env.example
README.md
frontend/
backend/
docs/
```

## Definition of Done

```text
✓ Frontend starts locally
✓ Backend starts locally
✓ Frontend can communicate with backend
✓ Environment variables are documented
✓ No secrets are committed
✓ Repository has clean initial structure
```

---

# 8. Phase 1 — Backend Configuration

## Objective

Create stable application configuration before implementing business logic.

Configuration should cover:

```text
environment
database URL/path
frontend origin
session configuration
CORS
logging level
WebSocket settings
```

Sensitive values must come from environment variables.

Example:

```text
.env
```

must never be committed.

Provide:

```text
.env.example
```

with safe placeholder values.

---

# 9. Phase 2 — Database Foundation

## Objective

Implement the database according to:

```text
docs/DATABASE_DESIGN.md
```

Do not invent a second schema during implementation.

The database must support at minimum:

```text
users
contacts
conversations
conversation_members
messages
message receipts/read state
group membership/roles
```

The exact table names and relationships must follow the database contract.

---

# 10. Database Initialization

The application must be able to create its database in a clean environment.

Development flow:

```text
fresh environment
      ↓
database initialization
      ↓
schema creation
      ↓
seed execution
      ↓
usable application
```

The deployed application must also have a deterministic initialization strategy.

---

# 11. Phase 3 — Seed Data

## Objective

Ensure the application is immediately usable after startup.

The evaluator should not have to create every user and conversation manually.

Seed data should include:

### Users

Multiple realistic demo users.

Example:

```text
Alice
Bob
Charlie
David
Emma
```

### Conversations

At least:

```text
multiple direct conversations
at least one group conversation
```

### Messages

Messages should demonstrate:

```text
different timestamps
multiple senders
read messages
unread messages
conversation previews
group messages
```

### Demo State

The seeded state should visibly demonstrate:

```text
conversation sorting
unread badges
message history
group membership
profile avatars
```

---

# 12. Seed Data Safety

Seed data must never overwrite real production data unexpectedly.

The seed mechanism should be explicit.

For example:

```text
development seed
```

or an explicit initialization command.

Production deployment must not repeatedly recreate or destroy application state on every server restart.

---

# 13. Phase 4 — Domain Models and Repositories

## Objective

Create the persistence layer before business services.

Repositories are responsible for database access.

Services are responsible for business rules.

The API layer must not contain large blocks of database logic.

Conceptually:

```text
API
 ↓
Service
 ↓
Repository
 ↓
Database
```

---

# 14. Repository Responsibilities

Repositories should provide operations such as:

```text
create user
find user
update user
create contact
find contacts
create conversation
get conversations
create message
get messages
create group
get group members
add group member
remove group member
update message receipt
```

The exact public methods should correspond to actual application requirements.

Avoid creating repository methods that have no consumer.

---

# 15. Phase 5 — Authentication

## Objective

Implement the complete mocked authentication flow.

Required flow:

```text
Register
   ↓
Phone/username
   ↓
Mock OTP
   ↓
OTP verification
   ↓
Display name
   ↓
Avatar
   ↓
Account created
```

Login:

```text
Identifier
   ↓
Mock verification
   ↓
Session established
   ↓
Application
```

Logout:

```text
Application
   ↓
Logout
   ↓
Session invalidated
   ↓
Login screen
```

---

# 16. Mock OTP

The assignment explicitly permits mocked verification.

The implementation should use a deterministic fixed OTP.

The OTP must be clearly documented in the README for evaluator convenience.

The application must not claim to perform real phone verification.

---

# 17. Session Persistence

A logged-in user should remain authenticated across normal page refreshes.

The implementation must provide:

```text
login
session storage
session restoration
logout
```

The frontend should query the current authenticated user when necessary rather than relying exclusively on client-side state.

---

# 18. Authentication Security Boundary

Even though authentication is mocked:

```text
backend authorization remains mandatory
```

A client must not be able to access another user's private conversations simply by changing an ID in a request.

---

# 19. Phase 6 — Profile

Implement:

```text
display name
avatar
basic profile information
```

The profile should be visible in:

```text
conversation list
chat header
group member list
profile/settings area
```

Avatar handling should remain simple enough for the assignment.

---

# 20. Phase 7 — Contacts

## Objective

Implement the contact workflow.

Required operations:

```text
search user
add contact
view contacts
open conversation with contact
```

The system must prevent invalid or duplicate contact relationships according to the database contract.

---

# 21. Contact Search

Search should support the fields defined by the product/API contract.

The frontend should provide a Signal-like search experience rather than a raw database search screen.

States:

```text
searching
results
no results
error
```

must be handled.

---

# 22. Phase 8 — Conversation System

## Objective

Build the main Signal-style application layout.

Desktop structure:

```text
┌───────────────────────────────────────────────────────┐
│                                                       │
│  Conversation List       │       Chat Pane            │
│                          │                            │
│  Search                  │       Header               │
│                          │                            │
│  Conversation            │       Messages             │
│  Conversation            │                            │
│  Conversation            │                            │
│                          │       Composer              │
│                          │                            │
└───────────────────────────────────────────────────────┘
```

This layout is one of the most visually important parts of the assignment.

---

# 23. Conversation List

The list must show:

```text
avatar
display/group name
last message preview
timestamp
unread count
```

Ordering:

```text
most recent activity first
```

The list must update when a new message arrives.

---

# 24. Conversation Selection

When the user selects a conversation:

```text
conversation list
       │
       ▼
active conversation
       │
       ▼
load message history
       │
       ▼
connect/synchronize real-time events
```

The active conversation must be visually obvious.

---

# 25. Empty States

The UI must handle:

```text
no conversations
no search results
no messages
no contacts
no group members
```

Empty states should look intentional and polished rather than like broken screens.

---

# 26. Phase 9 — REST API Implementation

Implement the API according to:

```text
docs/API_SPEC.md
```

Do not create duplicate endpoints for the same operation unless required.

The API should be organized around domain resources.

Conceptual groups:

```text
auth
users/profile
contacts
conversations
messages
groups
```

---

# 27. API Implementation Order

Implement in this order:

```text
1. Authentication
2. Current user/profile
3. Contacts
4. Conversations
5. Message history
6. Groups
7. Group membership
```

This ensures the frontend always has the data it needs for subsequent stages.

---

# 28. API Error Handling

The API must return predictable errors.

The frontend should be able to distinguish:

```text
authentication failure
authorization failure
validation error
not found
conflict
server failure
```

Avoid exposing raw stack traces to clients.

---

# 29. Phase 10 — WebSocket Infrastructure

Implement according to:

```text
docs/WEBSOCKET_PROTOCOL.md
```

Required infrastructure:

```text
WebSocket endpoint
authentication
connection manager
connection registry
event parsing
event routing
error handling
heartbeat
disconnect handling
```

---

# 30. Connection Manager

The connection manager should own:

```text
active connections
connect
disconnect
send to user
broadcast to conversation
cleanup dead connections
```

WebSocket route handlers should not become a large monolithic connection-management file.

---

# 31. Phase 11 — Direct Messaging

## Objective

Implement the primary messaging workflow.

Required:

```text
send text
receive text
persist message
timestamp
real-time delivery
message status
```

Flow:

```text
Composer
   ↓
message.send
   ↓
WebSocket
   ↓
authorization
   ↓
database persistence
   ↓
message.ack
   ↓
broadcast message.new
```

---

# 32. Optimistic Message Rendering

The frontend should render the outgoing message immediately.

Initial state:

```text
sending
```

After successful server persistence:

```text
sent
```

Then:

```text
delivered
```

Then:

```text
read
```

Failure:

```text
failed
```

The UI should make these states visually understandable.

---

# 33. Message History

Opening a conversation must load persisted messages.

The WebSocket must not be treated as the source of historical truth.

Use:

```text
REST → historical state
WebSocket → live events
```

---

# 34. Phase 12 — Delivery and Read Receipts

Implement the complete state progression:

```text
sending
   ↓
sent
   ↓
delivered
   ↓
read
```

The visual treatment should resemble the Signal checkmark experience.

The exact UI representation should be consistent throughout the application.

---

# 35. Read State

When the user opens/views messages:

```text
frontend
   ↓
message.read
   ↓
backend
   ↓
persist read state
   ↓
broadcast read event
```

Read state must survive refreshes.

---

# 36. Phase 13 — Typing Indicators

Implement:

```text
typing.start
typing.stop
```

The frontend must debounce typing notifications.

Typing state should:

```text
appear quickly
disappear automatically
not persist as messages
```

For group chats, the UI should identify the typing member where practical.

---

# 37. Phase 14 — Presence

Implement:

```text
online
offline
last seen
```

Presence can be mocked/simplified as allowed by the assignment.

The backend should derive connection state from active WebSocket connections.

Last-seen should be persisted where required by the data model.

---

# 38. Phase 15 — Group Messaging

## Objective

Implement complete group functionality.

Required:

```text
create group
set group name
select members
open group conversation
send messages
receive messages
view members
```

---

# 39. Group Administration

Group administrators must be able to:

```text
add members
remove members
```

Authorization must be checked server-side.

The frontend should hide or disable admin-only controls for ordinary members.

However:

```text
UI restrictions are not security
```

The backend must independently enforce admin authorization.

---

# 40. Group Member UI

The group interface should provide:

```text
group name
group avatar
member count
member list
member roles
admin controls
```

The exact UI should remain consistent with the Signal-inspired design language.

---

# 41. Phase 16 — Signal-Inspired UI

The assignment explicitly evaluates visual similarity.

The UI should therefore be treated as a first-class implementation requirement, not final decoration.

Priorities:

```text
layout
spacing
typography
colors
message bubbles
avatars
icons
search
composer
headers
modals
settings
```

The visual system should be consistent across all screens.

---

# 42. UI Component Strategy

Create reusable components instead of duplicating markup.

Recommended categories:

```text
ui/
auth/
conversation/
chat/
message/
group/
profile/
settings/
layout/
```

Examples:

```text
Avatar
Button
Input
Modal
Toast
ConversationItem
MessageBubble
MessageStatus
ChatHeader
MessageComposer
TypingIndicator
GroupMemberItem
```

Only create components when they represent a reusable UI responsibility.

---

# 43. Message Bubble Design

Message bubbles should support:

```text
incoming
outgoing
timestamp
status
read state
```

The design should clearly distinguish:

```text
sent by current user
sent by another user
```

Group messages should also identify the sender where necessary.

---

# 44. Composer

The composer must support:

```text
text input
send action
Enter behavior
disabled/loading state
failed-message retry where implemented
```

The composer should not allow empty messages.

---

# 45. Loading States

Every asynchronous screen must have an intentional loading state.

Examples:

```text
authentication loading
conversation loading
message history loading
group loading
search loading
```

Avoid blank white/empty screens while data is loading.

---

# 46. Error States

The application must gracefully handle:

```text
network failure
authentication failure
message failure
WebSocket disconnect
empty search
invalid input
server error
```

Errors should be understandable to users.

Technical stack traces should never appear in the UI.

---

# 47. Toast / Notification System

Use a consistent notification mechanism for:

```text
message failed
contact added
group created
member added
member removed
login failure
logout
connection problems
```

Avoid excessive notifications.

---

# 48. Settings

Settings must exist because they are explicitly part of the assignment's Signal experience.

The following sections may initially be placeholders:

```text
Privacy
Notifications
Appearance
About
```

Placeholder sections should look intentional.

Example:

```text
Feature
Coming Soon
```

rather than an unimplemented broken route.

---

# 49. Explicit Placeholder Features

The following may remain non-functional:

```text
Voice Calls
Video Calls
Stories
Linked Devices
End-to-End Encryption
```

They should be presented as product areas rather than falsely claiming full implementation.

---

# 50. Mock Encryption

The application may visually indicate:

```text
Messages are encrypted
```

or provide an encryption-related UI treatment.

However, documentation must clearly state:

```text
This project does not implement Signal Protocol or production-grade end-to-end encryption.
```

No security claim should imply actual Signal-level cryptography.

---

# 51. Phase 17 — Responsive Design

If time permits after P0 functionality, support:

```text
desktop
tablet
mobile
```

Recommended mobile behavior:

```text
Conversation List
      ↓
select conversation
      ↓
Chat View
```

The desktop two-pane layout should collapse naturally on smaller screens.

Responsive design should not compromise desktop evaluation.

---

# 52. Phase 18 — Dark Mode

If implemented:

```text
light mode
dark mode
```

must use the same component system and design tokens.

Dark mode should not be implemented by manually changing colors in individual components.

---

# 53. Phase 19 — Optional Messaging Features

Only after P0 is complete:

## Attachments

Support:

```text
image/file upload
attachment metadata
message attachment rendering
```

## Reactions

Support:

```text
emoji reaction
add/remove reaction
```

## Reply-to

Support:

```text
quoted message
reply reference
reply rendering
```

## Disappearing Messages

Support:

```text
expiration configuration
server-side expiration
UI indication
```

Each feature must be fully functional if included.

A partially implemented bonus feature is less valuable than a polished mandatory feature.

---

# 54. Phase 20 — Frontend State Management

The frontend should maintain separate concepts for:

```text
authentication state
conversation state
message state
connection state
UI state
```

Avoid putting all application state into one monolithic store.

The exact state-management technology should follow the architecture already selected for the project.

---

# 55. WebSocket Client Abstraction

The frontend should not open WebSockets directly from arbitrary components.

Create a dedicated abstraction responsible for:

```text
connect
disconnect
reconnect
send
receive
heartbeat
event routing
```

Components should subscribe to application events rather than managing raw WebSocket lifecycle themselves.

---

# 56. WebSocket Reconnection

The client must:

```text
detect disconnect
reconnect automatically
restore connection state
refresh critical data
reconcile messages
```

The UI should clearly indicate a temporary connection problem when appropriate.

---

# 57. Offline/Reconnection Behavior

The system must tolerate:

```text
temporary network loss
page refresh
backend restart
WebSocket reconnect
```

After reconnect:

```text
REST refresh
      +
WebSocket live events
```

must restore the application to a consistent state.

---

# 58. Phase 21 — Testing

Testing should focus on critical workflows rather than maximizing test count.

---

# 59. Backend Tests

At minimum, test:

```text
registration
OTP validation
login
logout
authentication protection
contact creation
conversation creation
message creation
message persistence
conversation membership
group creation
group member addition
group member removal
admin authorization
```

---

# 60. WebSocket Tests

Critical real-time tests:

```text
authenticated connection
connection rejection
message.send
message.ack
message.new
delivery receipt
read receipt
typing.start
typing.stop
unauthorized conversation access
duplicate message handling
disconnect/reconnect behavior
```

---

# 61. Frontend Tests

Prioritize critical user flows:

```text
login
conversation selection
message composition
message rendering
status rendering
typing indicator
group interaction
logout
```

The exact testing framework should follow the project setup.

---

# 62. Manual End-to-End Test

Before deployment, perform a complete two-user test.

Use two browser sessions:

```text
Browser A → Alice
Browser B → Bob
```

Test:

```text
Alice logs in
Bob logs in

Alice opens Bob
Bob opens Alice

Alice sends message
Bob receives instantly

Bob replies
Alice receives instantly

Typing indicator appears

Delivery status changes

Read status changes

Refresh both browsers

Messages remain

Disconnect/reconnect

Messages remain synchronized
```

---

# 63. Group End-to-End Test

Use:

```text
Alice
Bob
Charlie
```

Test:

```text
Alice creates group
Alice adds Bob
Alice adds Charlie

Alice sends message
Bob receives
Charlie receives

Admin removes Charlie

Charlie can no longer send

Bob remains active
```

---

# 64. Authentication End-to-End Test

Test:

```text
Register
↓
OTP
↓
Profile
↓
Application
↓
Refresh
↓
Still authenticated
↓
Logout
↓
Authentication screen
```

---

# 65. Database Verification

Before submission, verify:

```text
users persist
contacts persist
conversations persist
members persist
messages persist
groups persist
receipts persist
```

Restart the backend and verify that application data remains available.

---

# 66. API Verification

Verify all mandatory endpoints from:

```text
docs/API_SPEC.md
```

using either:

```text
Swagger/OpenAPI
```

or a REST client.

Do not submit with undocumented or broken required endpoints.

---

# 67. WebSocket Verification

Verify all mandatory events from:

```text
docs/WEBSOCKET_PROTOCOL.md
```

at least once during manual testing.

---

# 68. Phase 22 — Performance and Reliability Pass

Before deployment, perform a lightweight reliability review.

Check:

```text
no unnecessary API loops
no infinite WebSocket reconnect loop
no duplicate messages
no duplicate event handlers
no memory leak from disconnected sockets
no uncontrolled polling
```

---

# 69. Security Review

Even though this is a mocked secure messenger, review:

```text
authentication
authorization
CORS
input validation
SQL injection protection through ORM/parameterized queries
message length limits
secret handling
error exposure
WebSocket authorization
group admin authorization
```

Never commit:

```text
API keys
passwords
production secrets
database credentials
private tokens
```

---

# 70. Phase 23 — Documentation

The repository must contain a strong README.

README should include:

```text
Project overview
Features
Screenshots
Tech stack
Architecture
Repository structure
Database design
API overview
WebSocket overview
Local setup
Environment variables
Seed/demo credentials
Mock OTP
Running frontend
Running backend
Testing
Deployment
Assumptions
Limitations
AI-assisted development disclosure
```

---

# 71. Architecture Documentation

The README should link to:

```text
docs/MASTER_PROJECT_SPEC.md
docs/ARCHITECTURE.md
docs/DATABASE_DESIGN.md
docs/API_SPEC.md
docs/WEBSOCKET_PROTOCOL.md
docs/IMPLEMENTATION_PLAN.md
```

The documentation should make the project understandable without reading the source code first.

---

# 72. Screenshots

The GitHub repository should include polished screenshots showing:

```text
login
conversation list
direct chat
message status
group chat
group members
settings
responsive/mobile view
```

Screenshots should be taken from the actual application.

Do not use screenshots from Signal itself.

---

# 73. GitHub Repository Quality

The repository is part of the evaluation.

It should communicate:

```text
professionalism
organization
engineering discipline
original implementation
```

The repository root should not contain:

```text
temporary files
debug output
large generated artifacts
.env
node_modules
Python virtual environments
database dumps containing unnecessary private data
```

---

# 74. Git Commit Strategy

Commits should represent meaningful milestones.

Recommended sequence:

```text
chore: initialize repository structure
chore: bootstrap frontend and backend
feat: implement database foundation
feat: add seed data
feat: implement authentication
feat: implement contacts and conversations
feat: implement REST messaging
feat: implement websocket messaging
feat: add delivery and read receipts
feat: add typing and presence
feat: implement group messaging
feat: build signal-inspired interface
feat: add settings and placeholders
test: add backend and websocket tests
docs: improve project documentation
chore: prepare production deployment
```

Do not create hundreds of meaningless commits.

Do not squash away useful development history immediately before submission if the existing history already demonstrates legitimate work.

---

# 75. Original Work Requirement

The assignment explicitly prohibits plagiarism from existing repositories.

Therefore:

```text
Do not clone an existing Signal clone.
Do not copy an existing messaging repository.
Do not reuse another project's UI implementation wholesale.
Do not present generated/copied code as an existing project.
```

AI tools may be used for implementation assistance, but the resulting architecture and code must be understood by the developer.

---

# 76. AI-Assisted Development

AI tools may be used extensively.

However, every generated implementation must be reviewed for:

```text
correctness
security
architecture compatibility
database compatibility
API compatibility
WebSocket compatibility
runtime behavior
```

AI-generated code must not override the project's authoritative specifications.

The developer must be able to explain:

```text
why the code exists
how it works
what assumptions it makes
what happens during failure
```

---

# 77. Code Review Pass

Before submission, review every major module for:

```text
unused code
duplicate code
dead endpoints
unused imports
hardcoded secrets
hardcoded URLs
unnecessary complexity
large monolithic functions
business logic inside UI components
business logic inside API routes
database access inside UI/API handlers
```

---

# 78. Frontend Quality Checklist

Verify:

```text
✓ consistent spacing
✓ consistent typography
✓ reusable components
✓ no broken links
✓ no console errors
✓ no hydration errors
✓ no React warnings
✓ loading states
✓ error states
✓ empty states
✓ mobile behavior
✓ keyboard interaction
✓ accessible form labels
✓ disabled states
```

---

# 79. Backend Quality Checklist

Verify:

```text
✓ application starts cleanly
✓ database initializes correctly
✓ migrations/schema work
✓ seed works
✓ API errors are structured
✓ authentication is enforced
✓ authorization is enforced
✓ services contain business logic
✓ repositories contain persistence logic
✓ WebSocket connections are cleaned up
✓ logging is useful
✓ no debug secrets/logging
```

---

# 80. Production Configuration

Before deployment:

```text
development URLs
```

must not be hardcoded into production behavior.

Configure:

```text
frontend API URL
frontend WebSocket URL
backend CORS origins
database configuration
session/auth configuration
```

using deployment environment variables.

---

# 81. Deployment Strategy

The assignment requires a hosted working link.

The deployment architecture should remain simple.

Conceptually:

```text
                 Internet
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
       Frontend             Backend
       Next.js              FastAPI
          │                   │
          └─────────┬─────────┘
                    ▼
                  SQLite
```

The exact hosting provider may be selected based on the project's actual runtime requirements.

The final deployment must support:

```text
HTTPS
WebSocket/WSS
frontend → backend communication
persistent application data for the demo
```

---

# 82. Deployment Verification

After deployment, test the deployed application rather than assuming local correctness transfers automatically.

Verify:

```text
✓ application loads
✓ login works
✓ session persists
✓ conversation list loads
✓ messages send
✓ WebSocket connects
✓ real-time messages work
✓ typing works
✓ receipts work
✓ groups work
✓ group administration works
✓ refresh works
✓ no CORS errors
✓ no WebSocket connection errors
```

---

# 83. Deployment Smoke Test

Use the final production URL and perform:

```text
1. Open application
2. Login using demo credentials
3. Open seeded conversation
4. Send message
5. Open second browser/session
6. Confirm real-time delivery
7. Confirm typing
8. Confirm read receipt
9. Open group
10. Send group message
11. Test group member controls
12. Refresh
13. Confirm persistence
```

---

# 84. Demo Account Strategy

The README should provide a clear way for the evaluator to access the application.

If the application uses seeded demo accounts:

```text
Demo User 1
Demo User 2
Demo User 3
```

and their login mechanism should be documented.

If mock OTP is required, document:

```text
Mock OTP: <configured development OTP>
```

The evaluator should be able to enter the application without guessing credentials.

---

# 85. Final UI Polish Pass

Before submission, perform a dedicated visual pass.

Check:

```text
alignment
spacing
icons
avatar sizing
message bubble sizing
timestamps
checkmarks
search bar
conversation selection
headers
modals
settings
mobile layout
empty states
loading states
error states
```

The application should feel like one cohesive product.

---

# 86. Signal-Inspired Design Principle

The application should be inspired by the Signal user experience without copying source code or proprietary assets.

Focus on:

```text
minimal interface
privacy-oriented visual language
conversation-first navigation
clean message bubbles
simple composer
clear status indicators
low visual clutter
```

The goal is a convincing Signal-inspired experience.

---

# 87. Feature Freeze

Before deployment, establish a feature freeze.

After feature freeze:

```text
No architectural rewrites
No database redesign
No unnecessary dependency changes
No major UI framework changes
No new large features
```

Only:

```text
bug fixes
visual polish
deployment fixes
documentation fixes
```

should be made.

---

# 88. Final Acceptance Matrix

The following matrix must be completed before submission.

| Area          | Requirement            | Status |
| ------------- | ---------------------- | ------ |
| Auth          | Registration           | ☐      |
| Auth          | Mock OTP               | ☐      |
| Auth          | Login                  | ☐      |
| Auth          | Logout                 | ☐      |
| Auth          | Session persistence    | ☐      |
| Profile       | Display name           | ☐      |
| Profile       | Avatar                 | ☐      |
| Contacts      | Add contact            | ☐      |
| Contacts      | Search                 | ☐      |
| Conversations | Conversation list      | ☐      |
| Conversations | Recent sorting         | ☐      |
| Conversations | Last-message preview   | ☐      |
| Conversations | Unread indicators      | ☐      |
| Presence      | Online state           | ☐      |
| Presence      | Last seen              | ☐      |
| Messaging     | Direct messaging       | ☐      |
| Messaging     | Real-time delivery     | ☐      |
| Messaging     | Persistence            | ☐      |
| Messaging     | Timestamps             | ☐      |
| Messaging     | Sending state          | ☐      |
| Messaging     | Sent state             | ☐      |
| Messaging     | Delivered state        | ☐      |
| Messaging     | Read state             | ☐      |
| Messaging     | Typing indicator       | ☐      |
| Groups        | Create group           | ☐      |
| Groups        | Group messages         | ☐      |
| Groups        | View members           | ☐      |
| Groups        | Add members            | ☐      |
| Groups        | Remove members         | ☐      |
| Groups        | Admin controls         | ☐      |
| UI            | Signal-inspired layout | ☐      |
| UI            | Chat pane              | ☐      |
| UI            | Message bubbles        | ☐      |
| UI            | Forms/modals           | ☐      |
| UI            | Search/filter          | ☐      |
| UI            | Notifications/toasts   | ☐      |
| UI            | Settings               | ☐      |
| Placeholder   | Calls                  | ☐      |
| Placeholder   | Stories                | ☐      |
| Placeholder   | Linked devices         | ☐      |
| Placeholder   | Encryption             | ☐      |
| Data          | Seed data              | ☐      |
| Docs          | README                 | ☐      |
| Docs          | Architecture           | ☐      |
| Docs          | Database               | ☐      |
| Docs          | API                    | ☐      |
| Docs          | WebSocket              | ☐      |
| Quality       | Tests                  | ☐      |
| Deployment    | Hosted application     | ☐      |
| Deployment    | HTTPS                  | ☐      |
| Deployment    | WSS                    | ☐      |
| GitHub        | Public repository      | ☐      |

---

# 89. Critical Demo Scenarios

The final demo should be able to demonstrate the following without additional setup.

## Scenario A — Direct Message

```text
Login as Alice
       ↓
Open Bob
       ↓
Type message
       ↓
Bob sees typing indicator
       ↓
Send
       ↓
Alice sees sent
       ↓
Bob receives instantly
       ↓
Alice sees delivered
       ↓
Bob opens message
       ↓
Alice sees read
```

---

## Scenario B — Conversation List

```text
New message
    ↓
conversation activity changes
    ↓
conversation moves to top
    ↓
preview updates
    ↓
timestamp updates
    ↓
unread indicator appears
```

---

## Scenario C — Group

```text
Create group
    ↓
Add members
    ↓
Open group
    ↓
Send message
    ↓
All members receive
    ↓
View members
    ↓
Admin removes member
    ↓
Authorization changes
```

---

## Scenario D — Persistence

```text
Send messages
    ↓
Refresh browser
    ↓
Messages remain
    ↓
Restart backend
    ↓
Messages remain
```

---

## Scenario E — Reconnection

```text
Connected
    ↓
Disconnect network/WebSocket
    ↓
UI shows reconnecting
    ↓
Connection restored
    ↓
Conversation refreshed
    ↓
Messages synchronized
```

---

# 90. Time-Boxed Execution Strategy

The assignment estimates approximately 10 hours.

The implementation should therefore be time-boxed.

A practical allocation is:

```text
Phase                         Priority

Repository/bootstrap          P0
Database + seed               P0
Authentication                P0
Contacts/conversations        P0
REST APIs                     P0
WebSocket infrastructure      P0
Direct messaging              P0
Receipts + typing + presence  P0
Groups                        P0
Core Signal-style UI          P0
Testing                       P0
Deployment                    P0

Responsive polish             P1
Dark mode                     P1
Settings polish               P1
Optional UX improvements      P1

Attachments                   P2
Reactions                     P2
Reply-to                      P2
Disappearing messages         P2
```

The exact number of minutes per task should be adjusted according to actual development speed.

The important rule is:

```text
Do not spend the majority of the available time on polish
before the messaging system works end-to-end.
```

---

# 91. Recommended Execution Order Under Severe Time Pressure

If time becomes critically limited, the exact survival order is:

```text
1. Bootstrap
2. Database
3. Seed
4. Authentication
5. Conversation list
6. Direct messaging
7. WebSocket
8. Message persistence
9. Delivery/read
10. Typing
11. Groups
12. Signal UI polish
13. Tests
14. Deployment
15. Documentation polish
16. Bonuses
```

Never move bonuses ahead of:

```text
real-time messaging
groups
database persistence
deployment
```

---

# 92. Definition of Minimum Viable Submission

A submission is minimally acceptable only when:

```text
✓ User can log in
✓ User sees seeded conversations
✓ User can open a conversation
✓ User can send a message
✓ Another user receives it in real time
✓ Messages persist
✓ Delivery/read status works
✓ Typing works
✓ Contacts work
✓ Groups work
✓ UI resembles Signal
✓ Application is deployed
✓ GitHub repository is public
✓ README explains the project
```

---

# 93. Definition of Strong Submission

A strong submission additionally provides:

```text
✓ polished Signal-inspired UI
✓ responsive interface
✓ dark mode
✓ excellent loading/error states
✓ clean component architecture
✓ clean service/repository separation
✓ robust WebSocket handling
✓ reconnect support
✓ duplicate-message protection
✓ strong seed/demo experience
✓ meaningful tests
✓ professional README
✓ architecture diagrams
✓ screenshots
✓ clean Git history
✓ production deployment
```

---

# 94. Definition of Exceptional Submission

An exceptional submission is not defined by the number of features.

It is defined by the quality and consistency of the implementation.

The application should demonstrate:

```text
Product thinking
+
Backend engineering
+
Frontend engineering
+
Real-time systems understanding
+
Database design
+
Error handling
+
Testing
+
Deployment
+
Documentation
```

The evaluator should be able to inspect the repository and understand:

```text
why the system is structured this way
how messages flow through the system
how persistence works
how real-time events work
how authorization is enforced
how failure is handled
how the application was tested
how it was deployed
```

---

# 95. Final Submission Checklist

Before submitting the assignment:

## Application

```text
☐ Production URL works
☐ Login works
☐ Demo accounts work
☐ Mock OTP documented
☐ Conversations load
☐ Direct messages work
☐ Real-time delivery works
☐ Typing works
☐ Delivery/read receipts work
☐ Groups work
☐ Group administration works
☐ Data persists
```

## UI

```text
☐ Signal-inspired design
☐ Desktop layout polished
☐ Mobile layout tested
☐ Loading states
☐ Empty states
☐ Error states
☐ Toasts
☐ Settings
☐ Placeholders
```

## Backend

```text
☐ Authentication
☐ Authorization
☐ Database
☐ REST API
☐ WebSocket
☐ Persistence
☐ Error handling
☐ Connection cleanup
```

## Repository

```text
☐ Public GitHub repository
☐ No secrets
☐ No node_modules
☐ No virtual environment
☐ Clean source tree
☐ Documentation complete
☐ Screenshots included
☐ README complete
```

## Deployment

```text
☐ Frontend deployed
☐ Backend deployed
☐ Database configured
☐ CORS configured
☐ WebSocket/WSS working
☐ Environment variables configured
☐ Production smoke test completed
```

---

# 96. Final Submission Information

The final submission should provide exactly the two primary links requested by the assignment:

```text
GitHub Repository:
<public repository URL>

Live Application:
<production application URL>
```

The README should also contain both links for evaluator convenience.

---

# 97. Final Engineering Rule

The implementation must follow this hierarchy:

```text
                    ┌────────────────────────┐
                    │ MASTER PROJECT SPEC    │
                    └────────────┬───────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                   ▼
        ARCHITECTURE         DATABASE              API
             │               DESIGN                 │
             │                   │                  │
             └───────────────────┼──────────────────┘
                                 ▼
                       WEBSOCKET PROTOCOL
                                 │
                                 ▼
                      IMPLEMENTATION PLAN
                                 │
                                 ▼
                           SOURCE CODE
                                 │
                                 ▼
                             TESTING
                                 │
                                 ▼
                           DEPLOYMENT
```

The documentation is the contract.

The implementation follows the contract.

Testing verifies the implementation.

Deployment verifies that the implementation works outside the development environment.

---

# 98. Completion Principle

The project should be considered complete only when the evaluator can:

```text
open the deployed application
        ↓
authenticate
        ↓
see realistic seeded data
        ↓
open conversations
        ↓
send messages
        ↓
observe real-time delivery
        ↓
observe typing/read/delivery states
        ↓
use groups
        ↓
refresh the browser
        ↓
see persisted state
        ↓
inspect the GitHub repository
        ↓
understand the architecture
        ↓
understand the database
        ↓
understand the API
        ↓
understand the WebSocket protocol
```

The final system must therefore be evaluated as a complete product rather than as a collection of disconnected features.

**End of IMPLEMENTATION_PLAN.md**

````