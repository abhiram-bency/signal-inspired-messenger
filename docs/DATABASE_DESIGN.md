# `docs/DATABASE_DESIGN.md`

````markdown
# Database Design — Signal-Inspired Messenger

**Project:** Signal-Inspired Messenger  
**Status:** Authoritative Database Specification  
**Version:** 1.0  
**Database:** SQLite  
**ORM:** SQLAlchemy  
**Primary Key Strategy:** UUID  
**Last Updated:** 2026-08-13

---

# 1. Purpose

This document defines the authoritative relational database design for the Signal-Inspired Messenger.

It specifies:

- entities
- attributes
- primary keys
- foreign keys
- relationships
- constraints
- indexes
- deletion behavior
- message lifecycle
- receipt lifecycle
- group membership rules
- contact relationships
- session persistence
- seed data requirements

This document must be implemented consistently by both the backend models and database initialization/migration layer.

The database is intentionally designed for the assignment's required SQLite environment.

---

# 2. Database Design Goals

The database must provide:

1. Correct relational modeling
2. Referential integrity
3. Efficient conversation/message queries
4. Persistent message history
5. Persistent group membership
6. Persistent delivery/read receipts
7. Persistent sessions
8. Efficient conversation-list retrieval
9. Clear authorization relationships
10. A schema that can be explained confidently during evaluation

---

# 3. Database Technology

The project uses:

```text
SQLite
   +
SQLAlchemy
````

SQLite is the required assignment database.

The architecture must not depend on:

* PostgreSQL
* MySQL
* MongoDB
* Redis
* external database services

for the core implementation.

---

# 4. Database Location

Development:

```text
backend/data/messenger.db
```

The exact path may be configurable through environment variables.

Example:

```env
DATABASE_URL=sqlite:///./data/messenger.db
```

Production must use a persistent disk/volume so that the SQLite database is not lost on application restart.

---

# 5. Entity Overview

The database contains the following primary entities:

```text
users
    │
    ├────────────── contacts
    │
    ├────────────── conversation_members
    │                         │
    │                         ▼
    │                   conversations
    │                         │
    │                         ▼
    │                      messages
    │                         │
    │              ┌──────────┴──────────┐
    │              ▼                     ▼
    │        message_receipts      message_reactions
    │
    ├────────────── sessions
    │
    └────────────── attachments
```

Core tables:

```text
users
sessions
contacts
conversations
conversation_members
messages
message_receipts
message_reactions
attachments
```

---

# 6. ER Diagram

```text
                                      ┌──────────────────┐
                                      │      USERS       │
                                      ├──────────────────┤
                                      │ id PK            │
                                      │ username UNIQUE  │
                                      │ phone UNIQUE     │
                                      │ display_name     │
                                      │ avatar_url       │
                                      │ password_hash    │
                                      │ is_online        │
                                      │ last_seen_at     │
                                      │ created_at       │
                                      │ updated_at       │
                                      └────────┬─────────┘
                                               │
                     ┌─────────────────────────┼─────────────────────────┐
                     │                         │                         │
                     │                         │                         │
                     ▼                         ▼                         ▼
            ┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
            │    CONTACTS     │      │     SESSIONS     │      │  CONVERSATION   │
            ├─────────────────┤      ├──────────────────┤      │    MEMBERS      │
            │ id PK           │      │ id PK            │      ├─────────────────┤
            │ owner_id FK     │      │ user_id FK       │      │ id PK           │
            │ contact_id FK   │      │ token_hash       │      │ conversation_id │
            │ nickname        │      │ expires_at       │      │ user_id FK      │
            │ created_at      │      │ created_at       │      │ role            │
            └────────┬────────┘      └──────────────────┘      │ joined_at       │
                     │                                         │ left_at         │
                     │                                         └────────┬────────┘
                     │                                                  │
                     │                                                  ▼
                     │                                         ┌──────────────────┐
                     │                                         │  CONVERSATIONS   │
                     │                                         ├──────────────────┤
                     │                                         │ id PK            │
                     │                                         │ type             │
                     │                                         │ name             │
                     │                                         │ avatar_url       │
                     │                                         │ created_by FK    │
                     │                                         │ created_at       │
                     │                                         │ updated_at       │
                     │                                         └────────┬─────────┘
                     │                                                  │
                     │                                                  │
                     │                                                  ▼
                     │                                         ┌──────────────────┐
                     │                                         │     MESSAGES     │
                     │                                         ├──────────────────┤
                     │                                         │ id PK            │
                     │                                         │ conversation_id  │
                     │                                         │ sender_id FK     │
                     │                                         │ content          │
                     │                                         │ message_type     │
                     │                                         │ reply_to_id     │
                     │                                         │ created_at       │
                     │                                         │ edited_at        │
                     │                                         │ deleted_at       │
                     │                                         └───────┬──────────┘
                     │                                                 │
                     │                          ┌──────────────────────┼──────────────────────┐
                     │                          │                      │                      │
                     │                          ▼                      ▼                      ▼
                     │                ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
                     │                │ MESSAGE RECEIPTS │   │ MESSAGE REACTION │   │   ATTACHMENTS    │
                     │                ├──────────────────┤   ├──────────────────┤   ├──────────────────┤
                     │                │ id PK            │   │ id PK            │   │ id PK            │
                     │                │ message_id FK    │   │ message_id FK    │   │ message_id FK    │
                     │                │ user_id FK       │   │ user_id FK       │   │ file_name        │
                     │                │ status           │   │ emoji            │   │ file_url         │
                     │                │ delivered_at     │   │ created_at       │   │ mime_type        │
                     │                │ read_at          │   │                  │   │ file_size        │
                     │                └──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

