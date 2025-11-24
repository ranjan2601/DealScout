"""
Pydantic models and database schemas for DealScout.
Cleaned for Pydantic v2, OpenAPI generation, and safe type hints.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field


# --------------------------
# ENUM TYPES
# --------------------------

class OfferParty(str, Enum):
    BUYER = "buyer"
    SELLER = "seller"


class NegotiationActionEnum(str, Enum):
    OFFER = "offer"
    COUNTER_OFFER = "counter_offer"
    ACCEPT = "accept"
    REJECT = "reject"
    WALK_AWAY = "walk_away"


# --------------------------
# PRODUCT MODELS
# --------------------------

class ProductBase(BaseModel):
    item_id: str
    product_detail: str
    asking_price: float
    condition: str = "good"
    category: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    seller_id: str


class Product(ProductBase):
    min_selling_price: Optional[float] = None
    max_acceptable_price: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --------------------------
# NEGOTIATION MESSAGE
# --------------------------

class NegotiationMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[datetime] = None


# --------------------------
# NEGOTIATION TURN
# --------------------------

class NegotiationTurn(BaseModel):
    turn_number: int
    party: OfferParty
    action: NegotiationActionEnum
    offer_price: Optional[float] = None
    message: str
    confidence: Optional[float] = None
    timestamp: Optional[datetime] = None


# --------------------------
# NEGOTIATION STATE
# --------------------------

class NegotiationState(BaseModel):
    listing_id: str
    seller_id: str
    buyer_id: Optional[str] = None
    product: Product
    original_price: float
    buyer_budget: float
    seller_minimum: float

    # MUST use Field() for lists (never use = [])
    history: list[NegotiationTurn] = Field(default_factory=list)

    final_price: Optional[float] = None
    status: str = "ongoing"  # ongoing, success, no_deal, error


# --------------------------
# NEGOTIATION RESULT
# --------------------------

class NegotiationResult(BaseModel):
    listing_id: str
    seller_id: str
    original_price: float
    negotiated_price: float
    messages: list[NegotiationMessage]
    status: str
    savings: Optional[float] = None
    turn_count: int = 0
    completed_at: Optional[datetime] = None


# --------------------------
# OFFER MODELS
# --------------------------

class OfferCreate(BaseModel):
    negotiation_id: str
    party: OfferParty
    price: float
    message: str
    action: NegotiationActionEnum


class Offer(OfferCreate):
    offer_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --------------------------
# CONTRACT MODELS
# --------------------------

class ContractTerms(BaseModel):
    buyer_name: str
    seller_name: str
    product_description: str
    product_price: float
    payment_due_date: str
    delivery_date: str
    warranty: Optional[str] = None
    inspection_period_days: int = 3


class ContractRequest(BaseModel):
    negotiation_id: str
    buyer_id: str
    seller_id: str
    listing_id: str

    # BIG FIX — avoid dict[str, object], use Any
    product: dict[str, Any]
    payment_details: Optional[dict[str, Any]] = None

    final_price: float


class Contract(BaseModel):
    contract_id: str
    negotiation_id: str
    buyer_id: str
    seller_id: str
    terms: ContractTerms
    pdf_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --------------------------
# API REQUEST MODELS
# --------------------------

class NegotiationRequestBody(BaseModel):
    listing_ids: list[str]
    buyer_budget: Optional[float] = None


class ParallelNegotiationRequestBody(BaseModel):
    search_query: str
    max_budget: Optional[float] = None
    top_n: Optional[int] = 5


class FiltersCriteria(BaseModel):
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    max_distance: Optional[float] = None
    selected_conditions: Optional[list[str]] = None
    selected_brands: Optional[list[str]] = None


class AgentParseRequest(BaseModel):
    query: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime
