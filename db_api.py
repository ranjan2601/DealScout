"""
Database API Endpoints for DealScout
Handles CRUD operations for sellers and buyers
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from db import SellerProduct, BuyerProfile, init_db
import requests
import json
from datetime import datetime

load_dotenv()

# Direct MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "dealscout")
client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
sellers_collection = db["sellers"]
buyers_collection = db["buyers"]

app = FastAPI(title="DealScout Database API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CreateSellerProductRequest(BaseModel):
    """Request to create a new seller product"""
    seller_id: str
    asking_price: float
    min_selling_price: float
    location: str
    zip_code: str
    product_detail: str
    condition: str
    item_id: Optional[str] = None


class UpdateProductPriceRequest(BaseModel):
    """Request to update product price"""
    item_id: str
    new_asking_price: float


class UpdateProductStatusRequest(BaseModel):
    """Request to update product status"""
    item_id: str
    status: str  # active, sold, delisted


class CreateBuyerRequest(BaseModel):
    """Request to create a new buyer profile"""
    buyer_id: str
    max_budget: float
    target_price: Optional[float] = None


class UpdateBuyerBudgetRequest(BaseModel):
    """Request to update buyer budget"""
    buyer_id: str
    max_budget: float


class UpdateBuyerTargetPriceRequest(BaseModel):
    """Request to update buyer target price"""
    buyer_id: str
    target_price: float


class AISearchRequest(BaseModel):
    """Request for AI-powered product search"""
    query: str


# ============================================================================
# LLM SEARCH FUNCTION
# ============================================================================

def analyze_search_query_with_llm(query: str) -> Dict[str, Any]:
    """
    Use Claude LLM to analyze buyer search query and extract filters.
    Returns category, price range, and other attributes.
    """
    try:
        api_key = os.getenv("OPENROUTER_API_KEY", "")
        if not api_key:
            # If no OpenRouter key, use simple keyword matching
            return extract_filters_fallback(query)

        prompt = f"""Analyze this product search query and extract the relevant filters. Return a JSON object with:
- category: product category (mountain-bike, macbook, electronics, or null for all)
- max_price: maximum price the buyer is willing to pay (or null)
- min_price: minimum price (or null)
- keywords: list of important product keywords mentioned

Search query: "{query}"

