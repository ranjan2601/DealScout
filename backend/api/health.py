"""
Health check and status endpoints.
"""

from fastapi import APIRouter, Depends
from datetime import datetime
from pymongo.database import Database

from backend.db.mongo import get_db
from backend.db.models import HealthResponse

router = APIRouter()


@router.get("/", response_model=dict)
async def root() -> dict:
    """Root endpoint - API status."""
    return {
        "status": "online",
        "service": "DealScout Negotiation API",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Database = Depends(get_db)) -> HealthResponse:
    """
    Health check endpoint.
    Verifies database connectivity and API status.
    """
    try:
        # Verify database connection
        db.client.admin.command("ping")

        return HealthResponse(
            status="healthy",
            service="DealScout Backend",
            version="2.0.0",
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            service="DealScout Backend",
            version="2.0.0",
            timestamp=datetime.utcnow()
        )


@router.get("/status")
async def status() -> dict:
    """Get API status and version info."""
    return {
        "status": "operational",
        "version": "2.0.0",
        "environment": "production",
        "features": [
            "negotiation",
            "contract_generation",
            "product_search",
            "sse_streaming"
        ]
    }
