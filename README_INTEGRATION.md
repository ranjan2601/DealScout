# DealScout Integration Guide

This document explains how the DealScout Python negotiation agents are integrated with the Next.js frontend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
│                  (http://localhost:3000)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Frontend                           │
│                                                               │
│  • Role Selection (Buyer/Seller)                            │
│  • Listing Grid & Filters                                   │
│  • AI Agent Query Parser                                    │
│  • Negotiation UI                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (api_server.py)                 │
│                 (http://localhost:8000)                      │
│                                                               │
│  • POST /negotiation - Run AI negotiations                  │
│  • POST /agent/parse - Parse natural language               │
│  • GET  /            - Health check                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Function Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            Python Negotiation Agents                         │
│                                                               │
│  • buyer_agent.py   - AI Buyer Logic                        │
│  • seller_agent.py  - AI Seller Logic                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  OpenRouter API                              │
│              (Claude Sonnet 3.5 AI)                          │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
HackNYU 2026/
├── Agent/
│   └── DealScout/              # Python Backend
│       ├── api_server.py       # FastAPI server
│       ├── buyer_agent.py      # Buyer AI agent
│       ├── seller_agent.py     # Seller AI agent
│       ├── negotiate.py        # CLI negotiation script
│       ├── requirements.txt    # Python dependencies
│       ├── start.bat           # Windows startup script
│       ├── start.sh            # Unix/Linux/Mac startup script
│       └── README_INTEGRATION.md
│
└── Frontend/                   # Next.js Frontend
    ├── app/                    # Next.js pages
    │   ├── buyer/page.tsx      # Buyer marketplace
    │   ├── seller/page.tsx     # Seller portal
    │   └── page.tsx            # Role selection
    ├── components/             # React components
    ├── lib/
    │   ├── api.ts             # API client (UPDATED)
    │   ├── types.ts           # TypeScript types
    │   └── mockData.ts        # Mock listings
    └── package.json
```

## API Endpoints

### 1. POST /negotiation

Run AI-powered negotiations for selected listings.

**Request:**
```json
{
  "listing_ids": ["listing-1", "listing-2"]
}
```

**Response:**
```json
[
  {
    "listing_id": "listing-1",
    "original_price": 1200.0,
    "negotiated_price": 1080.0,
    "status": "success",
    "savings": 120.0,
    "messages": [
      {
        "role": "system",
        "content": "Negotiation started..."
      },
      {
        "role": "buyer",
        "content": "Hi! I'm interested..."
      },
      {
        "role": "seller",
        "content": "Thanks for your interest..."
      }
    ]
  }
]
```

### 2. POST /agent/parse

Parse natural language queries into structured filters.

**Request:**
```json
{
  "query": "Find bikes under $1000 within 5 miles"
}
```

**Response:**
```json
{
  "maxPrice": 1000,
  "maxDistance": 5,
  "minPrice": null,
  "selectedConditions": null,
  "selectedBrands": null
}
```

### 3. GET /

Health check endpoint.

**Response:**
```json
{
  "status": "online",
  "service": "DealScout Negotiation API",
  "version": "1.0.0"
}
```

## Setup Instructions

### Prerequisites

1. **Python 3.8+** with pip
2. **Node.js 18+** with npm
3. **OpenRouter API Key** from https://openrouter.ai/

### Step 1: Set API Key

**Windows (PowerShell):**
```powershell
$env:OPENROUTER_API_KEY='your-api-key-here'
```

**Windows (Command Prompt):**
```cmd
set OPENROUTER_API_KEY=your-api-key-here
```

**Unix/Linux/Mac:**
```bash
export OPENROUTER_API_KEY='your-api-key-here'
```

### Step 2: Install Dependencies

**Backend:**
```bash
cd "C:\Users\User\Desktop\HackNYU 2026\Agent\DealScout"
pip install -r requirements.txt
```

**Frontend:**
```bash
cd "C:\Users\User\Desktop\HackNYU 2026\Frontend"
npm install
```

### Step 3: Run the System

**Option A: Use Startup Scripts (Recommended)**

**Windows:**
```cmd
cd "C:\Users\User\Desktop\HackNYU 2026\Agent\DealScout"
start.bat
```

**Unix/Linux/Mac:**
```bash
cd ~/Desktop/HackNYU\ 2026/Agent/DealScout
chmod +x start.sh
./start.sh
```

**Option B: Manual Startup**

1. Start the backend:
```bash
cd "C:\Users\User\Desktop\HackNYU 2026\Agent\DealScout"
python api_server.py
```

2. In a new terminal, start the frontend:
```bash
cd "C:\Users\User\Desktop\HackNYU 2026\Frontend"
npm run dev
```

3. Open http://localhost:3000 in your browser

## How It Works

### 1. User Flow

1. User opens http://localhost:3000
2. Selects "Buyer" role
3. Views bike listings
4. Uses AI agent query: "Find bikes under $1000"
5. Selects listings for negotiation
6. Clicks "Negotiate for Selected"
7. Frontend calls `/negotiation` API
8. Backend runs buyer/seller AI negotiation
9. Results displayed with price savings and chat transcript

### 2. Negotiation Process

```python
# For each selected listing:
1. Backend creates buyer and seller contexts
2. Runs turn-by-turn negotiation (max 8 turns)
3. Buyer agent makes offers using Claude AI
4. Seller agent responds using Claude AI
5. Continues until:
   - Deal reached (accept)
   - Negotiation fails (reject/walk_away)
   - Max turns reached
6. Returns full conversation + final price
```

### 3. Frontend Integration

The `lib/api.ts` file was updated to call real API endpoints:

**Before (Mock):**
```typescript
export async function negotiateListings(listingIds: string[]) {
  // Mock data simulation
  return mockResults;
}
```

**After (Real API):**
```typescript
export async function negotiateListings(listingIds: string[]) {
  const response = await fetch(`${API_BASE_URL}/negotiation`, {
    method: "POST",
    body: JSON.stringify({ listing_ids: listingIds })
  });
  return await response.json();
}
```

## Features

✅ **Real-time AI Negotiation**
- Buyer and seller agents negotiate autonomously
- Uses Claude Sonnet 3.5 for natural language
- Market-aware pricing based on comparables

✅ **Natural Language Queries**
- "Find bikes under $1000 within 5 miles"
- Parses into structured filters
- Updates UI instantly

✅ **Multi-Listing Selection**
- Select multiple items
- Batch negotiation
- Parallel processing

✅ **Transparent Results**
- Full conversation transcript
- Price breakdown with savings
- Success/failure status

✅ **Fallback Support**
- If backend is down, uses mock data
- Graceful error handling
- No crashes

## Environment Variables

Create a `.env` file in the backend directory:

```env
OPENROUTER_API_KEY=sk-or-v1-...
PORT=8000
```

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Troubleshooting

### Backend won't start

**Issue:** `OPENROUTER_API_KEY not set`

**Solution:** Set the environment variable before running:
```bash
$env:OPENROUTER_API_KEY='your-key-here'
python api_server.py
```

### Frontend can't connect to backend

**Issue:** `API error: 500` or connection refused

**Solution:**
1. Ensure backend is running on port 8000
2. Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
3. Verify CORS is enabled (should be by default)

### Unicode/Emoji errors

**Issue:** `UnicodeEncodeError` on Windows

**Solution:** Set encoding before running:
```bash
$env:PYTHONIOENCODING='utf-8'
python api_server.py
```

### Negotiation takes too long

**Issue:** Request times out

**Solution:** 
- Each negotiation can take 10-30 seconds (AI processing)
- Select fewer listings at once
- Check OpenRouter API status

## Testing

### Test Backend Directly

```bash
# Health check
curl http://localhost:8000/

# Parse query
curl -X POST http://localhost:8000/agent/parse \
  -H "Content-Type: application/json" \
  -d '{"query":"bikes under $1000"}'

# Run negotiation
curl -X POST http://localhost:8000/negotiation \
  -H "Content-Type: application/json" \
  -d '{"listing_ids":["listing-1"]}'
```

### Test Frontend

1. Open http://localhost:3000
2. Click "Shop as Buyer"
3. Type in agent query: "bikes under $1000"
4. Select a listing
5. Click "Negotiate for Selected"
6. View results in negotiation panel

## Performance

- **Negotiation Time:** 10-30 seconds per listing
- **Concurrent Negotiations:** Supports multiple
- **AI Model:** Claude Sonnet 3.5 (fast + accurate)
- **Caching:** None (real-time negotiations)

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Database integration for listings
- [ ] User authentication
- [ ] Negotiation history tracking
- [ ] Advanced AI prompt tuning
- [ ] Caching for repeated negotiations
- [ ] Rate limiting and quotas

## License

Part of HackNYU 2026 project.

---

**Need Help?**
- Backend issues: Check `api_server.py` logs
- Frontend issues: Check browser console
- AI issues: Verify OpenRouter API key and credits

