"""
API routers package.

Each module in this package corresponds to one resource domain:
  auth            — POST /auth/register, /auth/verify-otp, /auth/login, etc. (Phase 5)
  users           — GET/PATCH /users/me, GET /users/search (Phase 6)
  contacts        — GET/POST/DELETE /contacts (Phase 7)
  conversations   — GET/POST /conversations (Phase 8)
  messages        — GET/POST /conversations/{id}/messages, receipts (Phase 9+11)
  groups          — POST/DELETE/PATCH /conversations/{id}/members (Phase 15)

All routers are registered in app/main.py.
"""
