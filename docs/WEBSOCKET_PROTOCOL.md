````markdown
# WebSocket Protocol — Signal-Inspired Messenger

**Project:** Signal-Inspired Messenger  
**Status:** Authoritative Real-Time Contract  
**Version:** 1.0  
**Backend:** Python + FastAPI  
**Transport:** WebSocket  
**REST API:** `/api/v1`  
**Last Updated:** 2026-08-13

---

# 1. Purpose

This document defines the authoritative real-time communication protocol between the frontend and backend.

WebSockets are responsible for low-latency application events that should be reflected immediately in the user interface.

The protocol covers:

- real-time messaging
- message acknowledgements
- delivery receipts
- read receipts
- typing indicators
- presence
- conversation activity
- group events
- connection lifecycle
- reconnect behavior
- heartbeat
- errors
- authorization

REST remains responsible for initial state, historical data, CRUD operations, and configuration.

---

# 2. Design Goals

The WebSocket layer must provide:

1. Real-time message delivery.
2. Predictable event schemas.
3. Server-side authorization.
4. Message persistence before successful acknowledgement.
5. Duplicate-message protection.
6. Reconnection support.
7. Clear delivery/read state transitions.
8. Graceful handling of temporary network failures.
9. Simple implementation suitable for the assignment timeline.
10. A protocol that can be clearly explained during evaluation.

The implementation intentionally does **not** attempt to implement Signal's actual cryptographic protocol.

Encryption is simulated at the application level if required by the UI.

---

# 3. Transport

The WebSocket endpoint is:

```text
/ws
````

Production example:

```text
wss://<backend-domain>/ws
```

Development example:

```text
ws://localhost:8000/ws
```

The frontend must obtain the backend host from configuration rather than hardcoding it.

---

# 4. Connection Architecture

```text
                    Browser
                       │
                       │ WebSocket
                       ▼
                FastAPI WebSocket
                       │
                       ▼
              Authentication Layer
                       │
                       ▼
             Connection Manager
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       User Connection      Conversation
             │              Subscription
             └─────────┬─────────┘
                       ▼
                  Event Router
                       │
                       ▼
                    Services
                       │
                       ▼
                  Repository
                       │
                       ▼
                    SQLite
```

---

# 5. REST and WebSocket Responsibilities

The two protocols complement each other.

## REST

REST handles:

```text
authentication
profile retrieval
contacts
conversation creation
conversation listing
message history
group management
settings
search
```

## WebSocket

WebSocket handles:

```text
new messages
message acknowledgements
delivery events
read events
typing indicators
presence
conversation activity
group events
```

The frontend should not use WebSocket as a replacement for REST.

---

# 6. Authentication

Every WebSocket connection must be authenticated.

The preferred authentication mechanism is the same mechanism used by the REST API.

If cookie-based sessions are used:

```text
Browser
   │
   │ Cookie
   ▼
WebSocket handshake
   │
   ▼
Session validation
```

If bearer authentication is used:

```text
Authorization: Bearer <token>
```

must be validated during the connection handshake.

Unauthenticated connections must be rejected.

---

# 7. Authentication Failure

If authentication fails during connection:

```text
HTTP 401
```

should be returned during the WebSocket handshake where supported.

The server must not establish an unauthenticated application session.

---

# 8. Connection Lifecycle

```text
CONNECTING
    │
    ▼
AUTHENTICATING
    │
    ▼
CONNECTED
    │
    ├───────────────┐
    │               │
    ▼               ▼
