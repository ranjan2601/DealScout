"""
Negotiation endpoints — single and parallel negotiations, with optional streaming.
Cleaned for FastAPI + Pydantic v2 schema compatibility and stable OpenAPI generation.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pymongo.database import Database

from backend.db.mongo import get_db
from backend.db.models import (
    NegotiationRequestBody,
    NegotiationResult,
    ParallelNegotiationRequestBody,
    AgentParseRequest,
    FiltersCriteria,
)
from backend.core.negotiation_loop import NegotiationLoop
from backend.db.repositories import ProductRepository
from backend.services.sse import format_sse_event

router = APIRouter(prefix="/negotiation", tags=["negotiation"])

negotiation_loop = NegotiationLoop()


# -------------------------------------------------------------------
# START NEGOTIATION — NON STREAMING
# -------------------------------------------------------------------
@router.post("/start", response_model=list[NegotiationResult])
async def start_negotiation(
    request: NegotiationRequestBody,
    db: Database = Depends(get_db),
) -> list[NegotiationResult]:
    """
    Start synchronous negotiations for one or more listing IDs.
    """
    if not request.listing_ids:
        raise HTTPException(status_code=400, detail="listing_ids required")

    products_repo = ProductRepository(db)
    results: list[NegotiationResult] = []

    for listing_id in request.listing_ids:
        product = products_repo.find_by_item_id(listing_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Listing {listing_id} not found")

        listing: dict[str, Any] = {
            "id": product.get("item_id"),
            "title": product.get("product_detail"),
            "price": product.get("asking_price"),
            "condition": product.get("condition", "good"),
            "extras": product.get("extras", []),
            "seller_id": product.get("seller_id"),
        }

        result = negotiation_loop.run_negotiation(
            listing,
            buyer_budget_override=request.buyer_budget,
        )
        results.append(result)

    return results


# -------------------------------------------------------------------
# STREAM NEGOTIATION (SSE)
# -------------------------------------------------------------------
@router.post("/stream")
async def stream_negotiation(
    request: NegotiationRequestBody,
    db: Database = Depends(get_db),
):
    """
    Stream negotiation results turn-by-turn via Server-Sent Events (SSE).
    """
    if not request.listing_ids:
        raise HTTPException(status_code=400, detail="listing_ids required")

    listing_id = request.listing_ids[0]
    products_repo = ProductRepository(db)

    product = products_repo.find_by_item_id(listing_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Listing {listing_id} not found")

    listing: dict[str, Any] = {
        "id": product.get("item_id"),
        "title": product.get("product_detail"),
        "price": product.get("asking_price"),
        "condition": product.get("condition", "good"),
        "extras": product.get("extras", []),
        "seller_id": product.get("seller_id"),
    }

    async def event_generator():
        # Using synchronous negotiation and streaming each message afterward
        result = negotiation_loop.run_negotiation(
            listing,
            buyer_budget_override=request.buyer_budget,
        )

        for msg in result.messages:
            payload = {
                "type": msg.role,
                "message": msg.content,
            }
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(0.05)

        yield f"data: {json.dumps({'type': 'complete'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# -------------------------------------------------------------------
# PARALLEL NEGOTIATIONS (MULTIPLE SELLERS)
# -------------------------------------------------------------------
@router.post("/parallel")
async def parallel_negotiations(
    request: ParallelNegotiationRequestBody,
    db: Database = Depends(get_db),
):
    """
    Does multiple negotiations in sequence and streams progress via SSE.
    """
    products_repo = ProductRepository(db)

    async def event_stream():
        yield format_sse_event(
            "status",
            {"message": "🔍 Searching for relevant products..."}
        )
        await asyncio.sleep(0.3)

        query = {
            "$or": [
                {"product_detail": {"$regex": request.search_query, "$options": "i"}},
                {"description": {"$regex": request.search_query, "$options": "i"}},
            ]
        }

        if request.max_budget:
            query["asking_price"] = {"$lte": request.max_budget}

        products = products_repo.search(query, limit=request.top_n or 5)

        if not products:
            yield format_sse_event("error", {"message": "No products found"})
            return

        yield format_sse_event(
            "products_found",
            {"count": len(products)}
        )

        results: list[NegotiationResult] = []

        for idx, product in enumerate(products):
            listing = {
                "id": product.get("item_id"),
                "title": product.get("product_detail"),
                "price": product.get("asking_price"),
                "condition": product.get("condition", "good"),
                "extras": product.get("extras", []),
                "seller_id": product.get("seller_id"),
            }

            result = negotiation_loop.run_negotiation(
                listing,
                buyer_budget_override=request.max_budget,
            )
            results.append(result)

            yield format_sse_event(
                "negotiation_complete",
                {
                    "n": idx + 1,
                    "listing_id": result.listing_id,
                    "status": result.status,
                    "savings": result.savings,
                },
            )

            await asyncio.sleep(0.25)

        # Best deal
        best = max(results, key=lambda r: r.savings or 0)

        yield format_sse_event(
            "best_deal",
            {
                "listing_id": best.listing_id,
                "final_price": best.negotiated_price,
                "original_price": best.original_price,
                "savings": best.savings,
            },
        )

        yield format_sse_event(
            "complete",
            {"message": "All negotiations complete."}
        )

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# -------------------------------------------------------------------
# QUERY PARSER (NLP → FILTERS)
# -------------------------------------------------------------------
@router.post("/parse", response_model=FiltersCriteria)
async def parse_query(request: AgentParseRequest) -> FiltersCriteria:
    """
    Parse natural language search queries into structured filter criteria.
    """
    import re

    query = request.query.lower()
    filters = FiltersCriteria()

    if match := re.search(r"(?:under|below|less than)\s*\$?(\d+)", query):
        filters.max_price = float(match.group(1))

    if match := re.search(r"\$?(\d+)\s*(?:to|-)\s*\$?(\d+)", query):
        filters.min_price = float(match.group(1))
        filters.max_price = float(match.group(2))

    if match := re.search(r"(?:over|above|more than)\s*\$?(\d+)", query):
        filters.min_price = float(match.group(1))

    if match := re.search(r"(?:within|radius of?)\s*(\d+)\s*miles?", query):
        filters.max_distance = float(match.group(1))

    return filters
