#!/bin/bash

# DealScout Startup Script
# Starts all required services: MongoDB, Backend APIs, and Frontend

set -e

echo "🚀 Starting DealScout Services..."
echo ""

# Kill any existing processes
echo "🛑 Stopping any existing services..."
pkill -f "python api_server.py" 2>/dev/null || true
pkill -f "python db_api.py" 2>/dev/null || true
pkill -f "mongod" 2>/dev/null || true
sleep 2

# Start MongoDB
echo "📦 Starting MongoDB..."
mkdir -p /tmp/mongodb_data
mongod --dbpath /tmp/mongodb_data --quiet &
MONGO_PID=$!
sleep 2
echo "✓ MongoDB started (PID: $MONGO_PID)"
echo ""

# Seed the database
echo "🌱 Seeding test data..."
python db.py
echo ""

# Start Backend API
echo "🔌 Starting Backend API (port 8000)..."
python api_server.py &
API_PID=$!
sleep 2
echo "✓ API Server started (PID: $API_PID)"
echo ""

# Start Database API
echo "🗄️  Starting Database API (port 8001)..."
python db_api.py &
DB_API_PID=$!
sleep 2
echo "✓ Database API started (PID: $DB_API_PID)"
echo ""

# Start Frontend
echo "⚛️  Starting Next.js Frontend (port 3000)..."
cd frontend
# Install dependencies with legacy peer deps flag (for React 19 compatibility)
npm install --legacy-peer-deps > /dev/null 2>&1
npm run dev &
FRONTEND_PID=$!
sleep 3
echo "✓ Frontend started (PID: $FRONTEND_PID)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ DealScout is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Frontend:      http://localhost:3000"
echo "🔌 Backend API:   http://localhost:8000"
echo "🗄️  Database API:  http://localhost:8001"
echo ""
echo "📝 Process IDs:"
echo "   MongoDB:      $MONGO_PID"
echo "   Backend API:  $API_PID"
echo "   Database API: $DB_API_PID"
echo "   Frontend:     $FRONTEND_PID"
echo ""
echo "To stop all services, press Ctrl+C"
echo ""

# Keep script running
wait