DISCONNECT       RECONNECT
```

A successful connection begins receiving server events immediately.

---

# 9. Connection Initialization

After connection:

```text
Client → Server
```

sends:

```json
{
  "type": "connection.init",
  "payload": {
    "client_version": "1.0"
  }
}
```

The server responds:

```json
{
  "type": "connection.ready",
  "payload": {
    "connection_id": "uuid",
    "user_id": "uuid",
    "server_time": "2026-08-13T14:00:00Z"
  }
}
```

The `connection_id` is useful for debugging and connection tracking.

---

# 10. Connection Ready

The frontend must not send application events until:

```text
connection.ready
```

has been received.

The frontend may begin loading historical data through REST independently.

---

# 11. Event Envelope

All WebSocket messages use a common envelope.

```json
{
  "type": "message.new",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:00:00Z",
  "payload": {}
}
```

Fields:

| Field       | Required | Description                   |
| ----------- | -------- | ----------------------------- |
| `type`      | Yes      | Event name                    |
| `event_id`  | Yes      | Unique event identifier       |
| `timestamp` | Yes      | Server/client event timestamp |
| `payload`   | Yes      | Event-specific data           |

---

# 12. Event Naming

Event names use:

```text
resource.action
```

Examples:

```text
connection.ready
message.send
message.ack
message.new
message.delivered
message.read
typing.start
typing.stop
presence.update
conversation.updated
group.member_added
group.member_removed
error
```

This keeps the protocol predictable and extensible.

---

# 13. Client → Server Events

Supported client events:

```text
connection.init
message.send
message.delivered
message.read
typing.start
typing.stop
presence.update
ping
```

---

# 14. Server → Client Events

Supported server events:

```text
connection.ready
message.ack
message.new
message.delivered
message.read
typing.start
typing.stop
presence.update
conversation.updated
group.member_added
group.member_removed
group.updated
pong
error
```

---

# 15. Sending a Message

The client sends:

```json
{
  "type": "message.send",
  "event_id": "event-uuid",
  "timestamp": "2026-08-13T14:01:00Z",
  "payload": {
    "client_message_id": "client-message-uuid",
    "conversation_id": "conversation-uuid",
    "content": "Hello Bob!",
    "message_type": "text",
    "reply_to_id": null
  }
}
```

---

# 16. Client Message ID

Every message sent over WebSocket should include:

```text
client_message_id
```

The frontend generates it.

Example:

```text
550e8400-e29b-41d4-a716-446655440000
```

The ID allows the backend to identify retries of the same logical message.

---

# 17. Message Processing

When the server receives `message.send`:

```text
Client
  │
  ▼
Validate event
  │
  ▼
Authenticate user
  │
  ▼
Verify conversation membership
  │
  ▼
Validate content
  │
  ▼
Check client_message_id
  │
  ├── duplicate → return existing message
  │
  └── new
        │
        ▼
     Persist message
        │
        ▼
      Commit DB
        │
        ▼
      ACK sender
        │
        ▼
   Broadcast message
```

The server must persist the message before reporting successful persistence.

---

# 18. Message Acknowledgement

After successful database persistence:

```json
{
  "type": "message.ack",
  "event_id": "server-event-uuid",
  "timestamp": "2026-08-13T14:01:01Z",
  "payload": {
    "client_message_id": "client-message-uuid",
    "message": {
      "id": "server-message-uuid",
      "conversation_id": "conversation-uuid",
      "sender_id": "alice-uuid",
      "content": "Hello Bob!",
      "created_at": "2026-08-13T14:01:01Z"
    },
    "status": "sent"
  }
}
```

The frontend changes:

```text
sending → sent
```

after receiving this event.

---

# 19. Message Delivery

When a recipient's active connection receives a message:

```text
message.new
```

is delivered.

The recipient should then send:

```json
{
  "type": "message.delivered",
  "event_id": "event-uuid",
  "timestamp": "2026-08-13T14:01:02Z",
  "payload": {
    "message_id": "server-message-uuid",
    "conversation_id": "conversation-uuid"
  }
}
```

---

# 20. Delivery Event

The server updates the receipt and broadcasts:

```json
{
  "type": "message.delivered",
  "event_id": "event-uuid",
  "timestamp": "2026-08-13T14:01:02Z",
  "payload": {
    "message_id": "server-message-uuid",
    "user_id": "bob-uuid",
    "status": "delivered",
    "delivered_at": "2026-08-13T14:01:02Z"
  }
}
```

---

# 21. Read Receipt

When a user opens/views a conversation, the frontend sends:

```json
{
  "type": "message.read",
  "event_id": "event-uuid",
  "timestamp": "2026-08-13T14:01:10Z",
  "payload": {
    "message_id": "server-message-uuid",
    "conversation_id": "conversation-uuid"
  }
}
```

The backend records the read state.

---

# 22. Read Event

The server broadcasts:

```json
{
  "type": "message.read",
  "event_id": "event-uuid",
  "timestamp": "2026-08-13T14:01:10Z",
  "payload": {
    "message_id": "server-message-uuid",
    "user_id": "bob-uuid",
    "status": "read",
    "read_at": "2026-08-13T14:01:10Z"
  }
}
```

---

# 23. Message Status Lifecycle

The UI represents message state as:

```text
             ┌─────────┐
             │ SENDING │
             └────┬────┘
                  │
                  ▼
             ┌─────────┐
             │  SENT   │
             └────┬────┘
                  │
                  ▼
          ┌──────────────┐
          │  DELIVERED   │
          └──────┬───────┘
                 │
                 ▼
             ┌───────┐
             │ READ  │
             └───────┘
