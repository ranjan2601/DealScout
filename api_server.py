"""
FastAPI Backend Server for DealScout Negotiation System
Integrates with Next.js frontend and Python AI negotiation agents
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, AsyncGenerator
import os
from dotenv import load_dotenv
from buyer_agent import make_offer
from seller_agent import respond_to_offer
from contract_generator import generate_contract, format_contract_for_display, generate_visa_payment_request
from pdf_contract_generator import generate_contract_pdf, get_contract_filename
from pymongo import MongoClient
from bson import ObjectId
import json
import asyncio
import requests

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
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://dealscout-web.netlify.app",
        "https://dealscout-web.vercel.app",
        "https://*.netlify.app",
        "https://*.vercel.app",
    ],
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
    buyer_budget: Optional[float] = None  # Optional buyer's max budget


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


class ContractRequest(BaseModel):
    negotiation_id: str
    buyer_id: str
    seller_id: str
    listing_id: str
    result: Dict[str, Any]
    product: Dict[str, Any]
    payment_details: Optional[Dict[str, Any]] = None


class ParallelNegotiationRequest(BaseModel):
    search_query: str
    max_budget: Optional[float] = None
    top_n: Optional[int] = 5  # Number of sellers to negotiate with in parallel


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
            {"listing_id": "comp_001", "price": int(listing_price * 0.85), "condition": "good", "status": "sold"},
            {"listing_id": "comp_002", "price": int(listing_price * 0.88), "condition": "like-new", "status": "sold"},
            {"listing_id": "comp_003", "price": int(listing_price * 0.90), "condition": "good", "status": "active"},
            {"listing_id": "comp_004", "price": int(listing_price * 0.92), "condition": "like-new", "status": "sold"}
        ],
        "platform_stats": {
            "avg_price_sold": int(listing_price * 0.87),
            "median_price_sold": int(listing_price * 0.88),
            "avg_time_to_sell_days": 4.2,
            "total_comps_found": 4
        }
    }


def check_convergence(history: List[Dict[str, Any]], threshold: float = 20) -> bool:
    """
    Check if buyer and seller offers have converged within threshold.
    Returns True if the gap between last buyer and seller offers is <= threshold.
    """
    if len(history) < 2:
        return False

    last_buyer_offer = None
    last_seller_offer = None

    for turn in reversed(history):
        if turn.get("party") == "buyer" and last_buyer_offer is None:
            last_buyer_offer = turn.get("offer_price")
        elif turn.get("party") == "seller" and last_seller_offer is None:
            last_seller_offer = turn.get("offer_price")

        if last_buyer_offer is not None and last_seller_offer is not None:
            break

    if last_buyer_offer is not None and last_seller_offer is not None:
        gap = abs(last_buyer_offer - last_seller_offer)
        return gap <= threshold

    return False


def call_llm(system_prompt: str, user_prompt: str) -> str:
    """
    Helper function to call Claude via OpenRouter API
    Returns the LLM's text response
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable not set")

    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://github.com",
            "X-Title": "DealScout-HackNYU",
        },
        json={
            "model": "anthropic/claude-3-5-sonnet-20241022",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
        }
    )

    result = response.json()
    if "error" in result:
        raise Exception(f"API Error: {result['error']}")

    return result['choices'][0]['message']['content'].strip()


