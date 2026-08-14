"""
Application configuration.

All settings are read from environment variables (or a .env file).
Pydantic Settings automatically validates types and provides defaults.

Spec reference: MASTER_PROJECT_SPEC §54, ARCHITECTURE §44
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central application configuration.

    Environment variables are loaded from backend/.env (development)
    or from the process environment (production / CI).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────────────
    app_name: str = "Signal-Inspired Messenger"
    environment: str = "development"
    log_level: str = "INFO"

    # ── Server ─────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000

    # ── Database (Phase 2) ─────────────────────────────────────────────────
    # The database module is not imported here yet; this value is stored for
    # later use in app/database/database.py.
    database_url: str = "sqlite:///./data/messenger.db"

    # ── Authentication (Phase 5) ───────────────────────────────────────────
    jwt_secret: str = "change-me-to-a-strong-random-secret-in-production"
    jwt_expire_seconds: int = 604800  # 7 days
    mock_otp: str = "123456"

    # ── CORS ───────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins.
    # Example: "http://localhost:3000,https://myapp.vercel.app"
    cors_origins: str = "http://localhost:3000"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v: str) -> str:
        """Accept comma-separated origins; strip whitespace."""
        if isinstance(v, str):
            return v.strip()
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        """Return CORS origins as a Python list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """
    Return the singleton Settings instance.

    Uses @lru_cache so the .env file is only read once per process.
    In tests, call get_settings.cache_clear() to reload settings.
    """
    return Settings()