```

If sending fails:

```text
SENDING → FAILED
```

The frontend may provide a retry action.

---

# 24. Direct Message Routing

For a direct conversation:

```text
Alice
  │
  │ message.send
  ▼
Server
  │
  ├───────────────► Alice ACK
  │
  └───────────────► Bob message.new
```

If Bob is offline:

```text
Alice
  │
  ▼
Server
  │
  └──► Database
          │
          └──► Bob receives after reconnect
```

The server must not depend on the recipient being online for message persistence.

---

# 25. Group Message Routing

For a group:

```text
Alice
  │
  ▼
Server
  │
  ├──► Bob
  ├──► Charlie
  ├──► David
  └──► Alice ACK
```

The sender must not receive their own message as a second `message.new` event unless the frontend explicitly requires that behavior.

The sender uses `message.ack` to reconcile its local message.

---

# 26. Group Message Authorization

Before accepting a group message:

```text
current_user
      │
      ▼
conversation membership?
      │
   ┌──┴──┐
   │     │
  YES    NO
   │     │
   ▼     ▼
allow   reject
```

Inactive or removed members cannot send messages.

---

# 27. Typing Indicators

When a user starts typing:

```json
{
  "type": "typing.start",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:02:00Z",
  "payload": {
    "conversation_id": "conversation-uuid"
  }
}
```

The server broadcasts:

```json
{
  "type": "typing.start",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:02:00Z",
  "payload": {
    "conversation_id": "conversation-uuid",
    "user_id": "alice-uuid"
  }
}
```

The sender should not receive their own typing event.

---

# 28. Typing Stop

When typing ends:

```json
{
  "type": "typing.stop",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:02:03Z",
  "payload": {
    "conversation_id": "conversation-uuid"
  }
}
```

Server broadcasts:

```json
{
  "type": "typing.stop",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:02:03Z",
  "payload": {
    "conversation_id": "conversation-uuid",
    "user_id": "alice-uuid"
  }
}
```

---

# 29. Typing Indicator Debouncing

The frontend must debounce typing events.

Recommended behavior:

```text
first keystroke
     │
     ▼
typing.start
     │
     │ user continues typing
     │
     └── no repeated start events
     
user stops typing
     │
     ▼
