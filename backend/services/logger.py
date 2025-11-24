"""
Unified logging utilities for the application.
"""

import logging
import sys
from logging.handlers import RotatingFileHandler

from backend.config.settings import settings


def setup_logging() -> logging.Logger:
    """
    Configure application logging with console and file handlers.
    Returns the root logger.
    """
    logger = logging.getLogger()
    logger.setLevel(logging.getLevelName(settings.log_level))

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.getLevelName(settings.log_level))

    # File handler
    file_handler = RotatingFileHandler(
        "backend.log",
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)

    # Formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger


def get_logger(name: str) -> logging.Logger:
    """Get logger for a specific module."""
    return logging.getLogger(name)
