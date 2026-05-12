#!/bin/bash

# Workshop Registration System - Quick Start Script
# Starts both frontend and backend servers

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Workshop Registration System - Quick Start                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if servers are already running
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use (frontend might be running)"
else
    echo "✅ Port 3000 is available"
fi

BACKEND_PORT=$(grep -E '^PORT=' server/.env 2>/dev/null | cut -d '=' -f2)
BACKEND_PORT=${BACKEND_PORT:-5000}

if lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
    echo "⚠️  Port $BACKEND_PORT is already in use (backend might be running)"
else
    echo "✅ Port $BACKEND_PORT is available"
fi

echo ""
echo "📋 Checking configuration files..."
echo ""

# Check .env files
if [ ! -f "server/.env" ]; then
    echo "❌ server/.env not found"
    echo "   Run: bash setup.sh"
    exit 1
else
    echo "✅ server/.env exists"
fi

if [ ! -f "client/.env" ]; then
    echo "❌ client/.env not found"
    echo "   Run: bash setup.sh"
    exit 1
else
    echo "✅ client/.env exists"
fi

echo ""
echo "🚀 Starting servers..."
echo ""

# Start backend in background
echo "Starting backend (port $BACKEND_PORT)..."
cd server
npm run dev > ../server.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend (port 3000)..."
cd client
npm run dev
FRONTEND_PID=$!

# Handle cleanup
trap "kill $BACKEND_PID" EXIT
