# DealScout - AI Negotiation Engine API Documentation

## Overview

The DealScout API provides endpoints to search for marketplace listings and run AI-powered price negotiations between buyers and sellers. The negotiation engine uses autonomous agents powered by Claude Sonnet 4.5 to conduct realistic, human-like negotiations based on market data and user preferences.

**Base URL**: `http://localhost:5000/api`

---

## Authentication

Currently, no authentication is required. Ensure your `.env` file contains:
```
OPENROUTER_API_KEY=your_api_key_here
```

This API key is required for the negotiation agents to work.

---

## Endpoints

### 1. Health Check

Check if the API is running and healthy.

**Endpoint**: `GET /api/health`

**Response**:
```json
{
    "status": "healthy",
    "message": "AI Negotiation API is running"
}
```

**Status Code**: `200 OK`

---

### 2. Search Listings

Search for marketplace listings based on category, location, and budget.

**Endpoint**: `POST /api/search`

**Request Body**:
```json
{
    "category": "bikes",
    "location": "Brooklyn, NY",
    "max_budget": 500,
    "min_price": 0
}
```

**Parameters**:
- `category` (required, string): Product category (e.g., "bikes", "electronics")
- `location` (required, string): Location (e.g., "Brooklyn, NY")
- `max_budget` (required, number): Maximum price buyer is willing to pay
- `min_price` (optional, number): Minimum price filter (default: 0)

**Response** (Success):
```json
{
    "status": "success",
    "listings": [
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
        }
    ],
    "total": 2
}
```

**Response** (Error - Missing Fields):
```json
{
    "status": "error",
    "message": "Missing required fields: ['category', 'location', 'max_budget']"
}
```

**Status Codes**:
- `200 OK`: Search completed successfully
- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Server error during search

---

### 3. Start Negotiation

Run an AI negotiation between a buyer and seller for a specific listing.

**Endpoint**: `POST /api/negotiate`

**Request Body**:
```json
{
    "buyer_id": "user_123",
    "buyer_budget": 450,
    "selected_listing_ids": ["bike_001"],
    "mode": "single"
}
```

**Parameters**:
- `buyer_id` (required, string): Unique identifier for the buyer
- `buyer_budget` (required, number): Maximum price buyer is willing to pay
- `selected_listing_ids` (required, array): Array with one listing ID (multi-listing not yet supported)
- `mode` (optional, string): "single" or "multi" (default: "single")

**Response** (Success):
```json
{
    "status": "success",
    "negotiation_id": "neg_e23a35197552",
    "listing_id": "bike_001",
    "seller_id": "seller_123",
    "result": {
        "status": "success",
        "final_price": 420.00,
        "turns": 5,
        "history": [
            {
                "party": "buyer",
                "action": "counter",
                "offer_price": 380.0,
                "message": "Hey! I'm really interested in the Trek mountain bike...",
                "confidence": 0.7,
                "turn": 1
            },
            {
                "party": "seller",
                "action": "counter",
                "offer_price": 430.0,
                "message": "Hey! Thanks for the interest...",
                "confidence": 0.85,
                "turn": 2
            },
            ...
        ],
        "buyer_comment": "Thanks! It was great dealing with you. Looking forward to the pickup!",
        "seller_comment": "Same here! Thanks for the smooth negotiation. See you soon!",
        "savings": {
            "amount": 30.0,
            "percentage": 6.7
        }
    }
}
```

**Response** (Error - Multiple Listings):
```json
{
    "status": "error",
    "message": "Multi-listing negotiation not yet supported. Please select one listing."
}
```

**Response** (Error - Missing Fields):
```json
{
    "status": "error",
    "message": "Missing required fields: ['buyer_id', 'buyer_budget', 'selected_listing_ids']"
}
```

**Status Codes**:
- `200 OK`: Negotiation completed successfully
- `400 Bad Request`: Missing required fields or invalid input
- `500 Internal Server Error`: Error during negotiation (usually API key issue)

**Negotiation Result Details**:
- `status`: "success" if deal was reached, "failed" if negotiation ended without deal
- `final_price`: Agreed-upon price (null if no deal)
- `turns`: Number of negotiation turns (max 10)
- `history`: Array of all negotiation turns with messages and offers
- `buyer_comment`: Buyer's final message
- `seller_comment`: Seller's final message
- `savings`: How much buyer saved from asking price

---

### 4. Get Negotiation Details

Retrieve past negotiation details and history.

**Endpoint**: `GET /api/negotiation/<negotiation_id>`

