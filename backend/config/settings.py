"""
Pydantic Settings for environment configuration.
Loads environment variables with validation and defaults.
"""

from __future__ import annotations

from pydantic import BaseModel
import os


class Settings(BaseModel):
    """Application settings loaded from environment variables."""

    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    reload: bool = True

    # MongoDB configuration
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "dealscout"

    # API configuration
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-3-5-sonnet-20241022"

    # CORS configuration
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://dealscout-web.netlify.app",
        "https://dealscout-web.vercel.app",
        "https://*.netlify.app",
        "https://*.vercel.app",
    ]

    # Negotiation parameters
    max_negotiation_turns: int = 8
    price_convergence_threshold: float = 20.0
    buyer_budget_multiplier: float = 0.95
    seller_minimum_multiplier: float = 0.88

    # LLM configuration
    llm_temperature: float = 0.7
    llm_timeout_seconds: int = 30

    # Logging
    log_level: str = "INFO"

    @classmethod
    def from_env(cls) -> Settings:
        """Load settings from environment variables."""
        return cls(
            host=os.getenv("HOST", "0.0.0.0"),
            port=int(os.getenv("PORT", "8000")),
            debug=os.getenv("DEBUG", "False").lower() == "true",
            reload=os.getenv("RELOAD", "True").lower() == "true",
            mongo_uri=os.getenv("MONGO_URI", "mongodb://localhost:27017"),
            mongo_db_name=os.getenv("MONGO_DB_NAME", "dealscout"),
            openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
            openrouter_model=os.getenv("OPENROUTER_MODEL", "anthropic/claude-3-5-sonnet-20241022"),
            max_negotiation_turns=int(os.getenv("MAX_NEGOTIATION_TURNS", "8")),
            price_convergence_threshold=float(os.getenv("PRICE_CONVERGENCE_THRESHOLD", "20.0")),
            buyer_budget_multiplier=float(os.getenv("BUYER_BUDGET_MULTIPLIER", "0.95")),
            seller_minimum_multiplier=float(os.getenv("SELLER_MINIMUM_MULTIPLIER", "0.88")),
            llm_temperature=float(os.getenv("LLM_TEMPERATURE", "0.7")),
            llm_timeout_seconds=int(os.getenv("LLM_TIMEOUT_SECONDS", "30")),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )


# Load from .env file first if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Global settings instance
settings = Settings.from_env()
