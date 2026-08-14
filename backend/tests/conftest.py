"""
Test fixtures shared across the test suite.

Phase 0: Provides the httpx AsyncClient fixture pointed at the FastAPI app.
Later phases will add:
  - Database session fixture with a test-only in-memory SQLite database
  - Authenticated user fixtures
  - WebSocket test client fixtures
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client() -> AsyncClient:
    """
    Async HTTP client for testing FastAPI endpoints.

    Uses httpx.AsyncClient with ASGITransport so tests run in-process
    without requiring a live server.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