def generate_smart_db_query(search_query: str) -> Dict[str, Any]:
    """
    Use LLM to intelligently generate a MongoDB query from natural language search.
    Returns a properly formatted MongoDB query filter.
    """
    system_prompt = """You are a MongoDB query expert. Convert natural language search queries into MongoDB filter objects.

IMPORTANT RULES:
1. Return ONLY valid JSON - no explanation, no markdown, no comments
2. Use MongoDB operators: $regex (case-insensitive), $lte, $gte, $in, $or, etc.
3. Search in these fields: product_detail, description, category
4. Always use "$options": "i" for case-insensitive regex matching
5. Extract price constraints if mentioned
6. Return empty filters {} if query is too vague

EXAMPLES:
- "apple iphone under 500" → {"product_detail": {"$regex": "iphone|apple", "$options": "i"}, "asking_price": {"$lte": 500}}
- "gaming laptop" → {"$or": [{"product_detail": {"$regex": "gaming|laptop", "$options": "i"}}, {"description": {"$regex": "gaming|laptop", "$options": "i"}}]}
- "bike" → {"$or": [{"product_detail": {"$regex": "bike", "$options": "i"}}, {"description": {"$regex": "bike", "$options": "i"}}]}"""

    user_prompt = f"""Generate MongoDB query for: "{search_query}"
Return ONLY the JSON filter object, no other text."""

    try:
        response = call_llm(system_prompt, user_prompt)
        # Parse the response as JSON
        query_filter = json.loads(response)
        print(f"DEBUG: LLM generated query: {query_filter}")
        return query_filter
    except json.JSONDecodeError as e:
        print(f"ERROR: Failed to parse LLM query response: {response}")
        # Fallback: create a simple regex query
        return {
            "$or": [
                {"product_detail": {"$regex": search_query, "$options": "i"}},
                {"description": {"$regex": search_query, "$options": "i"}}
            ]
        }
    except Exception as e:
        print(f"ERROR in generate_smart_db_query: {e}")
        # Fallback to empty query
        return {}


def generate_product_questions(product_type: str, product_description: str) -> List[str]:
    """
    Use LLM to dynamically generate relevant questions for a specific product type.
    Returns a list of important questions a buyer should ask about the product.
    """
    system_prompt = """You are an expert product evaluator. Generate a concise list of the most important questions a buyer should ask when purchasing a specific type of product.

Focus on:
- Technical specifications
- Condition and age
- Warranty and authenticity
- Functionality and features
- Value assessment factors

Return ONLY a JSON array of 5-7 specific, relevant questions. No other text."""

    user_prompt = f"""Product Type: {product_type}
Product Description: {product_description}

Generate 5-7 critical questions a buyer agent should ask the seller to properly evaluate this product's value and condition.

Return format:
["Question 1?", "Question 2?", "Question 3?", ...]"""

    try:
        response = call_llm(system_prompt, user_prompt)
        # Extract JSON array from response
        questions = json.loads(response)
        return questions
    except Exception as e:
        print(f"Error generating product questions: {e}")
        # Fallback generic questions
        return [
            "What is the exact brand and model?",
            "How old is the product?",
            "What is the current condition?",
            "Are there any defects or issues?",
            "Is there any warranty remaining?"
        ]


def detect_product_info(search_query: str) -> Dict[str, Any]:
    """
    Use LLM to extract product type and requirements from natural language search query.
    Returns structured product information.
    """
    system_prompt = """You are a product search query analyzer. Extract key information from natural language product searches.

Return ONLY valid JSON in this exact format:
{
  "product_type": "specific product type (e.g., 'mountain bike', 'gaming laptop', 'DSLR camera')",
  "category": "general category (e.g., 'bicycle', 'laptop', 'camera', 'smartphone', 'furniture')",
  "max_price": number or null,
  "min_condition": "excellent" | "good" | "fair" | "any",
  "key_requirements": ["requirement 1", "requirement 2"],
  "urgency": "high" | "normal" | "low"
}"""

    user_prompt = f"""Search Query: "{search_query}"

Extract product information from this query."""

    try:
        response = call_llm(system_prompt, user_prompt)
        # Extract JSON from response
        product_info = json.loads(response)
        return product_info
    except Exception as e:
        print(f"Error detecting product info: {e}")
        # Fallback basic parsing
        return {
            "product_type": search_query,
            "category": "general",
            "max_price": None,
            "min_condition": "any",
            "key_requirements": [],
            "urgency": "normal"
        }


