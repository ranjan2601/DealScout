# DealScout - AI-Powered Marketplace Negotiation Engine

An intelligent negotiation platform that uses AI agents to autonomously negotiate prices on behalf of buyers and sellers in a peer-to-peer marketplace.

## Overview

DealScout enables realistic, human-like price negotiations between buyers and sellers using autonomous AI agents powered by Claude Sonnet 4.5. The system conducts multi-turn negotiations with natural conversation, market-aware pricing strategies, and intelligent concessions.

**Key Features:**
- 🤖 Autonomous AI agents (buyer and seller) that negotiate naturally
- 💬 Multi-turn conversational negotiation (up to 10 turns)
- 📊 Market-aware pricing using comparable listings
- 💰 Real-time offer generation with confidence scores
- 🔍 Marketplace search with filters (category, location, budget)
- 📈 Deal success tracking with savings calculation

## Project Structure

```
HackNYU/
├── api.py                      # Flask REST API server
├── negotiate.py                # Negotiation orchestrator
├── buyer_agent.py              # Autonomous buyer agent
├── seller_agent.py             # Autonomous seller agent
├── test_api.py                 # API endpoint tests
├── API_DOCUMENTATION.md        # Complete API reference
├── FRONTEND_INTEGRATION.md     # Frontend integration guide
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (not in repo)
└── README.md                   # This file
```

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Environment

Create a `.env` file in the project root:

```
OPENROUTER_API_KEY=your_api_key_here
```

