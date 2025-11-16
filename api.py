"""
REST API for AI Negotiation Engine
Endpoints for searching products and running negotiations
"""

from flask import Flask, request, jsonify
from typing import Dict, Any, List
import os
from dotenv import load_dotenv

# Import negotiation functions
from negotiate import run_negotiation
from buyer_agent import make_offer
from seller_agent import respond_to_offer

load_dotenv()

app = Flask(__name__)

# Mock database functions (replace with actual DB queries)
def search_listings(
    category: str,
    location: str,
    max_budget: float,
    min_price: float = 0
) -> List[Dict[str, Any]]:
    """
    Search listings in database based on category, location, and budget

    Args:
        category: Product category (e.g., "bikes", "electronics")
        location: Location (e.g., "Brooklyn, NY")
        max_budget: Maximum price the buyer is willing to pay
        min_price: Minimum price filter

    Returns:
        List of matching listings
    """
    # TODO: Replace with actual database query
    # db.query("SELECT * FROM listings WHERE category=? AND location=? AND price BETWEEN ? AND ?")

    mock_listings = [
        {
            "listing_id": "bike_001",
            "title": "Trek Mountain Bike XL",
            "condition": "like-new",
            "asking_price": 450,
            "location": "Brooklyn, NY",
            "category": "bikes",
            "seller_id": "seller_123",
            "extras": ["helmet", "lock"],
            "description": "Barely used, pristine condition",
            "image_url": "https://example.com/bike1.jpg"
        },
        {
            "listing_id": "bike_002",
            "title": "Giant Mountain Bike",
            "condition": "good",
            "asking_price": 480,
            "location": "Brooklyn, NY",
            "category": "bikes",
            "seller_id": "seller_456",
            "extras": ["helmet"],
            "description": "Well maintained, minor scratches",
            "image_url": "https://example.com/bike2.jpg"
        },
        {
            "listing_id": "bike_003",
            "title": "Specialized Hardtail",
            "condition": "excellent",
            "asking_price": 520,
            "location": "Brooklyn, NY",
            "category": "bikes",
            "seller_id": "seller_789",
            "extras": [],
            "description": "Like new, stored indoors",
            "image_url": "https://example.com/bike3.jpg"
        }
    ]

    # Filter by budget
    return [l for l in mock_listings if l["asking_price"] <= max_budget]


def get_comparable_listings(
    category: str,
    location: str,
    exclude_listing_id: str
) -> List[Dict[str, Any]]:
    """
    Get comparable listings for market analysis

    Args:
        category: Product category
        location: Location
        exclude_listing_id: Listing ID to exclude from results

    Returns:
        List of comparable listings
    """
    # TODO: Replace with actual database query
    # Last 30 days, same category, same location, exclude current listing

    mock_comps = [
        {"listing_id": "comp_001", "price": 420, "condition": "good", "status": "sold"},
        {"listing_id": "comp_002", "price": 450, "condition": "like-new", "status": "sold"},
        {"listing_id": "comp_003", "price": 480, "condition": "good", "status": "sold"},
        {"listing_id": "comp_004", "price": 500, "condition": "excellent", "status": "active"},
    ]

    return mock_comps


