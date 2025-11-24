"""
Product listings API.
Cleaned for FastAPI + Pydantic v2 stability and OpenAPI schema safety.
"""

from __future__ import annotations

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database
from pydantic import BaseModel

from backend.db.mongo import get_db
from backend.db.repositories import ProductRepository
from backend.db.models import Product

router = APIRouter(prefix="/listings", tags=["listings"])


# ---------------------------------------------------------
# RESPONSE MODELS (to avoid dict[str, Any] everywhere)
# ---------------------------------------------------------

class ProductOut(BaseModel):
    """Public-facing product structure returned by API."""
    item_id: str
    product_detail: str
    asking_price: float
    condition: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    seller_id: str


class ProductSearchResult(BaseModel):
    """Response wrapper for product search results."""
    total: int
    items: list[ProductOut]


# ---------------------------------------------------------
# GET ALL LISTINGS
# ---------------------------------------------------------
@router.get("/", response_model=list[ProductOut])
async def list_products(
    db: Database = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
) -> list[ProductOut]:
    """
    Retrieve all product listings with pagination.
    """
    repo = ProductRepository(db)
    items = repo.find_all(limit=limit, skip=skip)

    # Convert raw Mongo dicts into ProductOut models
    return [ProductOut(**item) for item in items]


# ---------------------------------------------------------
# GET ONE LISTING BY ID
# ---------------------------------------------------------
@router.get("/{listing_id}", response_model=ProductOut)
async def get_product(
    listing_id: str,
    db: Database = Depends(get_db),
) -> ProductOut:
    """
    Retrieve a single listing by its ID.
    """
    repo = ProductRepository(db)
    item = repo.find_by_item_id(listing_id)

    if not item:
        raise HTTPException(status_code=404, detail=f"Listing {listing_id} not found")

    return ProductOut(**item)


# ---------------------------------------------------------
# PRODUCT SEARCH
# ---------------------------------------------------------
@router.get("/search/products", response_model=ProductSearchResult)
async def search_products(
    q: str,
    db: Database = Depends(get_db),
    limit: int = 20,
) -> ProductSearchResult:
    """
    Search for products using a flexible text query.
    Supports searching product_detail, description, and category.
    """

    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query too short")

    repo = ProductRepository(db)

    mongo_query: dict[str, Any] = {
        "$or": [
            {"product_detail": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"category": {"$regex": q, "$options": "i"}},
        ]
    }

    results = repo.search(mongo_query, limit=limit)

    return ProductSearchResult(
        total=len(results),
        items=[ProductOut(**p) for p in results],
    )
