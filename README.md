# DealScout - AI-Powered Marketplace Negotiation Engine

An intelligent negotiation platform that uses AI agents to autonomously negotiate prices on behalf of buyers and sellers in a peer-to-peer marketplace.

## Overview

DealScout enables realistic, human-like price negotiations between buyers and sellers using autonomous AI agents powered by Claude Sonnet 4.5. The system conducts multi-turn negotiations with natural conversation, market-aware pricing strategies, intelligent concessions, and LLM-powered database queries.

**Key Features:**
- 🤖 Autonomous AI agents (buyer and seller) that negotiate naturally
- 💬 Multi-turn conversational negotiation (up to 8 turns)
- 📊 Market-aware pricing using comparable listings
- 💰 Real-time offer generation with confidence scores
- 🔍 LLM-powered smart search with natural language queries
- 📈 Deal success tracking with savings calculation
- 🌐 Parallel multi-product negotiations with streaming updates
- 📱 Full-stack application with React frontend

## Project Structure

```
HackNYU/
├── api_server.py                # FastAPI server with SSE streaming
├── buyer_agent.py               # Autonomous buyer agent
├── seller_agent.py              # Autonomous seller agent
├── seed_db.py                   # MongoDB database seeding script
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (not in repo)
├── .env.example                 # Example environment config
├── frontend/                    # Next.js React application
│   ├── app/
│   │   ├── buyer/              # Buyer pages
│   │   ├── seller/             # Seller pages
│   │   └── page.tsx            # Landing page
│   └── components/             # Reusable UI components
└── README.md                    # This file
```

## Tech Stack

**Backend:**
- Python 3.8+
- FastAPI with async/await
- MongoDB for data persistence
- Claude Sonnet 4.5 via OpenRouter API
- Server-Sent Events (SSE) for real-time streaming

**Frontend:**
- Next.js 14 (React)
- TypeScript
- Tailwind CSS
- Real-time streaming event handlers

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Set Up Environment

Create a `.env` file in the project root:

```
OPENROUTER_API_KEY=your_api_key_here
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=dealscout
```

