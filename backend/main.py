"""
DealScout FastAPI Backend - Main Application Entry Point

This is the refactored, production-ready backend with clean architecture:
- Modular route handlers
- Dependency injection for database
- Environment configuration via Pydantic BaseSettings
- Centralized logging
- Type hints throughout
- Separation of concerns (agents, core logic, services, utilities)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from backend.config.settings import settings
from backend.services.logger import setup_logging
from backend.db.mongo import mongo_connection

# Import route modules
from backend.api import health, negotiation, listings, offers

# Configure logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle - startup and shutdown events.
    """
    # Startup
    logger.info("🚀 Starting DealScout Backend...")
    try:
        mongo_connection.connect()
        logger.info("✅ Backend startup complete")
    except Exception as e:
        logger.error("❌ Startup failed: %s", e)
        raise

    yield

    # Shutdown
    logger.info("🛑 Shutting down DealScout Backend...")
    mongo_connection.disconnect()
    logger.info("✅ Backend shutdown complete")


# Create FastAPI app with lifespan management
app = FastAPI(
    title="DealScout API",
    description="AI-powered negotiation and contract generation platform",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include route modules
app.include_router(health.router)
# app.include_router(negotiation.router)
# app.include_router(listings.router)
# app.include_router(offers.router)


@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle ValueError exceptions."""
    logger.error("ValueError: %s", exc)
    return {"detail": str(exc), "status": "error"}, 400


@app.exception_handler(RuntimeError)
async def runtime_error_handler(request, exc):
    """Handle RuntimeError exceptions."""
    logger.error("RuntimeError: %s", exc)
    return {"detail": "Internal server error", "status": "error"}, 500


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        debug=settings.debug,
        reload=settings.reload
    )