typing.stop
```

Recommended timeout:

```text
1–2 seconds
```

The exact value may be tuned during implementation.

---

# 30. Presence

Presence is intentionally simplified.

Possible states:

```text
online
offline
```

The backend may maintain:

```text
last_seen_at
```

in the user record or presence subsystem.

---

# 31. Presence Update

The server may broadcast:

```json
{
  "type": "presence.update",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:03:00Z",
  "payload": {
    "user_id": "alice-uuid",
    "status": "online",
    "last_seen_at": null
  }
}
```

When disconnected:

```json
{
  "type": "presence.update",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:10:00Z",
  "payload": {
    "user_id": "alice-uuid",
    "status": "offline",
    "last_seen_at": "2026-08-13T14:10:00Z"
  }
}
```

---

# 32. Presence Scope

Presence should only be broadcast to users who can reasonably see the user's presence.

At minimum:

```text
contacts
conversation members
```

The backend must not expose arbitrary user presence data without authorization.

---

# 33. Conversation Updates

When a conversation's latest activity changes, the server may broadcast:

```json
{
  "type": "conversation.updated",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:04:00Z",
  "payload": {
    "conversation_id": "conversation-uuid",
    "last_message_id": "message-uuid",
    "updated_at": "2026-08-13T14:04:00Z"
  }
}
```

The frontend uses this event to:

```text
update last-message preview
move conversation to top
update unread count
```

---

# 34. Group Member Added

When an administrator adds a member:

```json
{
  "type": "group.member_added",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:05:00Z",
  "payload": {
    "conversation_id": "conversation-uuid",
    "user": {
      "id": "user-uuid",
      "display_name": "David",
      "avatar_url": null
    },
    "role": "member"
  }
}
```

The event is delivered to active group members.

---

# 35. Group Member Removed

```json
{
  "type": "group.member_removed",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:06:00Z",
  "payload": {
    "conversation_id": "conversation-uuid",
    "user_id": "user-uuid"
  }
}
```

A removed user's client must stop treating the conversation as accessible.

The backend remains the source of truth.

---

# 36. Group Updated

For group name changes:

```json
{
  "type": "group.updated",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:07:00Z",
  "payload": {
    "conversation_id": "conversation-uuid",
    "changes": {
      "name": "Engineering Team"
    }
  }
}
```

---

# 37. Error Events

Application-level WebSocket errors use:

```json
{
  "type": "error",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:08:00Z",
  "payload": {
    "code": "NOT_A_MEMBER",
    "message": "You are not a member of this conversation",
    "request_event_id": "client-event-uuid"
  }
}
```

---

# 38. WebSocket Error Codes

Supported examples:

```text
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
NOT_A_MEMBER
NOT_AN_ADMIN
INVALID_MESSAGE
MESSAGE_TOO_LARGE
DUPLICATE_MESSAGE
INVALID_EVENT
RATE_LIMITED
INTERNAL_ERROR
```

The error should reference the originating event when possible.

---

# 39. Heartbeat

The client and server should maintain the connection using heartbeat messages.

Client:

```json
{
  "type": "ping",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:10:00Z",
  "payload": {}
}
```

Server:

```json
{
  "type": "pong",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:10:00Z",
  "payload": {}
}
```

Recommended heartbeat interval:

```text
20–30 seconds
```

The exact value may be adjusted for the deployment environment.

---

# 40. Server-Initiated Ping

The server may also initiate heartbeat messages.

If implemented:

```json
{
  "type": "ping",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:10:00Z",
  "payload": {}
}
```

The client responds:

```json
{
  "type": "pong",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:10:00Z",
  "payload": {}
}
```

Only one heartbeat mechanism needs to be implemented for the assignment.

---

# 41. Reconnection

The frontend must automatically reconnect when the connection is unexpectedly closed.

Recommended strategy:

```text
attempt 1 → 1 second
attempt 2 → 2 seconds
attempt 3 → 4 seconds
attempt 4 → 8 seconds
...
```

with a maximum delay.

Example:

```text
max delay = 30 seconds
```

---

# 42. Reconnection Flow

```text
CONNECTED
   │
   │ network failure
   ▼
DISCONNECTED
   │
   ▼
RECONNECTING
   │
   ├── failure → exponential backoff
   │
   └── success
          │
          ▼
       CONNECTED
          │
          ▼
   refresh conversation state
```

---

# 43. State Recovery After Reconnect

After reconnecting, the frontend must assume that events may have been missed.

It should:

```text
1. Re-authenticate
2. Re-establish WebSocket
3. Refresh conversation list
4. Refresh currently open conversation
5. Reconcile local message state
6. Resume real-time events
```

REST is the authoritative recovery mechanism.

The application must not attempt to reconstruct missing events solely from client memory.

---

# 44. Message Ordering

Messages within a conversation should be ordered by:

```text
created_at
```

with the server-generated message ID used as a deterministic tie-breaker if necessary.

The frontend should not rely exclusively on local clock timestamps for ordering.

---

# 45. Server Timestamp

The backend is the authoritative source for persisted message timestamps.

Example:

```text
client timestamp
       │
       ▼
server receives
       │
       ▼
server timestamp
       │
       ▼
database
```

This avoids major inconsistencies caused by client clock differences.

---

# 46. Duplicate Events

The frontend should tolerate receiving the same event more than once.

Events can be deduplicated using:

```text
event_id
```

Messages can be deduplicated using:

```text
message.id
client_message_id
```

---

# 47. Duplicate Message Protection

If a client retries:

```text
message.send
```

with the same:

```text
client_message_id
```

the backend should return the existing persisted message rather than creating another message.

Conceptually:

```text
client_message_id
       │
       ▼
database lookup
       │
   ┌───┴────┐
   │        │
exists    absent
   │        │
   ▼        ▼
return    create
existing   message
```

---

# 48. Offline Message Handling

If a recipient is offline:

```text
message
   │
   ▼
persisted
   │
   ▼
recipient offline
   │
   ▼
no WebSocket delivery
```

When the recipient reconnects:

```text
reconnect
   │
   ▼
load conversation history
   │
   ▼
