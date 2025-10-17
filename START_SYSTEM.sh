#!/bin/bash

echo "🚀 Starting Restaurant POS System..."
echo ""

# Kill any existing processes
echo "📋 Cleaning up old processes..."
lsof -ti:5002 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
pkill -9 -f "serve -s" 2>/dev/null
sleep 2

# Start backend
echo "🔧 Starting Backend (Port 5002)..."
cd /Users/admin/restaurant-billing-system
node server.js > server.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Check if backend started
if lsof -i:5002 | grep -q LISTEN; then
    echo "✅ Backend started successfully (PID: $BACKEND_PID)"
else
    echo "❌ Backend failed to start. Check server.log for errors."
    exit 1
fi

# Start frontend
echo "🎨 Starting Frontend (Port 3000)..."
cd /Users/admin/restaurant-billing-system/client
npx serve -s build -l 3000 > /dev/null 2>&1 &
FRONTEND_PID=$!
sleep 3

# Check if frontend started
if lsof -i:3000 | grep -q LISTEN; then
    echo "✅ Frontend started successfully (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend failed to start."
    exit 1
fi

echo ""
echo "🎉 =================================="
echo "   Restaurant POS System is Ready!"
echo "===================================="
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:5002"
echo ""
echo "🔑 Login Credentials:"
echo "   Cashier: cashier / cashier123"
echo "   Admin:   admin / admin123"
echo "   Owner:   owner / owner123"
echo "   Chef:    chef / chef123"
echo ""
echo "📝 Logs:"
echo "   Backend: /Users/admin/restaurant-billing-system/server.log"
echo ""
echo "🛑 To stop: pkill -9 node"
echo ""


