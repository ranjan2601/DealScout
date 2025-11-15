#!/bin/bash
# DealScout Full Stack Startup Script for Unix/Linux/Mac
# This script starts both the FastAPI backend and Next.js frontend

echo "========================================"
echo "  DealScout - AI Negotiation System"
echo "========================================"
echo ""

# Check if API key is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "WARNING: OPENROUTER_API_KEY environment variable is not set!"
    echo "Please set it before running the backend."
    echo ""
    read -p "Enter your OpenRouter API key (or press Enter to skip): " API_KEY
    if [ -n "$API_KEY" ]; then
        export OPENROUTER_API_KEY="$API_KEY"
    fi
fi

echo ""
echo "[1/4] Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Python dependencies"
    exit 1
fi

echo ""
echo "[2/4] Installing Frontend dependencies..."
cd "../Frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install npm dependencies"
        cd "../Agent/DealScout"
        exit 1
    fi
else
    echo "npm packages already installed, skipping..."
fi
cd "../Agent/DealScout"

echo ""
echo "[3/4] Starting FastAPI Backend on http://localhost:8000..."
export PYTHONIOENCODING=utf-8
python api_server.py > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

echo "Waiting for backend to start..."
sleep 3

echo ""
echo "[4/4] Starting Next.js Frontend on http://localhost:3000..."
cd "../Frontend"
npm run dev > ../Agent/DealScout/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

cd "../Agent/DealScout"

echo ""
echo "========================================"
echo "  Services Started Successfully!"
echo "========================================"
echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo ""
echo "  Backend PID:  $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop the services, run:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Opening frontend in browser..."
sleep 2

# Try to open browser (cross-platform)
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000
elif command -v open > /dev/null; then
    open http://localhost:3000
else
    echo "Please open http://localhost:3000 in your browser"
fi

echo ""
echo "Press Ctrl+C to view logs, or run 'tail -f backend.log' / 'tail -f frontend.log'"