Get your OpenRouter API key from [OpenRouter](https://openrouter.ai/).

### 3. Start MongoDB

```bash
# Create data directory
mkdir -p /tmp/mongodb_data

# Start MongoDB
mongod --dbpath /tmp/mongodb_data

# In another terminal, seed the database
python seed_db.py
```

### 4. Start the Backend API Server

```bash
python api_server.py
```

The API server runs on `http://localhost:8000`

### 5. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend runs on `http://localhost:3000`

## API Endpoints

### Search & Negotiate
- **POST** `/api/buyer/search` - Search listings and run parallel AI negotiations
  - Stream-based (Server-Sent Events)
  - Finds matching products
  - Negotiates with all matching sellers
  - Returns best deal recommendation

### Request Format
```json
{
  "search_query": "mountain bike under 1000",
  "max_budget": 1000,
  "top_n": 5
}
```

### Response Events
- `status` - Progress updates (searching, negotiating, analyzing)
- `products_found` - List of matching products
- `negotiation_start` - Negotiation started for a product
- `negotiation_message` - Individual conversation messages
- `negotiation_complete` - Negotiation finished with result
- `best_deal` - Final recommendation
- `error` - Any errors encountered

## System Architecture

### Smart Search with LLM

The search system uses an LLM to convert natural language queries into MongoDB filters:
- "mountain bike under 1000" → MongoDB query with regex and price constraints
- Handles product variations and synonyms
- Extracts price constraints automatically
- Falls back to simple regex if parsing fails

### Parallel Negotiations

When searching:
1. **Search Phase**: Use LLM-generated MongoDB queries to find matching products
2. **Negotiation Phase**: Simultaneously negotiate with all found sellers
3. **Analysis Phase**: Compare results and recommend best deal
4. **Streaming**: Real-time updates to frontend via SSE

### AI Agents

**Buyer Agent** (`buyer_agent.py`):
- Makes realistic incremental offers
- References platform data to justify prices
- Respects budget constraints
- Can accept, counter, reject, or walk away
- 30-second timeout to prevent hanging

**Seller Agent** (`seller_agent.py`):
- Responds strategically to buyer offers
- Enforces minimum acceptable price
- Adapts negotiation strategy by turn number
- Uses market data to defend asking price
- 30-second timeout to prevent hanging

**Negotiation Orchestrator** (`api_server.py`):
- Manages turn-based negotiation loop (up to 8 turns)
- Passes full context to each agent
- Handles deal completion and conflicts
- Formats and returns results with savings calculation

## Example Usage

### Search and Negotiate (with streaming)

```javascript
// Frontend example with streaming
const eventSource = new EventSource(
  'http://localhost:8000/api/buyer/search',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      search_query: 'mountain bike under 1000',
      max_budget: 1000,
      top_n: 5
    })
  }
);

eventSource.addEventListener('products_found', (event) => {
  const products = JSON.parse(event.data).data;
  console.log('Found products:', products);
});

eventSource.addEventListener('negotiation_complete', (event) => {
  const result = JSON.parse(event.data).result;
  console.log('Negotiation result:', result);
});

eventSource.addEventListener('best_deal', (event) => {
  const best = JSON.parse(event.data).data;
  console.log('Best deal:', best);
});
```

## Database Schema

### Products (sellers collection)

```json
{
  "seller_id": "seller_001",
  "item_id": "bike_001",
  "product_detail": "Trek X-Caliber 8 Mountain Bike 27.5\" 2022",
  "description": "Well-maintained mountain bike with disc brakes and suspension",
  "category": "Sports & Outdoors",
  "asking_price": 850,
  "min_selling_price": 750,
  "condition": "good",
  "location": "New York, NY",
  "zip_code": "10001",
  "extras": ["helmet", "lock"],
  "created_at": "2025-11-16T04:11:01.027Z",
  "updated_at": "2025-11-16T04:11:01.027Z",
  "status": "active"
}
```

## Known Issues & Solutions

### DateTime JSON Serialization
- **Issue**: MongoDB datetime objects not serializable to JSON
- **Solution**: Convert to ISO format strings (lines 1099-1102 in api_server.py)

### Only 1 Product Negotiating
- **Issue**: When finding multiple products, only 1 would negotiate
- **Solution**: Completely reimplemented negotiation loop with:
  - Explicit index-based iteration
  - Comprehensive error handling per product
  - Guaranteed result collection for all products
  - Continue-on-error logic to process remaining items

### API Timeouts
- **Issue**: Indefinite hanging on API calls
- **Solution**: Added 30-second timeout to all HTTP requests in buyer_agent.py and seller_agent.py

## Configuration

### Environment Variables

```env
OPENROUTER_API_KEY      # Required: Claude API access
MONGODB_URI             # MongoDB connection string (default: mongodb://localhost:27017)
DATABASE_NAME           # Database name (default: dealscout)
PORT                    # Server port (default: 8000)
```

### Negotiation Parameters

Modify in `api_server.py`:
- `MAX_TURNS`: Maximum negotiation turns (default: 8)
- Buyer budget override in request
- Seller minimum/asking prices from database

## How It Works

### 1. Search Phase

1. User enters natural language query: "mountain bike under 1000"
2. LLM converts to MongoDB filter: `{"product_detail": {"$regex": "bike"}, "asking_price": {"$lte": 1000}}`
3. Search returns all matching products (e.g., 3 mountain bikes)
4. Frontend receives product list via SSE

### 2. Negotiation Phase

For each found product:
1. Initialize buyer/seller preferences and market data
2. Run negotiation loop (alternating turns):
   - **Turn 1**: Buyer makes initial offer
   - **Turn 2**: Seller responds
   - Continue until deal reached or max turns
3. Return result with final price and savings

### 3. Analysis Phase

1. Compare all negotiation results
2. Calculate best deal (highest savings or fairest price)
3. Stream final recommendation to frontend

## Testing

Test with sample data:

```bash
# Seed database with 6 test products
python seed_db.py

# Test search with one product
curl -X POST http://localhost:8000/api/buyer/search \
  -H "Content-Type: application/json" \
  -d '{"search_query": "macbook", "max_budget": 1000}'

# Test with multiple products
curl -X POST http://localhost:8000/api/buyer/search \
  -H "Content-Type: application/json" \
  -d '{"search_query": "bike under 1000", "max_budget": 1000}'
```

Sample products in database:
- 3 Mountain Bikes (Trek, Giant, Specialized) - $750-$920
- 3 Electronics (MacBook Air, PS5, iPad) - $450-$950

## Performance Optimizations

- **Streaming**: SSE for real-time updates without polling
- **Rate Limiting**: 0.5s delay between negotiations to prevent API throttling
- **Error Resilience**: Comprehensive error handling to continue processing remaining items
- **Async/Await**: Non-blocking I/O in FastAPI

## Future Enhancements

- [ ] Real-time WebSocket instead of SSE
- [ ] Negotiation history and analytics
- [ ] User authentication and profiles
- [ ] Payment integration
- [ ] Email notifications
- [ ] Advanced search filters
- [ ] Seller dashboard with analytics
- [ ] Multi-language support

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod --dbpath /tmp/mongodb_data
```

### API Key Invalid
- Verify `OPENROUTER_API_KEY` in `.env`
- Get new key from [OpenRouter](https://openrouter.ai/)
- Restart API server after updating

### No Products Found
- Check database is seeded: `python seed_db.py`
- Try simpler search: "bike" instead of specific model
- Check product data in MongoDB: `mongosh`

## License

MIT License - Feel free to use and modify for your projects

## Contributing

Contributions welcome! Areas for improvement:
- Additional marketplace features
- Agent prompt optimization
- Performance improvements
- Bug fixes and reliability enhancements

## Contact & Support

For issues or questions:
1. Check `.env` has valid `OPENROUTER_API_KEY`
2. Verify MongoDB is running: `mongod --dbpath /tmp/mongodb_data`
3. Run `python seed_db.py` to populate database
4. Check API logs for detailed error messages

---

Built with ❤️ for HackNYU 2024
