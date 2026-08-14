"""
Signal-Inspired Messenger — FastAPI Application Entry Point.

Architecture reference: ARCHITECTURE.md §17 (Backend Structure)
Spec reference: MASTER_PROJECT_SPEC §7.2, §55, §56

Phase 0: Provides the FastAPI application with:
  - CORS configuration
  - /health endpoint
  - Structured logging
  - Basic error handlers
  - Router mounts (routers are registered here as they are implemented)

Later phases will add:
  - Database lifespan initialization (Phase 2)
  - Authenticated route protection (Phase 5)
  - WebSocket endpoint (Phase 10)
"""

import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.database.database import init_db
from app.database.seed import seed_database

# ---------------------------------------------------------------------------
# Logging — configure before anything else runs
# ---------------------------------------------------------------------------
settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown hooks
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """
    Application lifespan manager.

    Startup tasks are added here as phases are implemented:
      Phase 2 — database engine creation and table initialization
      Phase 3 — seed data execution (development only)
      Phase 10 — WebSocket connection manager initialization
    """
    logger.info("Starting Signal-Inspired Messenger backend")
    logger.info("Environment: %s", settings.environment)
    logger.info("Log level:   %s", settings.log_level)
    logger.info("CORS origins: %s", settings.cors_origins_list)

    # Initialize database and seed demo data
    await init_db()
    if settings.environment != "production" or True: # Force seed for MVP submission
        await seed_database()

    yield  # Application runs here

    logger.info("Shutting down Signal-Inspired Messenger backend")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Signal-Inspired Messenger API",
    description=(
        "REST + WebSocket API for the Signal-Inspired Messenger. "
        "See /docs for the interactive API documentation."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS
# Spec reference: ARCHITECTURE §43, MASTER_PROJECT_SPEC §54
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://signal-inspired-messenger.vercel.app/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all handler for unhandled exceptions.

    Prevents raw stack traces from leaking to clients.
    Spec reference: MASTER_PROJECT_SPEC §43, ARCHITECTURE §38
    """
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "details": None,
            }
        },
    )


# ---------------------------------------------------------------------------
# Built-in / infrastructure endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/health",
    summary="Health check",
    description="Returns 200 OK when the backend is running. No authentication required.",
    tags=["Infrastructure"],
)
async def health_check() -> dict[str, Any]:
    """
    Health check endpoint.

    Spec reference: ARCHITECTURE §46
    Used by deployment platforms (Render, etc.) for liveness probes.
    """
    return {"status": "ok"}


@app.get(
    "/ready",
    summary="Readiness check",
    description=(
        "Returns readiness status. "
        "Will include database connectivity once Phase 2 is implemented."
    ),
    tags=["Infrastructure"],
)
async def readiness_check() -> dict[str, Any]:
    """
    Readiness check endpoint.

    Spec reference: API_SPEC §71
    Phase 2 will add a real database connectivity check here.
    """
    return {"status": "ready", "database": "not_initialized"}


# ---------------------------------------------------------------------------
# API v1 router mounts
# Routers are uncommented here as each phase is implemented.
# ---------------------------------------------------------------------------
from app.api import auth, conversations, messages, websocket

API_V1_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_V1_PREFIX, tags=["Authentication"])
# app.include_router(users.router, prefix=API_V1_PREFIX, tags=["Users"])
# app.include_router(contacts.router, prefix=API_V1_PREFIX, tags=["Contacts"])
app.include_router(conversations.router, prefix=API_V1_PREFIX, tags=["Conversations"])
app.include_router(messages.router, prefix=API_V1_PREFIX, tags=["Messages"])
# app.include_router(groups.router, prefix=API_V1_PREFIX, tags=["Groups"])

app.include_router(websocket.router)
