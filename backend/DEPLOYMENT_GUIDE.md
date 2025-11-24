# Backend v2.0 - Deployment & Startup Guide

## ✅ Refactoring Complete

All redundant old files have been deleted. Only the clean, refactored architecture remains.

### Deleted Files
```
✓ api.py (replaced by backend/main.py + backend/api/*)
✓ buyer_agent.py (replaced by backend/agents/buyer_agent.py)
✓ seller_agent.py (replaced by backend/agents/seller_agent.py)
✓ contract_generator.py (replaced by backend/services/contract/generator.py)
✓ pdf_contract_generator.py (replaced by backend/services/contract/pdf_generator.py)
✓ db.py (replaced by backend/db/models.py + backend/db/mongo.py)
✓ db_api.py (replaced by backend/api/listings.py + backend/api/negotiation.py)
✓ seed_db.py (legacy - can be recreated if needed)
```

### Clean Backend Structure
```
backend/
├── main.py                    ← FastAPI entrypoint
├── config/settings.py         ← Environment configuration
├── api/                       ← Routes (health, negotiation, listings, offers)
├── agents/                    ← Buyer/Seller AI agents
├── core/                      ← Negotiation orchestrator
├── db/                        ← MongoDB connection + models + repositories
├── services/                  ← Business logic (contract, logging, SSE)
└── utils/                     ← Utilities (price, formatters, validators)
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Create `.env` file in project root
```bash
cat > .env << 'EOF'
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=False
RELOAD=True

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=dealscout

# LLM / OpenRouter
OPENROUTER_API_KEY=your_api_key_here

# Logging
LOG_LEVEL=INFO
EOF
```

### Step 2: Ensure dependencies are installed
```bash
pip install -r backend/requirements-backend.txt
```

### Step 3: Start the backend
```bash
# Development mode (with auto-reload)
python -m uvicorn backend.main:app --reload

# Or production mode
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4

# Or using Python directly
cd backend
python main.py
```

---

## ✅ Verify Backend is Running

### Check Health
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "DealScout Backend",
  "version": "2.0.0",
  "timestamp": "2024-11-23T10:30:45.123456"
}
```

### View API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Run Smoke Tests
```bash
python backend/smoke_test.py
```

---

## 📋 Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host address |
| `PORT` | `8000` | Server port |
| `DEBUG` | `False` | Enable debug mode |
| `RELOAD` | `True` | Auto-reload on code changes |
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB_NAME` | `dealscout` | Database name |
| `OPENROUTER_API_KEY` | `` | OpenRouter API key (required for negotiation) |
| `OPENROUTER_MODEL` | `anthropic/claude-3-5-sonnet-20241022` | LLM model to use |
| `MAX_NEGOTIATION_TURNS` | `8` | Max turns per negotiation |
| `PRICE_CONVERGENCE_THRESHOLD` | `20.0` | Price gap threshold ($) |
| `BUYER_BUDGET_MULTIPLIER` | `0.95` | Buyer's max budget multiplier |
| `SELLER_MINIMUM_MULTIPLIER` | `0.88` | Seller's minimum multiplier |
| `LLM_TEMPERATURE` | `0.7` | LLM response temperature (0.0-1.0) |
| `LLM_TIMEOUT_SECONDS` | `30` | LLM API timeout |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |

---

## 🔌 Start MongoDB

### Local MongoDB
```bash
# Windows - if MongoDB is installed
mongod

# Or using Docker
docker run -d --name dealscout-mongodb -p 27017:27017 mongo:latest
```

### MongoDB Atlas (Cloud)
Update `.env`:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dealscout?retryWrites=true&w=majority
```

---

## 🧪 API Testing Examples

### Health Check
```bash
curl http://localhost:8000/health
```

### Start Negotiation
```bash
curl -X POST http://localhost:8000/negotiation/start \
  -H "Content-Type: application/json" \
  -d '{"listing_ids": ["item_123"], "buyer_budget": 500}'
```

### Stream Negotiation (SSE)
```bash
curl -X POST http://localhost:8000/negotiation/stream \
  -H "Content-Type: application/json" \
  -d '{"listing_ids": ["item_123"]}'
```