unread messages become visible
```

The server does not need a complex push notification system for this assignment.

---

# 49. Unread Count

The backend may maintain unread counts using message receipts or conversation membership state.

Recommended conceptual model:

```text
last_read_message_id
```

or equivalent membership-level read state.

The frontend may temporarily calculate unread state, but the backend should remain authoritative after synchronization.

---

# 50. Read Receipt Optimization

The frontend does not need to emit one read event for every message.

For example:

```text
Messages:
1
2
3
4
5
```

If the user has viewed through message `5`, the frontend can mark the appropriate range/read position instead of producing unnecessary events.

For the initial implementation, individual message read events are acceptable.

---

# 51. Typing Privacy

Typing events are ephemeral.

They should generally:

```text
not be persisted
not be included in message history
not create database rows
```

They exist only while the user is actively typing.

---

# 52. Presence Privacy

Presence is also ephemeral except for:

```text
last_seen_at
```

The WebSocket connection state itself should not be stored as a permanent database event.

---

# 53. Connection Manager

The backend should use a dedicated connection manager abstraction.

Example conceptual interface:

```python
class ConnectionManager:
    async def connect(...)
    async def disconnect(...)
    async def send_to_user(...)
    async def send_to_conversation(...)
    async def broadcast(...)
```

The WebSocket router should not contain connection bookkeeping logic.

---

# 54. Connection Registry

For the assignment, an in-memory registry is sufficient:

```text
user_id → active WebSocket connections
```

Example:

```text
{
    "alice-id": [socket1],
    "bob-id": [socket2],
    "charlie-id": [socket3]
}
```

Multiple connections per user may be supported.

---

# 55. Conversation Broadcast

The connection manager should provide a logical operation:

```text
broadcast_to_conversation(conversation_id, event)
```

It must:

1. obtain active members
2. find their active WebSocket connections
3. send the event
4. handle failed connections
5. remove dead connections

---

# 56. Single-Process Constraint

The assignment is expected to run as a small application.

Therefore:

```text
in-memory connection manager
```

is acceptable.

No Redis Pub/Sub system is required.

If the application is later scaled horizontally, a shared event broker would be required.

This is intentionally out of scope.

---

# 57. WebSocket Security

Every event must be authorized server-side.

Never trust:

```text
conversation_id
user_id
role
```

from the client.

For example:

```text
typing.start
```

must verify that the sender belongs to the conversation.

Likewise:

```text
message.send
```

must verify membership before persistence.

---

# 58. Message Content Validation

The server must enforce message limits.

Recommended:

```text
minimum: 1 character
maximum: 10,000 characters
```

Whitespace-only messages should be rejected.

The frontend may validate first for UX, but backend validation remains mandatory.

---

# 59. Event Size

WebSocket messages should remain small.

Large payloads such as files should not be sent directly through the normal messaging event.

For attachments:

```text
upload file
     │
     ▼
HTTP upload endpoint
     │
     ▼
storage
     │
     ▼
message containing attachment metadata
```

Attachments are optional bonus functionality.

---

# 60. Attachment Placeholder

If attachments are implemented later, the message payload can evolve to:

```json
{
  "message_type": "image",
  "content": null,
  "attachment": {
    "id": "uuid",
    "url": "...",
    "filename": "photo.jpg",
    "mime_type": "image/jpeg",
    "size": 123456
  }
}
```

This is outside the minimum real-time protocol.

---

# 61. Reply-to Messages

Optional reply support:

```json
{
  "type": "message.send",
  "payload": {
    "conversation_id": "uuid",
    "content": "Yes, exactly.",
    "message_type": "text",
    "reply_to_id": "message-uuid"
  }
}
```

The backend must validate that the referenced message belongs to the same conversation.

---

# 62. Reaction Events

Optional bonus functionality:

```text
reaction.add
reaction.remove
```

Example:

```json
{
  "type": "reaction.add",
  "event_id": "uuid",
  "timestamp": "2026-08-13T14:15:00Z",
  "payload": {
    "message_id": "message-uuid",
    "emoji": "❤️"
  }
}
```

Reactions should only be implemented after all mandatory functionality is complete.

---

# 63. Disappearing Messages

Optional functionality.

If implemented, the backend should persist an expiration timestamp:

```text
expires_at
```

The server becomes authoritative for expiration.

The client must not merely hide expired messages locally.

---

# 64. Event Delivery Guarantees

The system provides:

```text
at-least-once event delivery
```

rather than exactly-once delivery.

Therefore:

```text
duplicate events are possible
```

and both frontend and backend must tolerate them.

Persistence is the authoritative source of truth.

---

# 65. Failure Scenarios

## Database Failure

```text
message.send
      │
      ▼
