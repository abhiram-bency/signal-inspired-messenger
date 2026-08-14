"""
Logging configuration.

Provides a centralised logger factory that respects the LOG_LEVEL
setting from the application configuration.

Usage:
    from app.core.logging import get_logger
    logger = get_logger(__name__)
    logger.info("Server started")
"""

import logging
import sys


def configure_logging(level: str = "INFO") -> None:
    """
    Configure the root logging handler for the application.

    Called once at application startup (in main.py lifespan).
    """
    numeric_level = getattr(logging, level.upper(), logging.INFO)

    logging.basicConfig(
        level=numeric_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
        stream=sys.stdout,
    )

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("watchfiles").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger for the given module."""
    return logging.getLogger(name)