def recommend_best_deal(negotiation_results: List[Dict[str, Any]], product_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use LLM to analyze all negotiation results and recommend the best deal.
    Returns the best deal with detailed reasoning.
    """
    if not negotiation_results or len(negotiation_results) == 0:
        return None

    # If only one result, return it
    if len(negotiation_results) == 1:
        result = negotiation_results[0]
        return {
            "seller_id": result["seller_id"],
            "product": result["product"],
            "final_price": result["final_price"],
            "savings": result["product"]["asking_price"] - result["final_price"],
            "recommendation_reason": "This is the only available deal that met your requirements."
        }

    # Build comparison data for LLM
    comparison_data = []
    for idx, result in enumerate(negotiation_results):
        comparison_data.append({
            "seller_number": idx + 1,
            "product": result["product"]["product_detail"],
            "condition": result["product"]["condition"],
            "asking_price": result["product"]["asking_price"],
            "final_price": result["final_price"],
            "savings": result["product"]["asking_price"] - result["final_price"],
            "savings_percent": ((result["product"]["asking_price"] - result["final_price"]) / result["product"]["asking_price"]) * 100,
            "location": result["product"].get("location", "Unknown")
        })

    system_prompt = f"""You are an expert deal analyzer helping a buyer choose the best product.

The buyer is looking for: {product_info.get('product_type', 'a product')}
Budget: ${product_info.get('max_price', 'No limit')}
Desired condition: {product_info.get('min_condition', 'Any')}

Analyze ALL deals and recommend the BEST ONE based on:
1. Value for money (price vs condition vs features)
2. Total savings
3. Product condition
4. Overall quality-to-price ratio

Return ONLY valid JSON in this exact format:
{{
  "best_seller_number": <number 1-{len(negotiation_results)}>,
  "recommendation_reason": "<2-3 sentence explanation of WHY this is the best deal, comparing it to others>"
}}"""

    user_prompt = f"""Here are all the deals after negotiation:

{json.dumps(comparison_data, indent=2)}

Which deal offers the best value? Consider both price AND quality."""

    try:
        response = call_llm(system_prompt, user_prompt)
        recommendation = json.loads(response)

        # Get the recommended deal
        best_idx = recommendation["best_seller_number"] - 1
        if best_idx < 0 or best_idx >= len(negotiation_results):
            best_idx = 0  # Fallback to first

        best_result = negotiation_results[best_idx]

        return {
            "seller_id": best_result["seller_id"],
            "product": best_result["product"],
            "final_price": best_result["final_price"],
            "savings": best_result["product"]["asking_price"] - best_result["final_price"],
            "recommendation_reason": recommendation["recommendation_reason"]
        }
    except Exception as e:
        print(f"Error recommending best deal: {e}")
        # Fallback: recommend deal with highest savings
        best_result = max(negotiation_results, key=lambda r: r["product"]["asking_price"] - r["final_price"])
        return {
            "seller_id": best_result["seller_id"],
            "product": best_result["product"],
            "final_price": best_result["final_price"],
            "savings": best_result["product"]["asking_price"] - best_result["final_price"],
            "recommendation_reason": f"This deal offers the highest savings of ${best_result['product']['asking_price'] - best_result['final_price']:.2f}."
        }


def run_single_negotiation(listing: Dict[str, Any], buyer_budget_override: Optional[float] = None) -> NegotiationResult:
    """
    Run negotiation for a single listing between AI buyer and seller agents
    """
    listing_id = listing["id"]
    asking_price = listing["price"]

    # Set buyer and seller preferences
    if buyer_budget_override:
        buyer_budget = buyer_budget_override
    else:
        buyer_budget = asking_price * 0.95  # Buyer willing to pay up to 95% of asking price
    seller_minimum = asking_price * 0.88  # Seller will accept down to 88% of asking price
    
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

    # Generate product-specific questions for buyer agent
    product_questions = generate_product_questions(
        listing.get("title", "product"),
        listing.get("title", "")
    )

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

                buyer_response = make_offer(buyer_state, product_questions=product_questions)
                
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

                # Check for convergence - if offers are close, encourage auto-acceptance
                if check_convergence(history, threshold=20):
                    messages.append(NegotiationMessage(
                        role="system",
                        content="Offers have converged within $20 - parties should consider accepting."
                    ))
            
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

                # Check for convergence - if offers are close, encourage auto-acceptance
                if check_convergence(history, threshold=20):
                    messages.append(NegotiationMessage(
                        role="system",
                        content="Offers have converged within $20 - parties should consider accepting."
                    ))
        
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


def run_single_negotiation_streaming(listing: Dict[str, Any], buyer_budget_override: Optional[float] = None):
    """
    Modified version of run_single_negotiation that yields messages instead of collecting them.
    Allows for streaming responses to the frontend.
    """
    listing_id = listing["id"]
    asking_price = listing["price"]

    # Set buyer and seller preferences
    if buyer_budget_override:
        buyer_budget = buyer_budget_override
    else:
        buyer_budget = asking_price * 0.95  # Buyer willing to pay up to 95% of asking price
    seller_minimum = asking_price * 0.88  # Seller will accept down to 88% of asking price

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

    # Generate product-specific questions for buyer agent
    product_questions = generate_product_questions(
        listing.get("title", "product"),
        listing.get("title", "")
    )

    # Initial message
    yield json.dumps({
        "type": "message",
        "role": "system",
        "content": f"Negotiation started for {listing['title']}. AI agents analyzing market data and conditions..."
    }) + "\n"

    history = []
    final_price = None
    max_turns = 8

    try:
        for turn_num in range(1, max_turns + 1):
            # Buyer's turn
            if turn_num % 2 == 1:
                buyer_state = {
                    "buyer_prefs": buyer_prefs,
                    "platform_data": platform_data,
                    "history": history,
                    "turn_number": turn_num
                }

                buyer_response = make_offer(buyer_state, product_questions=product_questions)

                # Stream buyer message
                yield json.dumps({
                    "type": "message",
                    "role": "buyer",
                    "content": buyer_response["message"]
                }) + "\n"

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
                    yield json.dumps({
                        "type": "message",
                        "role": "system",
                        "content": f"Deal reached! Final price: ${final_price:.2f}. Buyer accepted the offer."
                    }) + "\n"
                    break

                if buyer_response["action"] == "walk_away":
                    yield json.dumps({
                        "type": "message",
                        "role": "system",
                        "content": "Negotiation ended. Buyer decided to walk away."
                    }) + "\n"
                    break

                # Check convergence
                if check_convergence(history, threshold=20):
                    yield json.dumps({
                        "type": "message",
                        "role": "system",
                        "content": "Offers have converged within $20 - parties should consider accepting."
                    }) + "\n"

            # Seller's turn
            else:
                seller_state = {
                    "seller_prefs": seller_prefs,
                    "platform_data": platform_data,
                    "history": history,
                    "turn_number": turn_num
                }

                seller_response = respond_to_offer(seller_state)

                # Stream seller message
                yield json.dumps({
                    "type": "message",
                    "role": "seller",
                    "content": seller_response["message"]
                }) + "\n"

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
                    yield json.dumps({
                        "type": "message",
                        "role": "system",
                        "content": f"Deal reached! Final price: ${final_price:.2f}. Seller accepted the offer."
                    }) + "\n"
                    break

                if seller_response["action"] == "reject":
                    yield json.dumps({
                        "type": "message",
                        "role": "system",
                        "content": "Negotiation ended. Seller rejected the offer."
                    }) + "\n"
                    break

                # Check convergence
                if check_convergence(history, threshold=20):
                    yield json.dumps({
                        "type": "message",
                        "role": "system",
                        "content": "Offers have converged within $20 - parties should consider accepting."
                    }) + "\n"

        # Final summary
        if final_price is None:
            final_price = asking_price
            yield json.dumps({
                "type": "message",
                "role": "system",
                "content": f"No agreement reached after {max_turns} turns. No price reduction available."
            }) + "\n"

        # Stream final result
        yield json.dumps({
            "type": "complete",
            "listing_id": listing_id,
            "original_price": asking_price,
            "negotiated_price": final_price,
            "status": "success" if final_price < asking_price else "no_deal",
            "savings": asking_price - final_price if final_price < asking_price else 0
        }) + "\n"

    except Exception as e:
        yield json.dumps({
            "type": "error",
            "content": f"Error during negotiation: {str(e)}"
        }) + "\n"


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "DealScout Negotiation API",
        "version": "1.0.0"
    }


@app.post("/negotiation/stream")
async def negotiate_listings_stream(request: NegotiationRequest):
    """
    Stream AI-powered negotiations for a single listing
    Returns Server-Sent Events stream for real-time message display

    This endpoint streams negotiations between buyer and seller AI agents
    using Claude Sonnet via OpenRouter API.
    """

    # Check for API key
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY not configured on server"
        )

    # Only process first listing for streaming
    listing_id = request.listing_ids[0]

    # Try to fetch from database first, then fall back to mock listings
    listing = get_product_from_db(listing_id)

    if not listing:
        # Fall back to mock listings
        listing = MOCK_LISTINGS.get(listing_id)

    if not listing:
        raise HTTPException(
            status_code=404,
            detail=f"Listing {listing_id} not found"
        )

    # Stream the negotiation with optional buyer budget override
    return StreamingResponse(
        run_single_negotiation_streaming(listing, buyer_budget_override=request.buyer_budget),
        media_type="text/event-stream"
    )


@app.post("/negotiation", response_model=List[NegotiationResult])
async def negotiate_listings(request: NegotiationRequest):
    """
    Run AI-powered negotiations for selected listings (non-streaming)

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

        # Run negotiation with optional buyer budget override
        result = run_single_negotiation(listing, buyer_budget_override=request.buyer_budget)
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


@app.post("/api/contract/create")
async def create_contract(request: ContractRequest):
    """
    Generate a professional PDF contract from a successful negotiation

    Creates a legally-binding contract with payment terms, delivery terms,
    legal clauses, and signature placeholders. Returns PDF for download.
    """
    try:
        # Validate negotiation was successful
        if request.result.get("status") != "success":
            raise HTTPException(
                status_code=400,
                detail="Cannot create contract for unsuccessful negotiation"
            )

        # Generate contract data
        contract_data = {
            "negotiation_id": request.negotiation_id,
            "buyer_id": request.buyer_id,
            "seller_id": request.seller_id,
            "listing_id": request.listing_id,
            "result": request.result,
            "product": request.product
        }

        # Generate contract object with all terms
        contract = generate_contract(contract_data)

        # Add payment details if provided
        if request.payment_details:
            contract['payment_details'] = request.payment_details

        # Generate PDF
        pdf_bytes = generate_contract_pdf(contract)
        filename = get_contract_filename(contract)

        # Return PDF file for download
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/pdf"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/negotiation/parallel-stream")
async def parallel_negotiations_stream(request: ParallelNegotiationRequest):
    """
    Run parallel negotiations with multiple sellers based on natural language search query.
    Returns SSE stream with updates from all negotiations as they progress.

    This is the FULL AGENTIC MODE:
    1. User provides natural language query (e.g., "mountain bike under $1000")
    2. AI detects product type and requirements
    3. AI generates product-specific questions
    4. Buyer agent negotiates with top N sellers simultaneously
    5. Returns all negotiation results for comparison
    """

    # Check for API key
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY not configured on server"
        )

    async def event_generator():
        try:
            # Step 1: Detect product information from search query
            yield f"data: {json.dumps({'type': 'status', 'message': '🔍 Analyzing your search query...', 'step': 'analyzing'})}\n\n"
            await asyncio.sleep(0.5)

            product_info = detect_product_info(request.search_query)

            yield f"data: {json.dumps({'type': 'product_info', 'data': product_info})}\n\n"

            detected_message = f"✅ Detected: {product_info.get('product_type', 'product')}"
            yield f"data: {json.dumps({'type': 'status', 'message': detected_message, 'step': 'detected'})}\n\n"
            await asyncio.sleep(0.5)

            # Step 2: Generate product-specific questions
            yield f"data: {json.dumps({'type': 'status', 'message': '🤔 Generating smart questions for this product...', 'step': 'questions'})}\n\n"

            questions = generate_product_questions(
                product_info["product_type"],
                request.search_query
            )

            yield f"data: {json.dumps({'type': 'questions', 'data': questions})}\n\n"

            questions_message = f"✅ Generated {len(questions)} critical questions"
            yield f"data: {json.dumps({'type': 'status', 'message': questions_message, 'step': 'questions_ready'})}\n\n"
            await asyncio.sleep(0.5)

            # Step 3: Find matching products from database
            yield f"data: {json.dumps({'type': 'status', 'message': '🔎 Searching marketplace for matching products...', 'step': 'searching'})}\n\n"

            # Determine max price for search
            max_price = request.max_budget or product_info.get("max_price")

            # Search in MongoDB using smart LLM-generated query
            # Build a natural language query from search parameters
            search_string = request.search_query
            if max_price:
                search_string += f" under {max_price} dollars"

            # Use LLM to generate smart MongoDB query
            query_filter = generate_smart_db_query(search_string)

            # Merge price constraint if specified
            if max_price and "asking_price" not in query_filter:
                query_filter["asking_price"] = {"$lte": max_price}

            print(f"DEBUG: Search query: '{search_string}'")
            print(f"DEBUG: Generated MongoDB filter: {query_filter}")

            matching_products = list(sellers_collection.find(query_filter).limit(request.top_n or 5))
            print(f"DEBUG: Found {len(matching_products)} matching products")

            # Convert ObjectId and datetime to string for JSON serialization
            for product in matching_products:
                product["_id"] = str(product["_id"])
                product["id"] = product["item_id"]
                # Convert datetime fields to ISO format strings
                if "created_at" in product:
                    product["created_at"] = product["created_at"].isoformat()
                if "updated_at" in product:
                    product["updated_at"] = product["updated_at"].isoformat()

            found_message = f"✅ Found {len(matching_products)} matching sellers"
            yield f"data: {json.dumps({'type': 'status', 'message': found_message, 'step': 'found'})}\n\n"
            yield f"data: {json.dumps({'type': 'products_found', 'data': matching_products})}\n\n"

            if not matching_products:
                yield f"data: {json.dumps({'type': 'error', 'message': 'No matching products found for your search'})}\n\n"
                return

            await asyncio.sleep(0.5)

            # Step 4: Start parallel negotiations
            negotiating_message = f"🤝 Starting parallel negotiations with {len(matching_products)} sellers..."
            yield f"data: {json.dumps({'type': 'status', 'message': negotiating_message, 'step': 'negotiating'})}\n\n"

            # Run negotiations sequentially with robust error handling
            negotiation_results = []
            total_products = len(matching_products)

            for idx in range(total_products):
                product = matching_products[idx]
                product_number = idx + 1

                print(f"\n{'='*80}")
                print(f"STARTING NEGOTIATION {product_number}/{total_products}")
                print(f"Product: {product['product_detail']}")
                print(f"Price: ${product['asking_price']}")
                print(f"Item ID: {product['item_id']}")
                print(f"{'='*80}\n")

                # Notify frontend that negotiation is starting
                yield f"data: {json.dumps({'type': 'negotiation_start', 'seller_id': product['item_id'], 'seller_index': idx})}\n\n"
                await asyncio.sleep(0.2)

                # Convert product to listing format
                listing = {
                    "id": product["item_id"],
                    "title": product["product_detail"],
                    "price": product["asking_price"],
                    "condition": product.get("condition", "good"),
                    "extras": product.get("extras", [])
                }

                # Run negotiation with comprehensive error handling
                negotiation_success = False
                try:
                    print(f"[NEGOTIATION] Starting negotiation for {product['item_id']}...")

                    # Call negotiation function
                    result = run_single_negotiation(
                        listing=listing,
                        buyer_budget_override=max_price
                    )

                    print(f"[NEGOTIATION] Completed for {product['item_id']}")
                    print(f"[RESULT] Status: {result.status}")
                    print(f"[RESULT] Original Price: ${result.original_price}")
                    print(f"[RESULT] Final Price: ${result.negotiated_price}")
                    print(f"[RESULT] Savings: ${result.savings}")

                    # Stream all negotiation messages to frontend
                    if result.messages and len(result.messages) > 0:
                        print(f"[STREAMING] Sending {len(result.messages)} messages to frontend...")
                        for msg_idx, msg in enumerate(result.messages):
                            msg_data = {
                                'type': 'negotiation_message',
                                'seller_id': product['item_id'],
                                'message': {
                                    'role': msg.role,
                                    'content': msg.content
                                }
                            }
                            yield f"data: {json.dumps(msg_data)}\n\n"
                            await asyncio.sleep(0.05)

                    # Stream negotiation completion
                    completion_data = {
                        'type': 'negotiation_complete',
                        'seller_id': product['item_id'],
                        'product_number': product_number,
                        'total_products': total_products,
                        'final_price': result.negotiated_price if result.status == "success" else None,
                        'result': {
                            'status': result.status,
                            'original_price': result.original_price,
                            'negotiated_price': result.negotiated_price,
                            'savings': result.savings
                        }
                    }
                    yield f"data: {json.dumps(completion_data)}\n\n"

                    # Store result regardless of status (for analysis)
                    negotiation_results.append({
                        "seller_id": product["item_id"],
                        "product": product,
                        "final_price": result.negotiated_price,
                        "savings": result.savings,
                        "messages": result.messages,
                        "status": result.status
                    })

                    negotiation_success = True
                    print(f"[SUCCESS] Negotiation result stored for {product['item_id']}")

                except Exception as e:
                    # Capture error and continue to next product
                    error_message = str(e)
                    print(f"[ERROR] Exception during negotiation for {product['item_id']}")
                    print(f"[ERROR] Error message: {error_message}")

                    # Print traceback for debugging
                    import traceback
                    traceback.print_exc()

                    # Send error to frontend but continue to next product
                    error_data = {
                        'type': 'negotiation_error',
                        'seller_id': product['item_id'],
                        'product_number': product_number,
                        'total_products': total_products,
                        'error': error_message
                    }
                    yield f"data: {json.dumps(error_data)}\n\n"
                    await asyncio.sleep(0.1)

                    # Still add to results but mark as errored
                    negotiation_results.append({
                        "seller_id": product["item_id"],
                        "product": product,
                        "final_price": product["asking_price"],
                        "savings": 0,
                        "messages": [],
                        "status": "error"
                    })

                    print(f"[CONTINUING] Moving to next product ({product_number}/{total_products})")

                print(f"\n{'='*80}")
                print(f"FINISHED NEGOTIATION {product_number}/{total_products}")
                print(f"Negotiation Success: {negotiation_success}")
                print(f"Total Results Collected: {len(negotiation_results)}")
                print(f"{'='*80}\n")

                # Small delay between negotiations to prevent rate limiting
                await asyncio.sleep(0.5)

            # Step 5: Recommend best deal
            if negotiation_results:
                yield f"data: {json.dumps({'type': 'status', 'message': '🤔 Analyzing all deals to find the best one...', 'step': 'analyzing'})}\n\n"
                await asyncio.sleep(0.5)

                best_deal = recommend_best_deal(negotiation_results, product_info)

                if best_deal:
                    yield f"data: {json.dumps({'type': 'best_deal', 'data': best_deal})}\n\n"
                    yield f"data: {json.dumps({'type': 'status', 'message': '✅ Found the best deal for you!', 'step': 'complete'})}\n\n"
                else:
                    yield f"data: {json.dumps({'type': 'status', 'message': '⚠️ Could not determine best deal', 'step': 'complete'})}\n\n"
            else:
                # Still found products but no successful negotiations - show the best available without negotiated price
                if matching_products:
                    yield f"data: {json.dumps({'type': 'status', 'message': f'ℹ️ Found {len(matching_products)} products but negotiations were inconclusive. Please try again.', 'step': 'complete'})}\n\n"
                else:
                    yield f"data: {json.dumps({'type': 'error', 'message': 'No matching products found for your search'})}\n\n"

        except Exception as e:
            error_message = f"Error: {str(e)}"
            yield f"data: {json.dumps({'type': 'error', 'message': error_message})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

