# Signal — Secure Messaging Platform

A full-stack, real-time messaging application inspired by Signal, built as an SDE Fullstack Assignment for Scalar AI Labs.

[![Backend Tests](https://github.com/abhiram_bency/signal-inspired-messenger/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/abhiram_bency/signal-inspired-messenger/actions/workflows/backend-ci.yml)

> **Live Application:** _Deployment pending (Phase 15)_  
> **GitHub Repository:** _Set to public before submission_

---

## Features

| Feature | Status |
|---------|--------|
| Registration & mock OTP | Phase 5 |
| Login / session persistence | Phase 5 |
| Contacts & user search | Phase 7 |
| One-to-one messaging | Phase 11 |
| Group conversations | Phase 13 |
| Real-time delivery via WebSocket | Phase 10 |
| Delivery & read receipts | Phase 12 |
| Typing indicators | Phase 12 |
| Online / last-seen presence | Phase 12 |
| Signal-style UI | Phase 14 |
| Seed / demo data | Phase 3 |

---

## Tech Stack

### Frontend
- **Next.js 15** — App Router, TypeScript, React 19
- **Tailwind CSS** — Styling
- **Zustand** — Client-side state management
- **Zod** — Schema validation
- **React Hook Form** — Form handling
- **Lucide React** — Icons

### Backend
- **FastAPI** — REST API + WebSocket
- **SQLAlchemy 2.x** — ORM with async support
- **SQLite** (development) — Single-file database
- **PyJWT** — JSON Web Tokens
- **passlib/bcrypt** — Password hashing

---

## Local Development

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.14 (or 3.11+) |
| Node.js | 20 (via NVM) |
| npm | 10+ |

### Backend

```bash
# 1. Create a virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp ../.env.example backend/.env
# Edit backend/.env as needed

# 4. Run the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend available at: **http://localhost:8000**  
API documentation: **http://localhost:8000/docs**

### Frontend

```bash
# Node.js setup (if using NVM)
source scripts/install_node.sh

cd frontend

# Install dependencies
npm install

# Configure environment
cp ../.env.example frontend/.env.local
# Edit frontend/.env.local as needed

# Run the development server
npm run dev
```

Frontend available at: **http://localhost:3000**

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./data/messenger.db` | Database connection string |
| `JWT_SECRET` | — | **Required.** Secret key for JWT signing |
| `JWT_EXPIRE_SECONDS` | `604800` | Token expiry (7 days) |
| `MOCK_OTP` | `123456` | Fixed OTP for mock authentication |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `ENVIRONMENT` | `development` | `development` or `production` |
| `LOG_LEVEL` | `INFO` | Python logging level |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend REST API base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000` | Backend WebSocket base URL |
| `NEXT_PUBLIC_APP_NAME` | `Signal` | Application display name |

---

## Mock Authentication

This application uses **mock phone verification** — no real SMS is sent.

The mock OTP is: **`123456`**

This is documented in the code and API spec. Any registered user can authenticate with this code.

**Demo accounts (seeded — Phase 3):**

| Username | OTP |
|----------|-----|
| alice | 123456 |
| bob | 123456 |
| charlie | 123456 |

> Demo accounts become available after Phase 3 (Seed Data) is implemented.

---

## Running Tests

### Backend

```bash
cd backend
source venv/bin/activate
python -m pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm run lint
npm run type-check
npm run build
```

---

## Project Structure

```
signal-inspired-messenger/
│
├── frontend/                  # Next.js 15 App Router application
│   ├── src/
│   │   ├── app/               # Pages and layouts (App Router)
│   │   ├── components/        # Reusable UI components (Phase 8+)
│   │   ├── hooks/             # Custom React hooks (Phase 5+)
│   │   ├── lib/               # API client, WebSocket, utilities
│   │   ├── stores/            # Zustand state stores
│   │   └── types/             # TypeScript type definitions
│   └── ...
│
├── backend/                   # FastAPI application
│   ├── app/
│   │   ├── api/               # Route handlers (Phase 5+)
│   │   ├── core/              # Config, security, dependencies
│   │   ├── database/          # SQLAlchemy engine + models (Phase 2+)
│   │   ├── repositories/      # Database access layer (Phase 4+)
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic (Phase 5+)
│   │   ├── websocket/         # WebSocket manager (Phase 10+)
│   │   └── main.py            # FastAPI application entry point
│   └── tests/                 # pytest test suite
│
├── docs/                      # Specification documents
│   ├── MASTER_PROJECT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_SPEC.md
│   ├── WEBSOCKET_PROTOCOL.md
│   └── IMPLEMENTATION_PLAN.md
│
└── scripts/                   # Development helper scripts
```

---

## Architecture

```
Browser (Next.js)
      │
      ├── REST (HTTPS)    ──▶  FastAPI  ──▶  SQLite
      └── WebSocket (WSS) ──▶  FastAPI  ──▶  Connection Manager
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full architectural specification.

---

## Implementation Progress

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Repository Bootstrap | ✅ Complete |
| 1 | Backend Configuration | ✅ Complete |
| 2 | Database Foundation | ⏳ Next |
| 3 | Seed Data | ⏳ Pending |
| 4 | Domain Models & Repositories | ⏳ Pending |
| 5 | Authentication | ⏳ Pending |
| 6 | Profile | ⏳ Pending |
| 7 | Contacts | ⏳ Pending |
| 8 | Conversation System | ⏳ Pending |
| 9 | REST API | ⏳ Pending |
| 10 | WebSocket Infrastructure | ⏳ Pending |
| 11 | Real-Time Messaging | ⏳ Pending |
| 12 | Receipts & Typing | ⏳ Pending |
| 13 | Group Conversations | ⏳ Pending |
| 14 | Signal UI Polish | ⏳ Pending |
| 15 | Testing & Deployment | ⏳ Pending |

---

## Specification Documents

The implementation follows these authoritative specifications in priority order:

1. [`MASTER_PROJECT_SPEC.md`](docs/MASTER_PROJECT_SPEC.md) — Product requirements
2. [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System design
3. [`DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md) — Database schema
4. [`API_SPEC.md`](docs/API_SPEC.md) — REST API contracts
5. [`WEBSOCKET_PROTOCOL.md`](docs/WEBSOCKET_PROTOCOL.md) — WebSocket events
6. [`IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — Implementation sequence

---

## License

Private assignment — not for redistribution.