# 7. UUID Strategy

All major entities use UUID primary keys.

Example:

```text
550e8400-e29b-41d4-a716-446655440000
```

Benefits:

* globally unique identifiers
* safe client/server reconciliation
* easier distributed evolution
* avoids sequential ID exposure
* appropriate for WebSocket event identifiers

UUIDs may be generated by the application.

SQLite stores them as strings.

---

# 8. Timestamp Strategy

All timestamps are stored in UTC.

The backend is responsible for generating authoritative timestamps.

Frontend clients may display timestamps using local timezone formatting.

Required timestamp fields use:

```text
DateTime
```

and should be timezone-aware at the application layer.

---

# 9. Users Table

Table:

```text
users
```

Represents an authenticated application user.

## Columns

| Column          | Type        | Constraints      | Description                      |
| --------------- | ----------- | ---------------- | -------------------------------- |
| `id`            | UUID/String | PK               | User identifier                  |
| `username`      | String      | UNIQUE, nullable | Login identifier                 |
| `phone`         | String      | UNIQUE, nullable | Optional phone identifier        |
| `display_name`  | String      | NOT NULL         | Public display name              |
| `avatar_url`    | String      | nullable         | Profile avatar                   |
| `password_hash` | String      | nullable         | Mocked authentication credential |
| `is_online`     | Boolean     | NOT NULL         | Current presence state           |
| `last_seen_at`  | DateTime    | nullable         | Last known presence              |
| `created_at`    | DateTime    | NOT NULL         | Account creation                 |
| `updated_at`    | DateTime    | NOT NULL         | Last profile update              |

---

# 10. User Identity Rules

At least one of:

```text
username
phone
```

must identify the user.

The application may support:

```text
username-only
```

registration as the simplest implementation.

Phone registration is supported conceptually because it is part of the assignment.

---

# 11. Username Constraints

Username should:

* be normalized to a consistent case
* have a reasonable length limit
* contain only supported characters
* be unique

Recommended:

```text
3–32 characters
```

The backend must perform validation.

---

# 12. Phone Constraints

If phone registration is implemented:

* normalize the phone number before storage
* store one canonical representation
* enforce uniqueness

Real SMS verification is not required.

---

# 13. Display Name Constraints

Display name:

```text
1–64 characters
```

It must not be empty after trimming whitespace.

---

# 14. Password Storage

If password-based authentication is implemented, plaintext passwords must never be stored.

Store:

```text
password_hash
```

The exact hashing implementation may use a standard password hashing library.

For the mocked assignment authentication flow, password authentication may be replaced by OTP/session authentication.

---

# 15. User Presence

Presence fields:

```text
is_online
last_seen_at
```

are updated based on WebSocket connection state.

Example:

```text
connect
  ↓
is_online = true

disconnect
  ↓
is_online = false
last_seen_at = now
```

Presence is not considered a permanent user attribute.

---

# 16. Sessions Table

Table:

```text
sessions
```

Stores persistent authentication sessions.

## Columns

| Column       | Type        | Constraints      |
| ------------ | ----------- | ---------------- |
| `id`         | UUID/String | PK               |
| `user_id`    | UUID/String | FK → users.id    |
| `token_hash` | String      | UNIQUE, NOT NULL |
| `expires_at` | DateTime    | NOT NULL         |
| `created_at` | DateTime    | NOT NULL         |
| `revoked_at` | DateTime    | nullable         |

---

# 17. Session Security

The raw session token should not need to be stored in plaintext.

Preferred model:

```text
client token
     ↓
hash
     ↓
database
```

The browser should receive the session through a secure authentication mechanism.

For production:

```text
HttpOnly
Secure
SameSite
```

should be configured appropriately.

---

# 18. Session Lifecycle

```text
Login
  ↓
create session
  ↓
client receives authentication state
  ↓
authenticated requests
  ↓
logout
  ↓
session revoked
```

Expired sessions must be rejected.

---

# 19. Contacts Table

Table:

```text
contacts
```

Represents a user's saved contacts.

This is a directional relationship.

If:

```text
A adds B
```

it does not automatically mean:

```text
B adds A
```

unless the application explicitly implements mutual contact behavior.

---

# 20. Contacts Columns

| Column       | Type        | Constraints   | Description             |
| ------------ | ----------- | ------------- | ----------------------- |
| `id`         | UUID/String | PK            | Contact relationship ID |
| `owner_id`   | UUID/String | FK → users.id | User owning contact     |
| `contact_id` | UUID/String | FK → users.id | User being saved        |
| `nickname`   | String      | nullable      | Optional local nickname |
| `created_at` | DateTime    | NOT NULL      | Creation time           |

---

# 21. Contact Constraints

The following must be enforced:

```text
owner_id != contact_id
```

and:

```text
UNIQUE(owner_id, contact_id)
```

This prevents duplicate contacts.

---

# 22. Contact Deletion

If a user deletes a contact:

```text
contact row deleted
```

The users themselves are not deleted.

Existing conversations and messages remain intact.

---

# 23. Conversations Table

Table:

```text
conversations
```

Represents both:

* direct conversations
* group conversations

This is the central abstraction for messaging.

---

# 24. Conversation Columns

| Column       | Type        | Constraints   | Description             |
| ------------ | ----------- | ------------- | ----------------------- |
| `id`         | UUID/String | PK            | Conversation identifier |
| `type`       | Enum/String | NOT NULL      | `direct` or `group`     |
| `name`       | String      | nullable      | Group name              |
| `avatar_url` | String      | nullable      | Group avatar            |
| `created_by` | UUID/String | FK → users.id | Creator                 |
| `created_at` | DateTime    | NOT NULL      | Creation time           |
| `updated_at` | DateTime    | NOT NULL      | Latest activity         |

---

# 25. Conversation Types

Allowed values:

```text
direct
group
```

No other type should be introduced without updating the master specification.

---

# 26. Direct Conversation Rules

A direct conversation must have exactly two active members.

Conceptually:

```text
conversation.type = direct
```

and:

```text
members = 2
```

The application service must prevent duplicate direct conversations between the same two users.

---

# 27. Group Conversation Rules

A group conversation:

```text
conversation.type = group
```

may contain multiple members.

A group must have:

* a name
* a creator
* at least one member

The creator is automatically an administrator.

---

# 28. Conversation Ordering

The conversation list is ordered by:

```text
updated_at DESC
```

When a message is created:

```text
conversation.updated_at = message.created_at
```

This ensures active conversations appear first.

---

# 29. Conversation Members Table

Table:

```text
conversation_members
```

This is the many-to-many relationship between:

```text
users
```

and:

```text
conversations
```

---

# 30. Conversation Members Columns

| Column            | Type        | Constraints | Description             |
| ----------------- | ----------- | ----------- | ----------------------- |
| `id`              | UUID/String | PK          | Membership ID           |
| `conversation_id` | UUID/String | FK          | Conversation            |
| `user_id`         | UUID/String | FK          | Member                  |
| `role`            | String/Enum | NOT NULL    | `member` or `admin`     |
| `joined_at`       | DateTime    | NOT NULL    | Join timestamp          |
| `left_at`         | DateTime    | nullable    | Leave/removal timestamp |

---

# 31. Membership Constraints

Prevent duplicate membership:

```text
UNIQUE(conversation_id, user_id)
```

Allowed roles:

```text
member
admin
```

---

# 32. Membership Lifecycle

```text
created
   ↓
active
   ↓
removed/left
```

For group history, retaining membership records with `left_at` is preferred over immediately deleting them.

This preserves historical membership information.

---

# 33. Group Administration

Only members with:

```text
role = admin
```

may perform administrative operations.

Examples:

```text
add member
remove member
rename group
```

The backend must enforce this.

Frontend controls are not security boundaries.

---

# 34. Messages Table

Table:

```text
messages
```

Stores all persisted messages.

Both direct and group messages use this table.

---

# 35. Messages Columns

| Column            | Type        | Constraints      | Description             |
| ----------------- | ----------- | ---------------- | ----------------------- |
| `id`              | UUID/String | PK               | Message identifier      |
| `conversation_id` | UUID/String | FK               | Conversation            |
| `sender_id`       | UUID/String | FK               | Sender                  |
| `content`         | Text        | nullable         | Message text            |
| `message_type`    | String/Enum | NOT NULL         | `text`, `system`, etc.  |
| `reply_to_id`     | UUID/String | FK → messages.id | Optional quoted message |
| `created_at`      | DateTime    | NOT NULL         | Creation timestamp      |
| `edited_at`       | DateTime    | nullable         | Edit timestamp          |
| `deleted_at`      | DateTime    | nullable         | Soft deletion timestamp |

---

# 36. Message Types

Minimum required:

```text
text
```

Optional:

```text
system
image
file
```

Optional message types must only be implemented if corresponding functionality exists.

---

# 37. Message Content Rules

For text messages:

```text
content != null
```

and after trimming:

```text
content != ""
```

The backend should enforce a reasonable maximum message length.

Recommended:

```text
10,000 characters
```

---

# 38. Message Authorization

A user may send a message only when:

```text
user is an active member
```

of:

```text
message.conversation_id
```

This must be checked server-side.

---

# 39. Message Persistence Rule

A message must be persisted before it is broadcast as successfully created.

Correct:

```text
receive
  ↓
validate
  ↓
persist
  ↓
commit
  ↓
broadcast
```

Incorrect:

```text
receive
  ↓
broadcast
  ↓
persist
```

The latter could cause clients to display messages that were never stored.

---

# 40. Message Ordering

Messages should be retrieved in:

```text
created_at ASC
```

for normal conversation rendering.

Pagination should use a cursor based on message ID/timestamp where practical.

---

# 41. Message Editing

If editing is implemented:

```text
content updated
edited_at = current timestamp
```

The original message ID remains unchanged.

---

# 42. Message Deletion

Messages should use soft deletion where practical:

```text
deleted_at != null
```

The original database row remains.

The UI may display:

```text
This message was deleted
```

This is preferable to hard deletion because it preserves receipt/reaction relationships.

---

# 43. Reply-to Messages

Reply functionality is optional.

If implemented:

```text
reply_to_id → messages.id
```

A reply must reference a message in the same conversation.

The service layer must validate this.

---

# 44. Message Receipts Table

Table:

```text
message_receipts
```

Stores delivery/read state for messages.

---

# 45. Message Receipt Columns

| Column         | Type        | Constraints |
| -------------- | ----------- | ----------- |
| `id`           | UUID/String | PK          |
| `message_id`   | UUID/String | FK          |
| `user_id`      | UUID/String | FK          |
| `status`       | String/Enum | NOT NULL    |
| `delivered_at` | DateTime    | nullable    |
| `read_at`      | DateTime    | nullable    |

---

# 46. Receipt Status

Allowed values:

```text
sent
delivered
read
```

The sender does not need a receipt row representing their own message status if the message's persisted existence already represents `sent`.