database error
      │
      ▼
message.ack not sent
      │
      ▼
error event
```

The client shows:

```text
failed
```

---

# 66. Recipient Disconnect

```text
message.send
      │
      ▼
persist
      │
      ▼
recipient socket unavailable
      │
      ▼
sender still receives ACK
      │
      ▼
recipient gets message after reconnect
```

---

# 67. Sender Disconnect During Send

Potential scenario:

```text
client sends message
      │
      ▼
server persists
      │
      X
socket disconnects
```

The client may not receive `message.ack`.

On reconnect:

```text
client refreshes history
        │
        ▼
message exists
        │
        ▼
client reconciles client_message_id
```

This is why persistence and client IDs are important.

---

# 68. Reconciliation Strategy

After reconnect:

```text
local messages
      │
      ▼
server messages
      │
      ▼
match by message.id
      │
      or
      │
match by client_message_id
      │
      ▼
remove duplicate optimistic message
```

---

# 69. Optimistic UI

The frontend may display a message immediately:

```text
User presses Send
       │
       ▼
optimistic message
       │
       ▼
status = sending
       │
       ▼
WebSocket
       │
       ▼
message.ack
       │
       ▼
status = sent
```

If the server returns an error:

```text
status = failed
```

and the user can retry.

---

# 70. Real-Time Conversation List

When a new message arrives:

```text
message.new
       │
       ▼
conversation.updated
       │
       ▼
conversation moves to top
       │
       ▼
unread count increments
```

The frontend may derive some UI updates directly from the message event instead of requiring both events.

The backend remains responsible for sending the minimum events needed for consistency.

---

# 71. Event Example — Complete Direct Message

## Step 1 — Alice sends

```json
{
  "type": "message.send",
  "event_id": "event-1",
  "timestamp": "2026-08-13T14:20:00Z",
  "payload": {
    "client_message_id": "client-1",
    "conversation_id": "conversation-1",
    "content": "Hi Bob!",
    "message_type": "text",
    "reply_to_id": null
  }
}
```

## Step 2 — Server acknowledges

```json
{
  "type": "message.ack",
  "event_id": "event-2",
  "timestamp": "2026-08-13T14:20:00Z",
  "payload": {
    "client_message_id": "client-1",
    "message": {
      "id": "message-1",
      "conversation_id": "conversation-1",
      "sender_id": "alice",
      "content": "Hi Bob!",
      "created_at": "2026-08-13T14:20:00Z"
    },
    "status": "sent"
  }
}
```

## Step 3 — Bob receives

```json
{
  "type": "message.new",
  "event_id": "event-3",
  "timestamp": "2026-08-13T14:20:00Z",
  "payload": {
    "message": {
      "id": "message-1",
      "conversation_id": "conversation-1",
      "sender_id": "alice",
      "content": "Hi Bob!",
      "created_at": "2026-08-13T14:20:00Z"
    }
  }
}
```

## Step 4 — Bob acknowledges delivery

```json
{
  "type": "message.delivered",
  "event_id": "event-4",
  "timestamp": "2026-08-13T14:20:01Z",
  "payload": {
    "message_id": "message-1",
    "conversation_id": "conversation-1"
  }
}
```

## Step 5 — Server broadcasts delivery

```json
{
  "type": "message.delivered",
  "event_id": "event-5",
  "timestamp": "2026-08-13T14:20:01Z",
  "payload": {
    "message_id": "message-1",
    "user_id": "bob",
    "status": "delivered",
    "delivered_at": "2026-08-13T14:20:01Z"
  }
}
```

## Step 6 — Bob reads

```json
{
  "type": "message.read",
  "event_id": "event-6",
  "timestamp": "2026-08-13T14:20:03Z",
  "payload": {
    "message_id": "message-1",
    "conversation_id": "conversation-1"
  }
}
```

## Step 7 — Server broadcasts read

```json
{
  "type": "message.read",
  "event_id": "event-7",
  "timestamp": "2026-08-13T14:20:03Z",
  "payload": {
    "message_id": "message-1",
    "user_id": "bob",
    "status": "read",
    "read_at": "2026-08-13T14:20:03Z"
  }
}
```

---

# 72. Complete Real-Time Architecture

```text
                    ┌─────────────────────┐
                    │      Next.js        │
                    │                     │
                    │  Chat UI             │
                    │  Conversation List   │
                    │  Message Composer    │
                    └──────────┬──────────┘
                               │
                         WebSocket
                               │
                               ▼
                    ┌─────────────────────┐
                    │ FastAPI WebSocket   │
                    │ Endpoint            │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Authentication      │
                    │ + Authorization     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Connection Manager  │
                    └──────────┬──────────┘
                               │
                  ┌────────────┼────────────┐
                  │            │            │
                  ▼            ▼            ▼
              Messaging     Typing       Presence
               Service      Service       Service
                  │            │            │
                  ▼            │            │
              Repository       │            │
                  │            │            │
                  ▼            │            │
                SQLite         │            │
                  │            │            │
                  └────────────┴────────────┘
                               │
                               ▼
                        Connected Clients
