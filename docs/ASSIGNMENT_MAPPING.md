# Assignment Requirements Mapping

This document maps the requirements of the "Secure Messaging Platform (Signal Clone) — SDE Fullstack Assignment" to the actual implementations in this repository.

| Requirement | Implementation Details | Status |
|-------------|------------------------|--------|
| **1. Authentication & Onboarding** | Implemented custom cookie-based session auth in FastAPI. Mock OTP (`123456`) bypasses real SMS for ease of evaluation. User can set username/display name. | ✅ Implemented |
| **2. Contacts & Conversation List** | Users can search via `/users/search` by username/display name, save to contacts, and view a sorted list of active conversations. | ✅ Implemented |
| **3. One-on-One Messaging** | Full real-time chatting via WebSockets and persistent SQLite backend. | ✅ Implemented |
| **4. Group Messaging** | Users can create groups, select contacts, and send messages to multiple members. Members can be added/removed. | ✅ Implemented |
| **5. Signal Experience (UI)** | Dark-mode focused UI built with Tailwind CSS. Utilizes similar sidebar/chat pane layout, bubble styles, and micro-interactions. | ✅ Implemented |
| **6. Message Receipts** | Backend models and WebSocket events exist to broadcast `receipt.update`. | 🟡 Under Investigation |
| **7. Typing Indicators** | Zustand `typingStore` handles transient state; WebSocket routes events. | 🟡 Under Investigation |
| **8. Unread Badges** | Chat store tracks last message read against conversation state. | 🟡 Under Investigation |
| **9. Mocked Sections** | UI placeholders exist for Privacy, Notifications, Appearance (in Settings modal), Voice/Video calling (UI buttons), explicitly matching assignment allowances. | 🟦 Placeholder |
| **10. Database Design** | Self-contained SQLite implementation (`app/database/models.py`) strictly mapped using SQLAlchemy ORM. | ✅ Implemented |
| **11. Deployment** | Frontend deployed to Vercel. Backend deployed to Render. | ✅ Implemented |

> **Note on "Under Investigation" statuses:**
> The infrastructure (database columns, WebSocket event handlers, UI components) for read/delivery receipts, typing indicators, and unread badges has been successfully implemented. However, manual testing reveals edge cases where the UI does not successfully reflect these states (e.g., remaining at single-tick, typing indicator not appearing on the recipient side). These functional bugs are known constraints left for a future bug-fix phase and are not falsely claimed as fully working.
