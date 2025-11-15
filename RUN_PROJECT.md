# 🚀 DealScout - Quick Start Guide

## Integrated Frontend + Backend Project

The DealScout project now has everything integrated in one folder:

```
DealScout/
├── api_server.py          # FastAPI backend
├── buyer_agent.py         # Buyer AI agent
├── seller_agent.py        # Seller AI agent
├── negotiate.py           # CLI negotiation script
├── requirements.txt       # Python dependencies
├── start.bat              # Windows startup script
├── start.sh               # Unix/Mac startup script
└── frontend/              # Next.js frontend
    ├── app/               # Pages
    ├── components/        # React components
    ├── lib/               # API & utilities
    └── package.json       # Node dependencies
```

## ⚡ Quick Start (Recommended)

### Option 1: Automatic Startup (Easiest)

**Windows:**
```cmd
set OPENROUTER_API_KEY=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
start.bat
```

**Mac/Linux:**
```bash
export OPENROUTER_API_KEY=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
chmod +x start.sh
./start.sh
```

This will:
1. Install Python dependencies
2. Install Node dependencies
3. Start backend on http://localhost:8000
4. Start frontend on http://localhost:3000
5. Open browser automatically

### Option 2: Manual Startup

**1. Start the Backend:**
```powershell
$env:OPENROUTER_API_KEY='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'
$env:PYTHONIOENCODING='utf-8'
python api_server.py
```

**2. In a new terminal, start the Frontend:**
```cmd
cd frontend
npm run dev
```

**3. Open in Browser:**
```
http://localhost:3000
```

## 🎯 What You Can Do

### 1. Buyer View
- Browse bike listings
- Use AI agent: "Find bikes under $1000 within 5 miles"
- Select multiple items
- Click "Negotiate for Selected"
- Watch AI agents negotiate in real-time!
- View full conversation transcript
- See price savings

### 2. Test CLI Negotiation
```powershell
$env:OPENROUTER_API_KEY='your-key'
$env:PYTHONIOENCODING='utf-8'
python negotiate.py
```

### 3. Test API Directly
```bash
# Health check
curl http://localhost:8000/

# Parse natural language
curl -X POST http://localhost:8000/agent/parse -H "Content-Type: application/json" -d "{\"query\":\"bikes under $1000\"}"

# Run negotiation
curl -X POST http://localhost:8000/negotiation -H "Content-Type: application/json" -d "{\"listing_ids\":[\"listing-1\"]}"
```

## 📦 Architecture

```
User Browser (localhost:3000)
        ↓
   Next.js Frontend
        ↓
  FastAPI Backend (localhost:8000)
        ↓
  AI Agents (buyer_agent.py, seller_agent.py)
        ↓
  OpenRouter API (Claude Sonnet 3.5)
```

## 🔧 Troubleshooting

### Backend won't start
- **Problem:** `OPENROUTER_API_KEY not set`
- **Solution:** Set the API key in environment variable

### Frontend can't connect
- **Problem:** `Connection refused` or `API error`
- **Solution:** Ensure backend is running on port 8000
-Check: `curl http://localhost:8000/`

### Unicode errors
- **Problem:** Emoji encoding errors
- **Solution:** Set `$env:PYTHONIOENCODING='utf-8'`

### Port already in use
- **Problem:** `Address already in use`
- **Solution:** Kill the process:
  ```powershell
  # Find the process
  netstat -ano | findstr :8000
  # Kill it (replace PID)
  taskkill /F /PID <PID>
  ```

## 📄 Additional Documentation

- `README_INTEGRATION.md` - Detailed integration guide
- `API_DOCUMENTATION.md` - API endpoints reference
- `frontend/README.md` - Frontend documentation

## 🎉 Demo Flow

1. Open http://localhost:3000
2. Click "Shop as Buyer"
3. Type: "bikes under $1000"
4. Select "Trek Mountain Bike"
5. Click "Negotiate for Selected (1)"
6. Wait 10-30 seconds for AI negotiation
7. View results: negotiated price, savings, and full conversation!

---

**Need Help?**
- Check backend terminal for errors
- Check frontend terminal for React errors
- Check browser console (F12) for API errors
- Verify OpenRouter API key is valid and has credits

**Ready to go?**
```powershell
set OPENROUTER_API_KEY=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
start.bat
```

🚀 **Happy negotiating!**