```

---

# 73. Implementation Rules

The WebSocket implementation must follow these rules:

```text
1. Authenticate every connection.
2. Validate every incoming event.
3. Authorize every conversation operation.
4. Persist messages before successful ACK.
5. Use client_message_id for retry reconciliation.
6. Use event_id for event deduplication.
7. Never trust client-provided roles.
8. Do not persist typing events.
9. Do not depend on recipients being online for persistence.
10. Use REST to recover missed state.
11. Support automatic reconnection.
12. Keep the protocol simple and explicit.
```

---

# 74. Minimum Required Events

The following events are mandatory for assignment completion:

```text
connection.init
connection.ready

message.send
message.ack
message.new

message.delivered
message.read

typing.start
typing.stop

presence.update

error

ping
pong
```

---

# 75. Optional Events

These may be implemented after the mandatory functionality:

```text
conversation.updated
group.member_added
group.member_removed
group.updated

reaction.add
reaction.remove
```

---

# 76. Acceptance Criteria

The WebSocket layer is considered complete when:

```text
✓ Users can establish authenticated connections
✓ Connection state is visible in the application
✓ Messages arrive in real time
✓ Messages persist in SQLite
✓ Sender receives message acknowledgement
✓ Recipient receives new messages
✓ Delivery state works
✓ Read state works
✓ Typing indicators work
✓ Online/offline state works
✓ Group messages work
✓ Group membership changes propagate
✓ Unauthorized conversation access is rejected
✓ Duplicate message retries do not create duplicate messages
✓ Connection loss is handled
✓ Client reconnects automatically
✓ Missed messages are recovered from REST/database
✓ WebSocket errors have structured responses
✓ Heartbeat prevents stale connections
```

---

# 77. Out of Scope

The following are explicitly outside this protocol:

```text
Signal Protocol
Double Ratchet
X3DH
Prekeys
Actual end-to-end encryption
Cryptographic identity verification
Multi-device cryptographic synchronization
Push notification infrastructure
Distributed WebSocket clusters
Redis Pub/Sub
Kafka
Message queue infrastructure
```

These would add significant complexity without improving the assignment's evaluation against the stated requirements.

---

# 78. Scaling Note

The initial implementation uses:

```text
single FastAPI process
+
in-memory ConnectionManager
+
SQLite
```

This is appropriate for the assignment.

If horizontally scaling in the future:

```text
             Load Balancer
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
     FastAPI   FastAPI   FastAPI
        │         │         │
        └─────────┼─────────┘
                  ▼
             Redis Pub/Sub
```

would be required to propagate WebSocket events between processes.

This is intentionally not part of version 1.0.

---

# 79. Relationship to REST API

The authoritative REST contract is:

```text
docs/API_SPEC.md
```

REST defines persisted resources and CRUD operations.

This document defines ephemeral real-time events.

Neither protocol should duplicate the other's responsibilities unnecessarily.

---

# 80. Final Protocol Principle

The architecture follows one central rule:

```text
             DATABASE
                │
                │ source of truth
                ▼
          REST + WebSocket
                │
                ▼
             Frontend
```

WebSocket provides **speed**.

REST provides **recovery and authoritative state**.

The database provides **persistence**.

This separation ensures that temporary network failures do not corrupt the messaging state and keeps the real-time system understandable, testable, and maintainable.

**End of WEBSOCKET_PROTOCOL.md**

```
```
