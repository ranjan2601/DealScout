"""
FastAPI Backend Server for DealScout Negotiation System
Integrates with Next.js frontend and Python AI negotiation agents
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
from buyer_agent import make_offer
from seller_agent import respond_to_offer
from pymongo import MongoClient
from bson import ObjectId

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "dealscout")
mongo_client = MongoClient(MONGO_URI)
mongo_db = mongo_client[DATABASE_NAME]
sellers_collection = mongo_db["sellers"]

app = FastAPI(title="DealScout API", version="1.0.0")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class NegotiationMessage(BaseModel):
    role: str  # "buyer" | "seller" | "system"
    content: str


class NegotiationRequest(BaseModel):
    listing_ids: List[str]


class NegotiationResult(BaseModel):
    listing_id: str
    original_price: float
    negotiated_price: float
    messages: List[NegotiationMessage]
    status: str  # "success" | "no_deal" | "error"
    savings: Optional[float] = None


class AgentQueryRequest(BaseModel):
    query: str


class Filters(BaseModel):
    minPrice: Optional[float] = None
    maxPrice: Optional[float] = None
    maxDistance: Optional[float] = None
    selectedConditions: Optional[List[str]] = None
    selectedBrands: Optional[List[str]] = None


# Mock listing database (in production, this would be a real database)
# Maps frontend listing IDs to backend listing data
MOCK_LISTINGS = {
    "listing-1": {
        "id": "listing-1",
        "title": "Trek Mountain Bike - Excellent Condition",
        "price": 1200,
        "condition": "like-new",
        "extras": ["helmet", "lock"]
    },
    "listing-2": {
        "id": "listing-2",
        "title": "Giant Road Bike",
        "price": 850,
        "condition": "used",
        "extras": []
    },
    "listing-3": {
        "id": "listing-3",
        "title": "Specialized Electric Bike - Brand New",
        "price": 3500,
        "condition": "new",
        "extras": ["warranty", "free service"]
    },
    "listing-4": {
        "id": "listing-4",
        "title": "Cannondale Hybrid Bike",
        "price": 650,
        "condition": "like-new",
        "extras": []
    },
    "listing-5": {
        "id": "listing-5",
        "title": "Trek Cruiser - Comfortable Ride",
        "price": 450,
        "condition": "used",
        "extras": []
    },
    "listing-6": {
        "id": "listing-6",
        "title": "Giant Mountain Bike - Trail Ready",
        "price": 980,
        "condition": "like-new",
        "extras": []
    },
    "listing-7": {
        "id": "listing-7",
        "title": "Specialized Road Bike - Racing Edition",
        "price": 2100,
        "condition": "like-new",
        "extras": []
    },
    "listing-8": {
        "id": "listing-8",
        "title": "Cannondale Kids Bike",
        "price": 280,
        "condition": "used",
        "extras": []
    },
}


def get_product_from_db(item_id: str) -> Optional[Dict[str, Any]]:
    """Fetch product data from MongoDB using item_id"""
    try:
        # Try to fetch by item_id field
        product = sellers_collection.find_one({"item_id": item_id})
        if product:
            return {
                "id": str(product.get("_id")),
                "item_id": product.get("item_id"),
                "title": product.get("product_detail", "Unknown Product"),
                "price": product.get("asking_price", 0),
                "condition": product.get("condition", "good"),
                "extras": [],
                "min_selling_price": product.get("min_selling_price"),
                "seller_id": product.get("seller_id"),
                "category": product.get("category"),
                "location": product.get("location")
            }
    except Exception as e:
        print(f"Error fetching product from DB: {e}")

    return None


def get_platform_comps(listing_price: float) -> Dict[str, Any]:
    """Generate platform comparables based on listing price"""
    return {
        "platform_comps": [
            {"listing_id": "comp_001", "price": listing_price * 0.85, "condition": "good", "status": "sold"},
            {"listing_id": "comp_002", "price": listing_price * 0.88, "condition": "like-new", "status": "sold"},
            {"listing_id": "comp_003", "price": listing_price * 0.90, "condition": "good", "status": "active"}
        ],
        "platform_stats": {
            "avg_price_sold": listing_price * 0.87,
            "median_price_sold": listing_price * 0.88,
            "avg_time_to_sell_days": 4.2
        }
    }


def run_single_negotiation(listing: Dict[str, Any]) -> NegotiationResult:
    """
    Run negotiation for a single listing between AI buyer and seller agents
    """
    listing_id = listing["id"]
    asking_price = listing["price"]
    
    # Set buyer and seller preferences
    buyer_budget = asking_price * 0.85  # Buyer wants 15% discount
    seller_minimum = asking_price * 0.92  # Seller will accept up to 8% discount
    
    # Platform data
    platform_data = {
        "product": {
            "listing_id": listing_id,
            "title": listing["title"],
            "asking_price": asking_price,
            "condition": listing.get("condition", "good"),
            "extras": listing.get("extras", [])
        },
        **get_platform_comps(asking_price)
    }
    
    buyer_prefs = {
        "max_budget": buyer_budget,
        "target_price": buyer_budget
    }
    
    seller_prefs = {
        "min_acceptable": seller_minimum,
        "asking_price": asking_price,
        "can_bundle_extras": listing.get("extras", [])
    }
    
    # Run negotiation
    messages: List[NegotiationMessage] = []
    history: List[Dict[str, Any]] = []
    final_price = None
    max_turns = 8
    
    # Add system start message
    messages.append(NegotiationMessage(
        role="system",
        content=f"Negotiation started for {listing['title']}. AI agents analyzing market data and conditions..."
    ))
    
    try:
        for turn_num in range(1, max_turns + 1):
            # Buyer's turn (odd turns)
            if turn_num % 2 == 1:
                buyer_state = {
                    "buyer_prefs": buyer_prefs,
                    "platform_data": platform_data,
                    "history": history,
                    "turn_number": turn_num
                }
                
                buyer_response = make_offer(buyer_state)
                
                # Add to messages
                messages.append(NegotiationMessage(
                    role="buyer",
                    content=buyer_response["message"]
                ))
                
                # Add to history
                history.append({
                    "turn": turn_num,
                    "party": "buyer",
                    "action": buyer_response["action"],
                    "offer_price": buyer_response.get("offer_price"),
                    "message": buyer_response["message"],
                    "confidence": buyer_response["confidence"]
                })
                
                # Check for deal
                if buyer_response["action"] == "accept":
                    final_price = buyer_response.get("offer_price")
                    messages.append(NegotiationMessage(
                        role="system",
                        content=f"Deal reached! Final price: ${final_price:.2f}. Buyer accepted the offer."
                    ))
                    break
                
                if buyer_response["action"] == "walk_away":
                    messages.append(NegotiationMessage(
                        role="system",
                        content="Negotiation ended. Buyer decided to walk away."
                    ))
                    break
            
            # Seller's turn (even turns)
            else:
                seller_state = {
                    "seller_prefs": seller_prefs,
                    "platform_data": platform_data,
                    "history": history,
                    "turn_number": turn_num
                }
                
                seller_response = respond_to_offer(seller_state)
                
                # Add to messages
                messages.append(NegotiationMessage(
                    role="seller",
                    content=seller_response["message"]
                ))
                
                # Add to history
                history.append({
                    "turn": turn_num,
                    "party": "seller",
                    "action": seller_response["action"],
                    "offer_price": seller_response.get("offer_price"),
                    "message": seller_response["message"],
                    "confidence": seller_response["confidence"]
                })
                
                # Check for deal
                if seller_response["action"] == "accept":
                    final_price = seller_response.get("offer_price")
                    messages.append(NegotiationMessage(
                        role="system",
                        content=f"Deal reached! Final price: ${final_price:.2f}. Seller accepted the offer."
                    ))
                    break
                
                if seller_response["action"] == "reject":
                    messages.append(NegotiationMessage(
                        role="system",
                        content="Negotiation ended. Seller rejected the offer."
                    ))
                    break
        
        # Determine final status
        if final_price is not None:
            status = "success"
            savings = asking_price - final_price
        else:
            status = "no_deal"
            # Use last seller offer or asking price
            final_price = asking_price
            savings = 0
            messages.append(NegotiationMessage(
                role="system",
                content=f"No agreement reached after {max_turns} turns. No price reduction available."
            ))
        
        return NegotiationResult(
            listing_id=listing_id,
            original_price=asking_price,
            negotiated_price=final_price,
            messages=messages,
            status=status,
            savings=savings
        )
    
    except Exception as e:
        messages.append(NegotiationMessage(
            role="system",
            content=f"Error during negotiation: {str(e)}"
        ))
        return NegotiationResult(
            listing_id=listing_id,
            original_price=asking_price,
            negotiated_price=asking_price,
            messages=messages,
            status="error",
            savings=0
        )


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "DealScout Negotiation API",
        "version": "1.0.0"
    }


@app.post("/negotiation", response_model=List[NegotiationResult])
async def negotiate_listings(request: NegotiationRequest):
    """
    Run AI-powered negotiations for selected listings

    This endpoint orchestrates negotiations between buyer and seller AI agents
    using Claude Sonnet via OpenRouter API.
    """

    # Check for API key
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY not configured on server"
        )

    results = []

    for listing_id in request.listing_ids:
        # Try to fetch from database first, then fall back to mock listings
        listing = get_product_from_db(listing_id)

        if not listing:
            # Fall back to mock listings
            listing = MOCK_LISTINGS.get(listing_id)

        if not listing:
            # Return error result for unknown listing
            results.append(NegotiationResult(
                listing_id=listing_id,
                original_price=0,
                negotiated_price=0,
                messages=[NegotiationMessage(
                    role="system",
                    content=f"Listing {listing_id} not found"
                )],
                status="error",
                savings=0
            ))
            continue

        # Run negotiation
        result = run_single_negotiation(listing)
        results.append(result)

    return results


@app.post("/agent/parse", response_model=Filters)
async def parse_agent_query(request: AgentQueryRequest):
    """
    Parse natural language query into structured filters
    
    Example: "Find me bikes within 5 miles under $1000"
    Returns: { maxPrice: 1000, maxDistance: 5 }
    """
    
    query = request.query.lower()
    filters = Filters()
    
    # Extract price patterns
    import re
    
    # "under $X" or "below $X"
    under_match = re.search(r'(?:under|below|less than)\s*\$?(\d+)', query)
    if under_match:
        filters.maxPrice = float(under_match.group(1))
    
    # "$X to $Y" or "$X-$Y"
    range_match = re.search(r'\$?(\d+)\s*(?:to|-)\s*\$?(\d+)', query)
    if range_match:
        filters.minPrice = float(range_match.group(1))
        filters.maxPrice = float(range_match.group(2))
    
    # "over $X" or "above $X"
    over_match = re.search(r'(?:over|above|more than)\s*\$?(\d+)', query)
    if over_match:
        filters.minPrice = float(over_match.group(1))
    
    # Extract distance patterns
    distance_match = re.search(r'(?:within|radius of?)\s*(\d+)\s*miles?', query)
    if distance_match:
        filters.maxDistance = float(distance_match.group(1))
    
    # Extract conditions
    conditions = []
    if re.search(r'\bnew\b', query) and not re.search(r'like[- ]new', query):
        conditions.append("new")
    if re.search(r'like[- ]new', query):
        conditions.append("like-new")
    if re.search(r'\bused\b', query):
        conditions.append("used")
    
    if conditions:
        filters.selectedConditions = conditions
    
    # Extract brand names
    brands = ["Trek", "Giant", "Specialized", "Cannondale"]
    found_brands = [b for b in brands if re.search(rf'\b{b}\b', query, re.IGNORECASE)]
    if found_brands:
        filters.selectedBrands = found_brands
    
    return filters


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

