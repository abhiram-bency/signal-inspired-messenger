# REST API Specification

This document details the actual FastAPI endpoints implemented in the application. All protected endpoints expect a valid `session_token` cookie.

---

## Authentication (`/auth`)

### Register
- **Method**: `POST`
- **Path**: `/auth/register`
- **Auth Required**: No
- **Request Body**: `{ "username": "str", "phone": "str", "display_name": "str" }`
- **Response**: `201 Created` with `otp_required: true`.

### Verify OTP
- **Method**: `POST`
- **Path**: `/auth/verify-otp`
- **Auth Required**: No
- **Request Body**: `{ "identifier": "str", "otp": "str" }`
- **Response**: Sets `session_token` HTTP-only cookie. Returns `{ "authenticated": true, "user": { ... } }`.

### Login
- **Method**: `POST`
- **Path**: `/auth/login`
- **Auth Required**: No
- **Request Body**: `{ "identifier": "str" }`
- **Response**: Similar to Register, dictates if OTP is required.

### Logout
- **Method**: `POST`
- **Path**: `/auth/logout`
- **Auth Required**: Yes
- **Response**: `204 No Content`. Clears the `session_token` cookie and revokes the session in the database.

### Me (Auth Check)
- **Method**: `GET`
- **Path**: `/auth/me`
- **Auth Required**: Yes
- **Response**: Returns the currently authenticated user's profile.

---

## Users & Profile (`/users`)

### Get Current User Profile
- **Method**: `GET`
- **Path**: `/users/me`
- **Auth Required**: Yes
- **Response**: The current user profile data.

### Update Profile
- **Method**: `PUT`
- **Path**: `/users/me`
- **Auth Required**: Yes
- **Request Body**: `{ "display_name": "str", "username": "str", "avatar_url": "str" }`
- **Response**: Returns the updated user profile.

### Search Users
- **Method**: `GET`
- **Path**: `/users/search`
- **Auth Required**: Yes
- **Query Params**: `?q=search_term`
- **Response**: List of users matching the search query by username or display name.

---

## Contacts (`/contacts`)

### Get Contacts
- **Method**: `GET`
- **Path**: `/contacts`
- **Auth Required**: Yes
- **Response**: List of the current user's saved contacts.

### Add Contact
- **Method**: `POST`
- **Path**: `/contacts`
- **Auth Required**: Yes
- **Request Body**: `{ "contact_id": "uuid", "nickname": "str" }`
- **Response**: `201 Created`. The newly added contact.

### Remove Contact
- **Method**: `DELETE`
- **Path**: `/contacts/{user_id}`
- **Auth Required**: Yes
- **Response**: `204 No Content`.

---

## Conversations (`/conversations`)

### List Conversations
- **Method**: `GET`
- **Path**: `/conversations`
- **Auth Required**: Yes
- **Response**: List of conversations (direct and group) the user is a member of, sorted by recent activity.

### Get Conversation Details
- **Method**: `GET`
- **Path**: `/conversations/{conversation_id}`
- **Auth Required**: Yes
- **Response**: Conversation metadata and members.

### Create Direct Conversation
- **Method**: `POST`
- **Path**: `/conversations/direct`
- **Auth Required**: Yes
- **Request Body**: `{ "user_id": "uuid" }`
- **Response**: Creates or returns an existing 1-on-1 conversation.

### Create Group Conversation
- **Method**: `POST`
- **Path**: `/conversations/group`
- **Auth Required**: Yes
- **Request Body**: `{ "name": "str", "member_ids": ["uuid"] }`
- **Response**: `201 Created`. The new group conversation.

### Delete Conversation
- **Method**: `DELETE`
- **Path**: `/conversations/{conversation_id}`
- **Auth Required**: Yes
- **Response**: `204 No Content`. (User leaves group or deletes direct history).

---

## Group Management (`/conversations/{id}/members`)

### Add Members
- **Method**: `POST`
- **Path**: `/conversations/{conversation_id}/members`
- **Auth Required**: Yes (Admin only)
- **Request Body**: `{ "user_ids": ["uuid"] }`
- **Response**: Updated conversation details.

### Remove Member
- **Method**: `DELETE`
- **Path**: `/conversations/{conversation_id}/members/{user_id}`
- **Auth Required**: Yes (Admin only)
- **Response**: Updated conversation details.

---

## Messages (`/conversations/{id}/messages`)

### List Messages
- **Method**: `GET`
- **Path**: `/conversations/{conversation_id}/messages`
- **Auth Required**: Yes
- **Query Params**: `?limit=50&before=datetime`
- **Response**: Paginated list of messages in the conversation.

### Send Message (REST fallback)
- **Method**: `POST`
- **Path**: `/conversations/{conversation_id}/messages`
- **Auth Required**: Yes
- **Request Body**: `{ "content": "str", "message_type": "text", "reply_to_id": "uuid" }`
- **Response**: `201 Created`. The created message. (Note: Most messages are sent via WebSocket).
