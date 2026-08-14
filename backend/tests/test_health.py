"""
Phase 0 infrastructure smoke tests.

Verifies that the FastAPI application starts correctly and the
/health and /ready endpoints respond as expected.

These tests must pass before any application logic is implemented.
"""

import pytest
from httpx import AsyncClient


class TestHealthEndpoints:
    """Smoke tests for infrastructure endpoints."""

    async def test_health_returns_200(self, client: AsyncClient) -> None:
        """GET /health must return HTTP 200."""
        response = await client.get("/health")
        assert response.status_code == 200

    async def test_health_returns_ok_status(self, client: AsyncClient) -> None:
        """GET /health must return {"status": "ok"}."""
        response = await client.get("/health")
        body = response.json()
        assert body["status"] == "ok"

    async def test_ready_returns_200(self, client: AsyncClient) -> None:
        """GET /ready must return HTTP 200."""
        response = await client.get("/ready")
        assert response.status_code == 200

    async def test_ready_returns_ready_status(self, client: AsyncClient) -> None:
        """GET /ready must include a status field."""
        response = await client.get("/ready")
        body = response.json()
        assert "status" in body

    async def test_docs_endpoint_accessible(self, client: AsyncClient) -> None:
        """FastAPI /docs must be accessible (enabled in dev)."""
        response = await client.get("/docs")
        assert response.status_code == 200

    async def test_openapi_schema_accessible(self, client: AsyncClient) -> None:
        """FastAPI /openapi.json must return a valid schema."""
        response = await client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "openapi" in schema
        assert "info" in schema

    async def test_unknown_route_returns_404(self, client: AsyncClient) -> None:
        """Undefined routes must return HTTP 404."""
        response = await client.get("/api/v1/does-not-exist")
        assert response.status_code == 404