**Parameters**:
- `negotiation_id` (required, string): Negotiation ID from negotiation response

**Response**:
```json
{
    "status": "success",
    "message": "Negotiation neg_e23a35197552 details"
}
```

**Status Codes**:
- `200 OK`: Negotiation details retrieved
- `404 Not Found`: Negotiation ID not found

---

## Example Usage

### Example 1: Search for Bikes in Brooklyn

```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "category": "bikes",
    "location": "Brooklyn, NY",
    "max_budget": 500,
    "min_price": 0
  }'
```

### Example 2: Run Negotiation

```bash
curl -X POST http://localhost:5000/api/negotiate \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_id": "user_123",
    "buyer_budget": 450,
    "selected_listing_ids": ["bike_001"],
    "mode": "single"
  }'
```

### Example 3: Python Integration

```python
import requests
import json

BASE_URL = "http://localhost:5000/api"

# Search for listings
search_response = requests.post(
    f"{BASE_URL}/search",
    json={
        "category": "bikes",
        "location": "Brooklyn, NY",
        "max_budget": 500
    }
)

listings = search_response.json()["listings"]
print(f"Found {len(listings)} listings")

# Negotiate on first listing
if listings:
    listing_id = listings[0]["listing_id"]

    negotiate_response = requests.post(
        f"{BASE_URL}/negotiate",
        json={
            "buyer_id": "user_123",
            "buyer_budget": 450,
            "selected_listing_ids": [listing_id]
        }
    )

    result = negotiate_response.json()
    final_price = result["result"]["final_price"]
    print(f"Negotiation completed! Final price: ${final_price}")
```

---

## Error Handling

All error responses follow this format:

```json
{
    "status": "error",
    "message": "Description of the error"
}
```

### Common Errors

| Status Code | Error | Solution |
|-------------|-------|----------|
| 400 | Missing required fields | Check request body has all required fields |
| 400 | Multi-listing negotiation not yet supported | Select only one listing |
| 400 | Must select at least one listing | Provide at least one listing ID |
| 500 | OPENROUTER_API_KEY environment variable not set | Set API key in .env file |
| 500 | API Error from OpenRouter | Check API key validity and rate limits |
| 404 | Endpoint not found | Verify endpoint URL |

---

## Running the API Server

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file:
```
OPENROUTER_API_KEY=your_api_key_here
```

### 3. Start the Server

```bash
python api.py
```

The server will start on `http://localhost:5000`

### 4. Test the API

```bash
python test_api.py
```

---

## Architecture Notes

### Data Flow

1. **Search Request**: User specifies category, location, max budget
2. **Search Response**: API returns matching listings from (mock) database
3. **User Selection**: User selects one or more listings
4. **Negotiation Request**: User initiates negotiation with buyer budget
5. **Data Preparation**: API fetches comparable listings and calculates market stats
6. **Agent Negotiation**: Buyer and seller agents negotiate in turns (max 10 turns)
7. **Result**: Final agreed price, conversation history, and savings returned

### Agent Decision Making

**Buyer Agent**:
- Makes realistic offers based on market comparables
- Negotiates incrementally toward target price
- Respects max budget constraint
- Can accept, counter, reject, or walk away

**Seller Agent**:
- Responds to buyer offers with counter offers
- References platform data to justify prices
- Enforces minimum acceptable price
- Adapts strategy based on negotiation turn

### Mock Database Functions

The following functions in `api.py` are currently using mock data:

- `search_listings()` - Returns hardcoded bike listings
- `get_comparable_listings()` - Returns mock comparable sales
- `calculate_platform_stats()` - Calculates stats from mock comps
- `get_seller_preferences()` - Returns mock seller constraints

**TODO**: Replace with actual database queries when real DB is available.

---

## Future Enhancements

1. **Authentication**: Add user authentication and session management
2. **Multi-listing Negotiation**: Support negotiating on multiple listings simultaneously
3. **Database Integration**: Replace mock functions with real database queries
4. **WebSocket Support**: Real-time negotiation updates to frontend
5. **Negotiation Persistence**: Store negotiation history in database
6. **Multi-buyer Support**: One seller negotiating with multiple buyers concurrently
7. **Analytics**: Track negotiation success rates, final prices, buyer satisfaction
8. **Customization**: Allow sellers to customize negotiation preferences and rules

---

## Support

For issues or questions:
1. Check that `.env` file has valid `OPENROUTER_API_KEY`
2. Verify all required request fields are provided
3. Run `test_api.py` to verify API is working
4. Check error messages for specific details
