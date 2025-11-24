# DealScout Backend

This folder contains the FastAPI backend for DealScout. It's packaged so the backend can be deployed separately from the Next.js frontend.

Contents:
- `api.py` - main FastAPI app (negotiation endpoints, SSE streaming, contract generator)
- `db.py` - MongoDB helpers and models
- `db_api.py` - seller/buyer CRUD endpoints and AI search
- `requirements-backend.txt` - Python dependencies to install for the backend
- `start_backend.ps1` - PowerShell helper script to run the backend locally

Quick start (Windows PowerShell):

1. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install Python dependencies

```powershell
pip install -r backend/requirements-backend.txt
```

3. Create a `.env` file in the repo root or backend/ with the following values:

```
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=dealscout
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

4. Start MongoDB (locally) and seed data (optional):

- Run MongoDB (e.g., using `mongod --dbpath <path>`), then run the seed script if desired (the project root contains `seed_db.py`).

5. Start backend (PowerShell):

```powershell
cd <project-root>
.\backend\start_backend.ps1
```

The backend will run on http://localhost:8000 by default.

Notes:
- The API expects the frontend to call endpoints like `/negotiation`, `/negotiation/stream`, and `/agent/parse`.
- If you deploy backend separately ensure `NEXT_PUBLIC_API_BASE_URL` in the frontend points to your backend URL.
- Consider running `db_api.py` as a separate process if you want DB CRUD endpoints on a different port.

Next steps you might want me to do:
- Wire `buyer_agent.py`, `seller_agent.py`, `contract_generator.py`, and `pdf_contract_generator.py` into `backend/` (copy them in) so the backend package is self-contained.
- Add a small smoke-test script that calls `/` and `/api/health` to verify the backend runs.
- Create a dockerfile for backend deployment.
