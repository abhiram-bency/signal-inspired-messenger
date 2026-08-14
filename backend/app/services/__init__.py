"""
Services package.

Services own all business rules and orchestrate repositories.
They are the authoritative location for authorization logic.

Architectural rule (ARCHITECTURE §19):
  Services must not know about React or frontend components.
  API routes must not contain complex business logic.

Will contain:
  auth_service.py          — register, verify_otp, login, logout, get_me
  contact_service.py       — add_contact, list_contacts, delete_contact
  conversation_service.py  — create_direct, create_group, list_conversations
  message_service.py       — send_message, get_messages, mark_delivered, mark_read
  group_service.py         — add_member, remove_member, change_role
  presence_service.py      — update_online_state, get_presence

Not implemented in Phase 0.
"""