Get your API key from [OpenRouter](https://openrouter.ai/).

### 3. Start the API Server

```bash
python api.py
```

The server will run on `http://localhost:5000`

### 4. Test the API

In another terminal:

```bash
python test_api.py
```

## API Endpoints

### Search Listings
- **POST** `/api/search` - Search for marketplace listings
  - Query by category, location, max budget
  - Returns list of available items

### Start Negotiation
- **POST** `/api/negotiate` - Run AI negotiation for a listing
  - Provide buyer ID, budget, and listing ID
  - Returns negotiation result with final price and conversation history

### Health Check
- **GET** `/api/health` - Check if API is running

### Get Negotiation Details
- **GET** `/api/negotiation/<negotiation_id>` - Retrieve past negotiation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference with examples.

## System Architecture

### Data Flow

```
User Search
    ↓
/api/search endpoint
    ↓
Fetch listings from database
    ↓
Return matching listings
    ↓
User selects listing + enters budget
    ↓
/api/negotiate endpoint
    ↓
Fetch comparable listings & market stats
    ↓
Initialize negotiation state
    ↓
Run negotiation loop (buyer ↔ seller turns)
    ↓
Return final price + conversation history
```

### AI Agents

**Buyer Agent** (`buyer_agent.py`):
- Makes realistic incremental offers
- References platform data to justify prices
- Respects budget constraints
- Can accept, counter, reject, or walk away

**Seller Agent** (`seller_agent.py`):
- Responds strategically to buyer offers
- Enforces minimum acceptable price
- Adapts negotiation strategy by turn number
- Uses market data to defend asking price

**Negotiation Orchestrator** (`negotiate.py`):
- Manages turn-based negotiation loop
- Passes full context to each agent
- Handles deal completion and conflicts
- Formats and returns results

## Example Usage

### Search for Listings

```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "category": "bikes",
    "location": "Brooklyn, NY",
    "max_budget": 500
  }'
```

### Run Negotiation

```bash
curl -X POST http://localhost:5000/api/negotiate \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_id": "user_123",
    "buyer_budget": 450,
    "selected_listing_ids": ["bike_001"]
  }'
```

## Frontend Integration

DealScout provides a complete REST API for frontend integration. See [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) for:

- Step-by-step integration guide
- JavaScript/React examples
- HTML/CSS for UI components
- Negotiation conversation display
- Error handling and validation

## Configuration

### Environment Variables

- `OPENROUTER_API_KEY` (required) - API key for OpenRouter Claude access

### Negotiation Parameters

Edit `negotiate.py` to customize:

```python
PLATFORM_DATA       # Product info & comparable listings
BUYER_PREFS        # Buyer budget and target price
SELLER_PREFS       # Seller minimum and asking price
MAX_TURNS           # Maximum negotiation turns (default: 10)
```

## Example Output

When running a negotiation:

```
🤝 AI NEGOTIATION SYSTEM
======================================================================
Product: Trek Mountain Bike XL
Asking Price: $450
Platform Comps: 4 similar items (avg $450.0)
======================================================================

💬 TURN 1 - BUYER'S TURN
  💭 Buyer: Hey! I'm really interested in the Trek mountain bike...
  💰 Offer: $380.00
  👁️ Confidence: 70%

💬 TURN 2 - SELLER'S TURN
  💭 Seller: Hey! Thanks for the interest...
  💰 Offer: $430.00
  👁️ Confidence: 85%

[... more turns ...]

✅ DEAL REACHED!
Final Price: $420.00
Buyer saved: $30.00 (6.7% off asking)
Seller above minimum: $60.00
Negotiation completed in 5 turns
======================================================================
```

## How It Works

### 1. Buyer Agent Decision Making

The buyer agent:
1. Reviews product details and comparable listings
2. Checks conversation history and current market context
3. Determines appropriate offer (realistic incremental steps)
4. Decides action: counter, accept, reject, or walk away
5. Generates natural conversational message
6. Returns JSON with offer, action, message, and confidence

### 2. Seller Agent Decision Making

The seller agent:
1. Reviews buyer's current offer
2. Checks minimum acceptable price constraint
3. References comparable listings to defend price
4. Adapts strategy based on negotiation turn
5. Determines counter offer or acceptance
6. Generates natural conversational response
7. Returns JSON with decision, offer, message, and confidence

### 3. Negotiation Loop

The orchestrator:
1. Alternates between buyer and seller turns
2. Passes full negotiation state to each agent
3. Validates agent responses and enforces constraints
4. Detects deal completion (both parties accept same price)
5. Handles negotiation end (max turns, walk away, rejection)
6. Formats and returns final result

## Testing

Run the included test suite to verify API functionality:

```bash
python test_api.py
```

Tests cover:
- ✓ Health check endpoint
- ✓ Search listings with filters
- ✓ Missing field validation
- ✓ Negotiation workflow
- ✓ Multiple listing rejection
- ✓ 404 error handling

## Known Limitations

- Single-listing negotiation only (multi-listing coming soon)
- Mock database functions (need real DB integration)
- No persistent negotiation history yet
- No user authentication
- No WebSocket for real-time updates

## Future Enhancements

- [ ] Multi-listing simultaneous negotiation
- [ ] Multiple buyers with one seller
- [ ] Real database integration (PostgreSQL/MongoDB)
- [ ] User authentication and session management
- [ ] WebSocket support for real-time updates
- [ ] Negotiation analytics and success metrics
- [ ] Seller preference customization
- [ ] Automatic offer generation improvements

## Technology Stack

- **Backend**: Python 3.8+
- **Web Framework**: Flask 3.0+
- **LLM**: Claude Sonnet 4.5 via OpenRouter API
- **Testing**: Python unittest
- **Database**: Mock implementation (ready for real DB)

## Requirements

See `requirements.txt`:
- requests >= 2.31.0
- python-dotenv >= 1.0.0
- flask >= 3.0.0

## License

MIT License - feel free to use and modify for your projects

## Contributing

Contributions are welcome! Areas for improvement:
- Database integration
- Additional marketplace features
- Agent prompt optimization
- Frontend implementations
- Performance optimization

## Contact & Support

For issues or questions:
1. Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API details
2. Review [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) for frontend help
3. Run `test_api.py` to verify setup
4. Check `.env` file has valid API key

---

Built with ❤️ for HackNYU 2024