Return ONLY valid JSON, no other text."""

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "DealScout"
            },
            json={
                "model": "claude-3.5-sonnet",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
            }
        )

        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()
            filters = json.loads(content)
            return filters
        else:
            return extract_filters_fallback(query)
    except Exception as e:
        print(f"LLM error: {e}")
        return extract_filters_fallback(query)


def extract_filters_fallback(query: str) -> Dict[str, Any]:
    """Fallback function to extract filters using keyword matching"""
    query_lower = query.lower()

    category = None
    if any(word in query_lower for word in ["bike", "bicycle", "mtb", "mountain"]):
        category = "mountain-bike"
    elif any(word in query_lower for word in ["macbook", "mac", "apple laptop"]):
        category = "macbook"
    elif any(word in query_lower for word in ["playstation", "ps5", "iphone", "ipad", "watch", "drone", "headphones", "tv"]):
        category = "electronics"

    # Extract price
    max_price = None
    min_price = None

    import re
    price_matches = re.findall(r'\$?(\d+(?:,\d+)?)', query_lower)
    if price_matches:
        prices = [int(p.replace(',', '')) for p in price_matches]
        if len(prices) >= 1:
            max_price = prices[0]
        if len(prices) >= 2:
            min_price = prices[1]

    return {
        "category": category,
        "max_price": max_price,
        "min_price": min_price,
        "keywords": query_lower.split()
    }


# ============================================================================
# SELLER ENDPOINTS
# ============================================================================

@app.post("/api/seller/product/create")
async def create_seller_product(request: CreateSellerProductRequest):
    """Create a new seller product listing"""
    try:
        product = SellerProduct.create(
            seller_id=request.seller_id,
            asking_price=request.asking_price,
            min_selling_price=request.min_selling_price,
            location=request.location,
            zip_code=request.zip_code,
            product_detail=request.product_detail,
            condition=request.condition,
            item_id=request.item_id
        )

        return {
            "status": "success",
            "message": "Product created successfully",
            "product": {
                "id": str(product.get("_id")),
                "item_id": product.get("item_id"),
                "seller_id": product.get("seller_id"),
                "asking_price": product.get("asking_price"),
                "min_selling_price": product.get("min_selling_price"),
                "location": product.get("location"),
                "zip_code": product.get("zip_code"),
                "product_detail": product.get("product_detail"),
                "condition": product.get("condition"),
                "status": product.get("status"),
                "created_at": product.get("created_at").isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/seller/products/{seller_id}")
async def get_seller_products(seller_id: str):
    """Get all products by a seller"""
    try:
        products = SellerProduct.get_by_seller_id(seller_id)

        return {
            "status": "success",
            "count": len(products),
            "products": [
                {
                    "id": str(p.get("_id")),
                    "item_id": p.get("item_id"),
                    "asking_price": p.get("asking_price"),
                    "min_selling_price": p.get("min_selling_price"),
                    "location": p.get("location"),
                    "zip_code": p.get("zip_code"),
                    "product_detail": p.get("product_detail"),
                    "condition": p.get("condition"),
                    "status": p.get("status"),
                    "created_at": p.get("created_at").isoformat()
                }
                for p in products
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/seller/product/{item_id}")
async def get_product_by_item_id(item_id: str):
    """Get a specific product by item ID"""
    try:
        product = SellerProduct.get_by_item_id(item_id)

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        return {
            "status": "success",
            "product": {
                "id": str(product.get("_id")),
                "item_id": product.get("item_id"),
                "seller_id": product.get("seller_id"),
                "asking_price": product.get("asking_price"),
                "min_selling_price": product.get("min_selling_price"),
                "location": product.get("location"),
                "zip_code": product.get("zip_code"),
                "product_detail": product.get("product_detail"),
                "condition": product.get("condition"),
                "status": product.get("status"),
                "created_at": product.get("created_at").isoformat(),
                "updated_at": product.get("updated_at").isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/seller/products/all")
async def get_all_products():
    """Get all products from all sellers"""
    try:
        # Use SellerProduct.get_all() method instead
        products = SellerProduct.get_all()

        return {
            "status": "success",
            "count": len(products),
            "products": [
                {
                    "id": str(p.get("_id")),
                    "item_id": p.get("item_id"),
                    "seller_id": p.get("seller_id"),
                    "asking_price": p.get("asking_price"),
                    "min_selling_price": p.get("min_selling_price"),
                    "location": p.get("location"),
                    "zip_code": p.get("zip_code"),
                    "product_detail": p.get("product_detail"),
                    "condition": p.get("condition"),
                    "category": p.get("category"),
                    "images": p.get("images", []),
                    "status": p.get("status"),
                    "created_at": p.get("created_at").isoformat() if p.get("created_at") else None
                }
                for p in products
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/seller/product/update-price")
async def update_product_price(request: UpdateProductPriceRequest):
    """Update a product's asking price"""
    try:
        success = SellerProduct.update_price(request.item_id, request.new_asking_price)

        if not success:
            raise HTTPException(status_code=404, detail="Product not found")

        return {
            "status": "success",
            "message": f"Product price updated to ${request.new_asking_price}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/seller/product/update-status")
async def update_product_status(request: UpdateProductStatusRequest):
    """Update a product's status"""
    try:
        success = SellerProduct.update_status(request.item_id, request.status)

        if not success:
            raise HTTPException(status_code=404, detail="Product not found")

        return {
            "status": "success",
            "message": f"Product status updated to {request.status}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/seller/product/{item_id}")