For recipients, receipt rows track delivery/read state.

---

# 47. Receipt State Machine

```text
sent
  │
  ▼
delivered
  │
  ▼
read
```

Transitions must not move backward.

Invalid:

```text
read → delivered
```

---

# 48. Receipt Constraints

Prevent duplicate receipt records:

```text
UNIQUE(message_id, user_id)
```

A receipt user must be a member of the message's conversation.

The service layer must enforce this relationship.

---

# 49. Direct Message Receipts

For a direct conversation:

```text
Sender A
   ↓
Message
   ↓
Recipient B
```

The recipient's receipt progresses:

```text
sent → delivered → read
```

The UI maps this to the familiar checkmark experience.

---

# 50. Group Message Receipts

For a group:

```text
Sender
  ↓
Message
  ↓
Member B
Member C
Member D
```

Each recipient can have an independent receipt.

Example:

```text
B → read
C → delivered
D → sent
```

The sender may display aggregate status according to UI design.

---

# 51. Message Reactions Table

Table:

```text
message_reactions
```

This table is optional because reactions are a bonus feature.

---

# 52. Reaction Columns

| Column       | Type        | Constraints |
| ------------ | ----------- | ----------- |
| `id`         | UUID/String | PK          |
| `message_id` | UUID/String | FK          |
| `user_id`    | UUID/String | FK          |
| `emoji`      | String      | NOT NULL    |
| `created_at` | DateTime    | NOT NULL    |

---

# 53. Reaction Constraints

Recommended:

```text
UNIQUE(message_id, user_id, emoji)
```

A user can therefore apply one instance of the same emoji to a message.

The application may permit multiple different emoji reactions.

---

# 54. Attachment Table

Table:

```text
attachments
```

Attachments are optional bonus functionality.

---

# 55. Attachment Columns

| Column       | Type        | Constraints |
| ------------ | ----------- | ----------- |
| `id`         | UUID/String | PK          |
| `message_id` | UUID/String | FK          |
| `file_name`  | String      | NOT NULL    |
| `file_url`   | String      | NOT NULL    |
| `mime_type`  | String      | NOT NULL    |
| `file_size`  | Integer     | NOT NULL    |
| `created_at` | DateTime    | NOT NULL    |

---

# 56. Attachment Rules

An attachment belongs to a message.

The attachment should not exist without its parent message.

Recommended deletion:

```text
message deleted
   ↓
attachment deleted
```

---

# 57. Foreign Key Rules

Foreign keys must be enabled in SQLite.

Conceptually:

```sql
PRAGMA foreign_keys = ON;
```

This must be configured when creating database connections.

---

# 58. Foreign Key Matrix

| Child Table            | FK                | Parent             |
| ---------------------- | ----------------- | ------------------ |
| `sessions`             | `user_id`         | `users.id`         |
| `contacts`             | `owner_id`        | `users.id`         |
| `contacts`             | `contact_id`      | `users.id`         |
| `conversations`        | `created_by`      | `users.id`         |
| `conversation_members` | `conversation_id` | `conversations.id` |
| `conversation_members` | `user_id`         | `users.id`         |
| `messages`             | `conversation_id` | `conversations.id` |
| `messages`             | `sender_id`       | `users.id`         |
| `messages`             | `reply_to_id`     | `messages.id`      |
| `message_receipts`     | `message_id`      | `messages.id`      |
| `message_receipts`     | `user_id`         | `users.id`         |
| `message_reactions`    | `message_id`      | `messages.id`      |
| `message_reactions`    | `user_id`         | `users.id`         |
| `attachments`          | `message_id`      | `messages.id`      |

---

# 59. Cascade Rules

Cascade behavior must preserve useful application history.

Recommended:

```text
User deletion
    ↓
avoid automatic destructive cascade of message history
```

For normal assignment operation, user deletion may be disabled entirely.

Conversation deletion:

```text
conversation
    ↓
members
messages
    ↓
receipts
reactions
attachments
```

may cascade where appropriate.

However, deleting conversations is not a core user-facing feature, so implementation may restrict this operation.

---

# 60. Index Strategy

Indexes are important because messaging applications frequently query:

* conversations by member
* messages by conversation
* messages by timestamp
* receipts by message/user
* contacts by owner
* users by username/phone

---

# 61. Required Indexes

## Users

```text
UNIQUE(username)
UNIQUE(phone)
```

---

## Sessions

```text
UNIQUE(token_hash)
INDEX(user_id)
INDEX(expires_at)
```

---

## Contacts

```text
INDEX(owner_id)
INDEX(contact_id)
UNIQUE(owner_id, contact_id)
```

---

## Conversations

```text
INDEX(updated_at)
INDEX(created_by)
```

---

## Conversation Members

```text
INDEX(user_id)
INDEX(conversation_id)
UNIQUE(conversation_id, user_id)
```

---

## Messages

```text
INDEX(conversation_id, created_at)
INDEX(sender_id)
INDEX(reply_to_id)
```

The composite index:

```text
(conversation_id, created_at)
```

is especially important for message history retrieval.

---

## Message Receipts

```text
INDEX(message_id)
INDEX(user_id)
UNIQUE(message_id, user_id)
```

---

## Reactions

```text
INDEX(message_id)
INDEX(user_id)
```

---

## Attachments

```text
INDEX(message_id)
```

---

# 62. Conversation List Query

The database must efficiently support:

> Get all conversations for the current user ordered by recent activity.

Conceptually:

```sql
SELECT c.*
FROM conversations c
JOIN conversation_members cm
  ON cm.conversation_id = c.id
WHERE cm.user_id = :current_user
  AND cm.left_at IS NULL
ORDER BY c.updated_at DESC;
```

This query should use indexes on:

```text
conversation_members.user_id
conversation_members.conversation_id
conversations.updated_at
```

---

# 63. Message History Query

Conceptually:

```sql
SELECT *
FROM messages
WHERE conversation_id = :conversation_id
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT :limit;
```

The composite index:

```text
(conversation_id, created_at)
```

must support this access pattern.

---

# 64. Unread Message Query

Conceptually:

```text
messages
   ↓
conversation membership
   ↓
receipt status
   ↓
sender != current user
   ↓
status != read
```

The implementation may optimize this query using the receipt indexes.

---

# 65. Contact Search

Users should be searchable by:

```text
username
display_name
phone
```

For SQLite, basic case-insensitive search is acceptable for the assignment.

The backend should apply a reasonable limit to search results.

---

# 66. Normalization

The schema follows normalized relational modeling.

Examples:

Instead of storing:

```text
conversation.member_ids = "a,b,c"
```

we use:

```text
conversation_members
```

Instead of storing:

```text
message.read_by = "a,b,c"
```

we use:

```text
message_receipts
```

This provides:

* referential integrity
* queryability
* extensibility
* clean relationships

---

# 67. Avoiding JSON-Based Core Relationships

Core relational relationships must not be stored as JSON blobs.

Avoid:

```text
members_json
read_by_json
contacts_json
```

The following must remain normalized tables:

```text
contacts
conversation_members
message_receipts
message_reactions
```

---

# 68. Optional Features and Schema Impact

## Reactions

Uses:

```text
message_reactions
```

## Reply-to

Uses:

```text
messages.reply_to_id
```

## Attachments

Uses:

```text
attachments
```

## Disappearing Messages

If implemented, additional conversation/message expiry fields may be introduced.

Recommended approach:

```text
conversations.disappearing_messages_seconds
```

and/or:

```text
messages.expires_at
```

Only implement if the bonus feature is actually completed.

---

# 69. System Messages

If group events need to be represented in message history, use:

```text
message_type = system
```

Examples:

```text
Alice added Bob
Alice removed Charlie
Group name changed
```

This avoids creating separate persistence systems for timeline events.

---

# 70. Group Membership Events

If system messages are used:

```text
conversation_members
```

remains the source of truth for current membership.

System messages are historical presentation data only.

---

# 71. Seed Data Requirements

The assignment explicitly requires seeded data.

The database should contain enough data to demonstrate the application immediately after startup.

Minimum seed:

```text
6+ users
3+ direct conversations
2+ group conversations
multiple messages
different timestamps
unread messages
different receipt states
contacts
```

---

# 72. Recommended Seed Users

