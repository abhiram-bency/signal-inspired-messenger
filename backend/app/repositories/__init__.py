"""
Repositories package — Phase 4.

Repository classes encapsulate all database operations for one entity.
They provide a clean interface between service layer and SQLAlchemy.

Will contain:
  user_repository.py          — CRUD for users
  contact_repository.py       — CRUD for contacts
  conversation_repository.py  — conversation queries
  message_repository.py       — message queries with pagination
  group_repository.py         — group membership operations

Architectural rule (ARCHITECTURE §20):
  Repositories must not make authorization decisions.
  Authorization belongs to services.

Not implemented in Phase 0.
"""