async def delete_product(item_id: str):
    """Delete a product listing"""
    try:
        success = SellerProduct.delete(item_id)

        if not success:
            raise HTTPException(status_code=404, detail="Product not found")

        return {
            "status": "success",
            "message": "Product deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# BUYER ENDPOINTS
# ============================================================================

@app.post("/api/buyer/create")
async def create_buyer(request: CreateBuyerRequest):
    """Create a new buyer profile"""
    try:
        buyer = BuyerProfile.create(
            buyer_id=request.buyer_id,
            max_budget=request.max_budget,
            target_price=request.target_price
        )

        return {
            "status": "success",
            "message": "Buyer profile created successfully",
            "buyer": {
                "id": str(buyer.get("_id")),
                "buyer_id": buyer.get("buyer_id"),
                "max_budget": buyer.get("max_budget"),
                "target_price": buyer.get("target_price"),
                "created_at": buyer.get("created_at").isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/buyer/{buyer_id}")
async def get_buyer(buyer_id: str):
    """Get a buyer's profile"""
    try:
        buyer = BuyerProfile.get_by_buyer_id(buyer_id)

        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")

        return {
            "status": "success",
            "buyer": {
                "id": str(buyer.get("_id")),
                "buyer_id": buyer.get("buyer_id"),
                "max_budget": buyer.get("max_budget"),
                "target_price": buyer.get("target_price"),
                "created_at": buyer.get("created_at").isoformat(),
                "updated_at": buyer.get("updated_at").isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/buyer/update-budget")
async def update_buyer_budget(request: UpdateBuyerBudgetRequest):
    """Update a buyer's budget"""
    try:
        success = BuyerProfile.update_budget(request.buyer_id, request.max_budget)

        if not success:
            raise HTTPException(status_code=404, detail="Buyer not found")

        return {
            "status": "success",
            "message": f"Buyer budget updated to ${request.max_budget}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/buyer/update-target-price")
async def update_buyer_target_price(request: UpdateBuyerTargetPriceRequest):
    """Update a buyer's target price"""
    try:
        success = BuyerProfile.update_target_price(request.buyer_id, request.target_price)

        if not success:
            raise HTTPException(status_code=404, detail="Buyer not found")

        return {
            "status": "success",
            "message": f"Buyer target price updated to ${request.target_price}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/buyer/{buyer_id}")
async def delete_buyer(buyer_id: str):
    """Delete a buyer profile"""
    try:
        success = BuyerProfile.delete(buyer_id)

        if not success:
            raise HTTPException(status_code=404, detail="Buyer not found")

        return {
            "status": "success",
            "message": "Buyer profile deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# AI-POWERED SEARCH
# ============================================================================

@app.post("/api/search")
async def ai_search(request: AISearchRequest):
    """AI-powered product search using LLM to analyze buyer query"""
    try:
        # Analyze query with LLM
        filters = analyze_search_query_with_llm(request.query)

        # Get all products
        all_products = SellerProduct.get_all()

        # Filter based on extracted criteria
        filtered_products = []

        for product in all_products:
            # Category filter
            if filters.get("category") and product.get("category") != filters["category"]:
                continue

            # Price filter - check if asking_price is within range
            price = product.get("asking_price", 0)
            if filters.get("max_price") and price > filters["max_price"]:
                continue
            if filters.get("min_price") and price < filters["min_price"]:
                continue

            filtered_products.append(product)

        # Format response
        return {
            "status": "success",
            "count": len(filtered_products),
            "query_analysis": {
                "original_query": request.query,
                "category": filters.get("category"),
                "max_price": filters.get("max_price"),
                "min_price": filters.get("min_price"),
            },
            "products": [
                {
                    "id": str(p.get("_id")),
                    "item_id": p.get("item_id"),
                    "seller_id": p.get("seller_id"),
                    "asking_price": p.get("asking_price"),
                    "min_selling_price": p.get("min_selling_price"),
                    "location": p.get("location"),
                    "zip_code": p.get("zip_code"),
                    "product_detail": p.get("product_detail"),
                    "description": p.get("description"),
                    "condition": p.get("condition"),
                    "category": p.get("category"),
                    "images": p.get("images", []),
                    "status": p.get("status"),
                    "created_at": p.get("created_at").isoformat() if p.get("created_at") else None
                }
                for p in filtered_products
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "DealScout Database API",
        "version": "1.0.0"
    }


# ============================================================================
# INITIALIZATION
# ============================================================================

@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    try:
        init_db()
    except Exception as e:
        print(f"Warning: Could not initialize database: {e}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("DB_API_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