Example:

```text
alice
bob
charlie
diana
eve
frank
```

These are demonstration identities only.

Passwords/OTP values must be clearly documented as development-only credentials.

---

# 73. Recommended Seed Conversations

Example:

```text
Alice ↔ Bob
Alice ↔ Charlie
Bob ↔ Diana
```

Groups:

```text
Engineering Team
Project Alpha
```

---

# 74. Seed Message Requirements

Seed messages should demonstrate:

* short messages
* long messages
* multiple messages in sequence
* different timestamps
* unread messages
* delivered messages
* read messages
* group messages

Example:

```text
Alice: Hey Bob!
Bob: Hey! How are you?
Alice: Working on the project.
Bob: Same here.
```

---

# 75. Seed Idempotency

Running the seed process multiple times must not create duplicate data.

Preferred approaches:

```text
check by stable username
```

or:

```text
use deterministic seed identifiers
```

Example:

```text
if alice exists:
    do not create Alice again
```

---

# 76. Seed Separation

Seed data must not be mixed with production business logic.

Use a dedicated seed command/module.

Example:

```text
python -m app.database.seed
```

The exact command may differ according to implementation.

---

# 77. Data Integrity Rules

The following invariants must always hold.

### User

```text
username unique
phone unique
```

### Contact

```text
owner != contact
```

### Conversation membership

```text
conversation + user unique
```

### Direct conversation

```text
exactly two active members
```

### Group

```text
at least one member
creator is admin
```

### Message

```text
sender belongs to conversation
```

### Receipt

```text
message + user unique
```

### Reaction

```text
message + user + emoji unique
```

---

# 78. Authorization vs Database Constraints

Not every business rule should be represented as a database constraint.

Database constraints handle:

```text
uniqueness
foreign keys
required fields
basic integrity
```

Service logic handles:

```text
is this user a member?
is this user an admin?
can this user remove that member?
is this reply in the same conversation?
```

This separation is intentional.

---

# 79. Soft Delete Strategy

For messages:

```text
deleted_at
```

is preferred.

For users:

The assignment does not require account deletion.

For contacts:

Hard deletion is acceptable because the relationship itself is disposable.

For group memberships:

Use:

```text
left_at
```

to preserve historical membership.

---

# 80. Database Transaction Examples

## Send Message

```text
BEGIN
    insert message
    update conversation.updated_at
    insert recipient receipts
COMMIT

broadcast
```

---

## Create Group

```text
BEGIN
    insert conversation
    insert creator membership
    insert member memberships
COMMIT
```

---

## Add Group Member

```text
BEGIN
    validate admin
    validate target user
    insert membership
    optionally insert system message
COMMIT
```

---

# 81. Database Initialization

Application startup should:

1. configure database URL
2. create engine
3. enable SQLite foreign keys
4. initialize schema/migrations
5. make the database available

Seed data should be an explicit operation unless the implementation intentionally provides a safe idempotent startup seed.

---

# 82. SQLAlchemy Model Rules

Models should:

* use typed columns
* declare relationships clearly
* declare constraints explicitly
* declare indexes explicitly
* avoid business logic
* avoid API-specific behavior

Business logic belongs in services.

---

# 83. Relationship Examples

Conceptually:

```python
User
 ├── contacts
 ├── sessions
 ├── memberships
 ├── sent_messages
 ├── receipts
 └── reactions
```

and:

```python
Conversation
 ├── members
 └── messages
```

and:

```python
Message
 ├── sender
 ├── conversation
 ├── receipts
 ├── reactions
 ├── attachments
 └── reply_to
```

---

# 84. Database Diagram — Simplified

```text
             USERS
               │
       ┌───────┼─────────┐
       │       │         │
       ▼       ▼         ▼
   CONTACTS  SESSIONS  MEMBERS
                         │
                         ▼
                   CONVERSATIONS
                         │
                         ▼
                      MESSAGES
                    /    |     \
                   /     |      \
                  ▼      ▼       ▼
             RECEIPTS REACTIONS ATTACHMENTS
```

---

# 85. Database Performance Principles

Do not prematurely optimize.

The expected dataset is small.

However, the following must be optimized correctly:

```text
conversation list
message history
contact lookup
receipt lookup
membership lookup
```

Indexes should support these paths.

---

# 86. SQLite Limitations

SQLite is intentionally accepted despite limitations.

Known limitations:

* single-file database
* limited concurrent writes
* no native distributed database behavior
* production scaling limitations

These are acceptable for the assignment.

The README should explicitly state that SQLite was selected because it is required by the assignment.

---

# 87. Future Migration Path

If this application were productionized at larger scale:

```text
SQLite
   ↓
PostgreSQL
```

could be introduced.

The application architecture should make this migration easier because database access is already isolated behind repositories.

No PostgreSQL-specific functionality should be required for the current assignment.

---

# 88. Database Security

The database file must not be committed to Git.

`.gitignore` must include:

```text
*.db
*.sqlite
*.sqlite3
```

The repository must never contain:

* production database
* session tokens
* passwords
* private uploaded files
* secret credentials

---

# 89. Environment Configuration

The database connection must be configurable.

Example:

```env
DATABASE_URL=sqlite:///./data/messenger.db
```

Do not hardcode absolute filesystem paths.

---

# 90. Backup Considerations

For local development, the SQLite file itself is the database.

For deployment:

* use persistent storage
* avoid ephemeral filesystem-only storage
* periodically back up the database if practical

Backup infrastructure is outside the assignment scope.

---

# 91. Schema Acceptance Criteria

The database implementation is considered correct when:

```text
✓ All required entities exist
✓ Foreign keys are enabled
✓ Users are uniquely identifiable
✓ Contacts are normalized
✓ Conversations support direct + group
✓ Membership is normalized
✓ Messages persist
✓ Receipts persist
✓ Group roles persist
✓ Message ordering is efficient
✓ Conversation ordering is efficient
✓ Core queries are indexed
✓ Duplicate memberships are prevented
✓ Duplicate contacts are prevented
✓ Duplicate receipts are prevented
✓ Direct conversation duplication is prevented by service logic
✓ Group admin authorization is server-side
✓ Seed data is available
✓ Seed operation is idempotent
✓ Database file is excluded from Git
✓ No core relationship is stored as a JSON blob
```

---

# 92. Authoritative Table List

The implementation must use these tables for the corresponding responsibilities:

```text
users
sessions
contacts
conversations
conversation_members
messages
message_receipts
message_reactions       # optional bonus
attachments              # optional bonus
```

No additional table is required for the core assignment unless a genuine implementation requirement is identified.

If a new persistent entity becomes necessary, the architecture and this document must be updated before implementation.

---

# 93. Final Database Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                        USERS                             │
│  identity • profile • presence                           │
└───────┬──────────────┬───────────────────────────────────┘
        │              │
        │              └──────────────┐
        ▼                             ▼
┌──────────────┐               ┌──────────────┐
│   CONTACTS   │               │   SESSIONS   │
└──────────────┘               └──────────────┘

                         USERS
                           │
                           │ M:N
                           ▼
               ┌────────────────────────┐
               │ CONVERSATION_MEMBERS   │
               └────────────┬───────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │     CONVERSATIONS      │
               │  direct / group         │
               └────────────┬───────────┘
                            │
                            │ 1:N
                            ▼
               ┌────────────────────────┐
               │       MESSAGES         │
               └───────┬─────┬─────┬────┘
                       │      │     │
              ┌────────┘      │     └──────────┐
              ▼               ▼                ▼
       ┌──────────────┐ ┌─────────────┐ ┌─────────────┐
       │   RECEIPTS   │ │  REACTIONS  │ │ ATTACHMENTS │
       └──────────────┘ └─────────────┘ └─────────────┘
```

---

# 94. Final Design Principle

The database should model the application as:

```text
Users
  ↓
Relationships
  ↓
Conversations
  ↓
Messages
  ↓
Message State
```

rather than embedding application state inside arbitrary JSON fields or frontend-managed structures.

The database is the authoritative persistent source for:

* identity
* contacts
* conversations
* membership
* messages
* delivery/read state
* groups
* sessions

Ephemeral real-time state such as:

* typing indicators
* active WebSocket connections

does not need persistent database storage.

**End of DATABASE_DESIGN.md**

```
```
