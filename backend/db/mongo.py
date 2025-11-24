"""
MongoDB connection and client management.
Uses PyMongo for synchronous operations.
"""

from __future__ import annotations

from pymongo import MongoClient, errors
from pymongo.database import Database
from typing import Optional
import logging

from backend.config.settings import settings

logger = logging.getLogger(__name__)


class MongoDBConnection:
    """MongoDB connection singleton."""

    _instance: Optional[MongoDBConnection] = None
    _client: Optional[MongoClient] = None
    _db: Optional[Database] = None

    def __new__(cls) -> MongoDBConnection:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def connect(self) -> Database:
        """
        Establish MongoDB connection.
        Returns the database instance.
        """
        if self._client is None:
            try:
                self._client = MongoClient(
                    settings.mongo_uri,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=10000,
                )
                # Verify connection
                self._client.admin.command("ping")
                logger.info("✅ Connected to MongoDB: %s", settings.mongo_db_name)
            except errors.ServerSelectionTimeoutError:
                logger.error("❌ MongoDB connection failed: Server unreachable")
                raise
            except Exception as e:
                logger.error("❌ MongoDB connection error: %s", e)
                raise

        if self._db is None:
            self._db = self._client[settings.mongo_db_name]

        return self._db

    def disconnect(self) -> None:
        """Close MongoDB connection."""
        if self._client is not None:
            self._client.close()
            logger.info("🔌 Disconnected from MongoDB")
            self._client = None
            self._db = None

    def get_db(self) -> Database:
        """Get database instance."""
        if self._db is None:
            self.connect()
        return self._db


# Global connection instance
mongo_connection = MongoDBConnection()


def get_db() -> Database:
    """Dependency injection function for database."""
    return mongo_connection.get_db()
