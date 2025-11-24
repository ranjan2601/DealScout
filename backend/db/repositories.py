"""
Repository layer for database operations.
Provides CRUD functions for products, negotiations, and offers.
"""

from __future__ import annotations

from typing import Optional, Any
from pymongo.database import Database
from bson import ObjectId
import logging

from backend.db.models import Product, NegotiationState, Offer

logger = logging.getLogger(__name__)


class ProductRepository:
    """Repository for product/listing operations."""

    def __init__(self, db: Database):
        self.db = db
        self.collection = db["sellers"]

    def find_by_item_id(self, item_id: str) -> Optional[dict[str, Any]]:
        """Find product by item_id."""
        return self.collection.find_one({"item_id": item_id})

    def find_by_id(self, product_id: str) -> Optional[dict[str, Any]]:
        """Find product by MongoDB _id."""
        try:
            return self.collection.find_one({"_id": ObjectId(product_id)})
        except Exception as e:
            logger.error("Error finding product by ID: %s", e)
            return None

    def search(self, query: dict[str, Any], limit: int = 10) -> list[dict[str, Any]]:
        """Search products using MongoDB query."""
        try:
            results = list(self.collection.find(query).limit(limit))
            return results
        except Exception as e:
            logger.error("Error searching products: %s", e)
            return []

    def find_all(self, limit: int = 100) -> list[dict[str, Any]]:
        """Find all products."""
        try:
            return list(self.collection.find().limit(limit))
        except Exception as e:
            logger.error("Error finding all products: %s", e)
            return []

    def create(self, product_data: dict[str, Any]) -> Optional[str]:
        """Create a new product listing."""
        try:
            result = self.collection.insert_one(product_data)
            logger.info("Created product: %s", result.inserted_id)
            return str(result.inserted_id)
        except Exception as e:
            logger.error("Error creating product: %s", e)
            return None

    def update(self, item_id: str, update_data: dict[str, Any]) -> bool:
        """Update a product."""
        try:
            result = self.collection.update_one(
                {"item_id": item_id},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error("Error updating product: %s", e)
            return False

    def delete(self, item_id: str) -> bool:
        """Delete a product."""
        try:
            result = self.collection.delete_one({"item_id": item_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error("Error deleting product: %s", e)
            return False


class NegotiationRepository:
    """Repository for negotiation operations."""

    def __init__(self, db: Database):
        self.db = db
        self.collection = db["negotiations"]

    def create(self, negotiation_data: dict[str, Any]) -> Optional[str]:
        """Create a new negotiation record."""
        try:
            result = self.collection.insert_one(negotiation_data)
            logger.info("Created negotiation: %s", result.inserted_id)
            return str(result.inserted_id)
        except Exception as e:
            logger.error("Error creating negotiation: %s", e)
            return None

    def find_by_id(self, negotiation_id: str) -> Optional[dict[str, Any]]:
        """Find negotiation by ID."""
        try:
            return self.collection.find_one({"_id": ObjectId(negotiation_id)})
        except Exception as e:
            logger.error("Error finding negotiation: %s", e)
            return None

    def update(self, negotiation_id: str, update_data: dict[str, Any]) -> bool:
        """Update a negotiation."""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(negotiation_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error("Error updating negotiation: %s", e)
            return False

    def find_by_listing_id(self, listing_id: str) -> list[dict[str, Any]]:
        """Find all negotiations for a listing."""
        try:
            return list(self.collection.find({"listing_id": listing_id}))
        except Exception as e:
            logger.error("Error finding negotiations by listing: %s", e)
            return []

    def find_by_seller_id(self, seller_id: str) -> list[dict[str, Any]]:
        """Find all negotiations for a seller."""
        try:
            return list(self.collection.find({"seller_id": seller_id}))
        except Exception as e:
            logger.error("Error finding negotiations by seller: %s", e)
            return []


class OfferRepository:
    """Repository for offer operations."""

    def __init__(self, db: Database):
        self.db = db
        self.collection = db["offers"]

    def create(self, offer_data: dict[str, Any]) -> Optional[str]:
        """Create a new offer."""
        try:
            result = self.collection.insert_one(offer_data)
            return str(result.inserted_id)
        except Exception as e:
            logger.error("Error creating offer: %s", e)
            return None

    def find_by_negotiation_id(self, negotiation_id: str) -> list[dict[str, Any]]:
        """Find all offers in a negotiation."""
        try:
            return list(self.collection.find({"negotiation_id": negotiation_id}).sort("created_at", 1))
        except Exception as e:
            logger.error("Error finding offers: %s", e)
            return []