def calculate_platform_stats(comps: List[Dict[str, Any]]) -> Dict[str, float]:
    """Calculate platform statistics from comparable listings"""
    if not comps:
        return {"avg_price_sold": 0, "median_price_sold": 0, "avg_time_to_sell_days": 0}

    prices = [c["price"] for c in comps if c["status"] == "sold"]

    if not prices:
        return {"avg_price_sold": 0, "median_price_sold": 0, "avg_time_to_sell_days": 0}

    avg_price = sum(prices) / len(prices)
    prices_sorted = sorted(prices)
    median_price = prices_sorted[len(prices_sorted) // 2]

    return {
        "avg_price_sold": round(avg_price, 2),
        "median_price_sold": median_price,
        "avg_time_to_sell_days": 4.2  # TODO: Calculate from actual data
    }


def get_seller_preferences(seller_id: str, asking_price: float) -> Dict[str, Any]:
    """
    Get seller preferences from database

    Args:
        seller_id: Seller's ID
        asking_price: Asking price for the item

    Returns:
        Seller preferences
    """
    # TODO: Replace with actual database query

    return {
        "min_acceptable": asking_price * 0.80,  # 80% of asking price
        "asking_price": asking_price,
        "can_bundle_extras": ["helmet", "lock"]  # TODO: Get from listing
    }


# ============================================================================
# ENDPOINT 1: SEARCH LISTINGS
# ============================================================================

@app.route("/api/search", methods=["POST"])
def search_listings_endpoint():
    """
    Endpoint for searching listings based on user query

    Request body:
    {
        "search_query": "mountain bike under $500 in brooklyn",
        "category": "bikes",
        "location": "Brooklyn, NY",
        "max_budget": 500,
        "min_price": 0
    }

    Response:
    {
        "status": "success",
        "listings": [
            {
                "listing_id": "bike_001",
                "title": "Trek Mountain Bike",
                "asking_price": 450,
                "condition": "like-new",
                "location": "Brooklyn, NY",
                ...
            }
        ],
        "total": 3
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["category", "location", "max_budget"]
        if not all(field in data for field in required_fields):
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {required_fields}"
            }), 400

        category = data.get("category")
        location = data.get("location")
        max_budget = data.get("max_budget")
        min_price = data.get("min_price", 0)

        # Search listings
        listings = search_listings(
            category=category,
            location=location,
            max_budget=max_budget,
            min_price=min_price
        )

        return jsonify({
            "status": "success",
            "listings": listings,
            "total": len(listings)
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ============================================================================
# ENDPOINT 2: START NEGOTIATION
# ============================================================================

@app.route("/api/negotiate", methods=["POST"])
def start_negotiation_endpoint():
    """
    Endpoint to start negotiation for selected listings

    Request body:
    {
        "buyer_id": "user_123",
        "buyer_budget": 450,
        "selected_listing_ids": ["bike_001"],
        "mode": "single"
    }

    Response:
    {
        "status": "success",
        "negotiation_id": "neg_abc123",
        "result": {
            "status": "success",
            "final_price": 425.00,
            "turns": 4,
            "history": [...]
        }
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["buyer_id", "buyer_budget", "selected_listing_ids"]
        if not all(field in data for field in required_fields):
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {required_fields}"
            }), 400

        buyer_id = data.get("buyer_id")
        buyer_budget = data.get("buyer_budget")
        selected_listing_ids = data.get("selected_listing_ids")
        mode = data.get("mode", "single")  # single or multi

        if not selected_listing_ids or len(selected_listing_ids) == 0:
            return jsonify({
                "status": "error",
                "message": "Must select at least one listing"
            }), 400

        # For now, handle single listing negotiation
        if len(selected_listing_ids) > 1:
            return jsonify({
                "status": "error",
                "message": "Multi-listing negotiation not yet supported. Please select one listing."
            }), 400

        listing_id = selected_listing_ids[0]

        # Fetch listing from database (for now, map frontend listing IDs to mock data)
        # Map frontend listing-X to backend listing structure
        frontend_to_backend_map = {
            "listing-1": {"title": "Trek Mountain Bike - Excellent Condition", "price": 1200, "condition": "like-new", "brand": "Trek"},
            "listing-2": {"title": "Giant Road Bike", "price": 850, "condition": "used", "brand": "Giant"},
            "listing-3": {"title": "Specialized Electric Bike - Brand New", "price": 3500, "condition": "new", "brand": "Specialized"},
            "listing-4": {"title": "Cannondale Hybrid Bike", "price": 650, "condition": "like-new", "brand": "Cannondale"},
            "listing-5": {"title": "Trek Cruiser - Comfortable Ride", "price": 450, "condition": "used", "brand": "Trek"},
            "listing-6": {"title": "Giant Mountain Bike - Trail Ready", "price": 980, "condition": "like-new", "brand": "Giant"},
            "listing-7": {"title": "Specialized Road Bike - Racing Edition", "price": 2100, "condition": "like-new", "brand": "Specialized"},
            "listing-8": {"title": "Cannondale Kids Bike", "price": 280, "condition": "used", "brand": "Cannondale"},
        }

        listing_data = frontend_to_backend_map.get(listing_id, {})
        listing = {
            "listing_id": listing_id,
            "title": listing_data.get("title", "Unknown Bike"),
            "condition": listing_data.get("condition", "unknown"),
            "asking_price": listing_data.get("price", 500),
            "location": "Brooklyn, NY",
            "category": "bikes",
            "seller_id": f"seller_{listing_id}",
            "extras": []
        }

        # Get comparable listings
        comps = get_comparable_listings(
            category=listing["category"],
            location=listing["location"],
            exclude_listing_id=listing_id
        )

        # Calculate platform stats
        stats = calculate_platform_stats(comps)

        # Build platform data
        platform_data = {
            "product": listing,
            "platform_comps": comps,
            "platform_stats": stats
        }

        # Get seller preferences
        seller_prefs = get_seller_preferences(
            seller_id=listing["seller_id"],
            asking_price=listing["asking_price"]
        )

        # Build buyer preferences
        buyer_prefs = {
            "max_budget": buyer_budget,
            "target_price": buyer_budget * 0.90  # 90% of budget
        }

        # TODO: Store these in global context for negotiation
        # For now, we'll update the hardcoded values in negotiate.py

        # Run negotiation
        from negotiate import PLATFORM_DATA as GLOBAL_PLATFORM_DATA
        from negotiate import BUYER_PREFS as GLOBAL_BUYER_PREFS
        from negotiate import SELLER_PREFS as GLOBAL_SELLER_PREFS

        # Update global variables (not ideal, but works for MVP)
        import negotiate
        negotiate.PLATFORM_DATA = platform_data
        negotiate.BUYER_PREFS = buyer_prefs
        negotiate.SELLER_PREFS = seller_prefs

        # Run negotiation
        result = negotiate.run_negotiation()

        # Generate negotiation ID
        import uuid
        negotiation_id = f"neg_{uuid.uuid4().hex[:12]}"

        # TODO: Save negotiation result to database
        # db.save_negotiation(negotiation_id, buyer_id, listing_id, result)

        return jsonify({
            "status": "success",
            "negotiation_id": negotiation_id,
            "listing_id": listing_id,
            "seller_id": listing["seller_id"],
            "result": result
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ============================================================================
# ENDPOINT 3: GET NEGOTIATION HISTORY
# ============================================================================

@app.route("/api/negotiation/<negotiation_id>", methods=["GET"])
def get_negotiation_endpoint(negotiation_id: str):
    """
    Get negotiation details and history

    Response:
    {
        "status": "success",
        "negotiation_id": "neg_abc123",
        "buyer_id": "user_123",
        "listing_id": "bike_001",
        "final_price": 425.00,
        "history": [...]
    }
    """
    try:
        # TODO: Fetch from database
        # negotiation = db.get_negotiation(negotiation_id)

        return jsonify({
            "status": "success",
            "message": f"Negotiation {negotiation_id} details"
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "AI Negotiation API is running"
    }), 200


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "error",
        "message": "Endpoint not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "status": "error",
        "message": "Internal server error"
    }), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