### Parse Query
```bash
curl -X POST http://localhost:8000/negotiation/parse \
  -H "Content-Type: application/json" \
  -d '{"query": "Find me a bike under $500"}'
```

### List Products
```bash
curl http://localhost:8000/listings/
```

### Search Products
```bash
curl "http://localhost:8000/listings/search/products?q=bike&limit=10"
```

---

## 📊 Backend Architecture

### Request Flow
```
Client Request
    ↓
FastAPI Router (api/*.py)
    ↓
Dependency Injection (get_db)
    ↓
Pydantic Validation
    ↓
Business Logic (agents, services, core)
    ↓
Database (repositories, mongo.py)
    ↓
Response/Stream
```

### Negotiation Flow
```
NegotiationLoop.run_negotiation()
    ↓
Initialize State & Platform Data
    ↓
Loop: Turn 1-8
    ├─→ BuyerAgent.generate_response() → LLM Call
    ├─→ SellerAgent.generate_response() → LLM Call
    ├─→ Check: Deal reached? | Walk away? | Max turns?
    └─→ Continue to next turn
    ↓
Return NegotiationResult
```

---

## 🛠️ Troubleshooting

### Issue: Backend won't start
```bash
# Check Python version
python --version  # Should be 3.9+

# Install missing dependencies
pip install -r backend/requirements-backend.txt

# Check .env file
cat .env
```

### Issue: MongoDB connection error
```bash
# Verify MongoDB is running
# Check connection string in .env
# Test connection: python -c "from pymongo import MongoClient; MongoClient('mongodb://localhost:27017').admin.command('ping')"
```

### Issue: LLM API errors
```bash
# Verify API key is set
echo $OPENROUTER_API_KEY

# Check API endpoint is accessible
curl https://openrouter.ai/api/v1/models -H "Authorization: Bearer YOUR_KEY"
```

### Issue: Port already in use
```bash
# Use different port
python -m uvicorn backend.main:app --port 8001
```

### Enable Debug Logging
```bash
# In .env
LOG_LEVEL=DEBUG

# Or start with debug
python -m uvicorn backend.main:app --log-level debug
```

---

## 🚀 Deployment Options

### Local Development
```bash
python -m uvicorn backend.main:app --reload
```

### Production (Gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app
```

### Production (Docker)
```dockerfile
FROM python:3.9
WORKDIR /app
COPY backend/requirements-backend.txt .
RUN pip install -r requirements-backend.txt
COPY . .
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t dealscout-backend .
docker run -p 8000:8000 --env-file .env dealscout-backend
```

### Production (Kubernetes)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dealscout-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dealscout-backend
  template:
    metadata:
      labels:
        app: dealscout-backend
    spec:
      containers:
      - name: backend
        image: dealscout-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: dealscout-secrets
              key: mongo-uri
        - name: OPENROUTER_API_KEY
          valueFrom:
            secretKeyRef:
              name: dealscout-secrets
              key: openrouter-api-key
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README-REFACTORED.md` | Architecture and design patterns |
| `REFACTORING_SUMMARY.md` | Complete refactoring overview |
| `DEPLOYMENT_GUIDE.md` | This file - startup and deployment |
| `smoke_test.py` | Automated API testing script |

---

## 🎯 What's Next?

1. ✅ **Now**: Run backend - `python -m uvicorn backend.main:app --reload`
2. ✅ **Test**: Open http://localhost:8000/docs for API docs
3. ✅ **Verify**: Run `python backend/smoke_test.py`
4. ⏭️ **Connect Frontend**: Update frontend API client to use new endpoints
5. ⏭️ **Add Database**: Seed MongoDB with test products
6. ⏭️ **Production**: Deploy using Docker or Kubernetes

---

## 📞 Quick Reference

```bash
# Start backend (dev)
python -m uvicorn backend.main:app --reload

# Start backend (prod)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4

# Run tests
python backend/smoke_test.py

# View logs
tail -f backend.log

# Check MongoDB
mongosh

# Check API
curl http://localhost:8000/health
```

---

**Backend Status**: ✅ Ready for Development & Production  
**Version**: 2.0.0  
**Last Updated**: November 2024

🎉 Happy Coding!
