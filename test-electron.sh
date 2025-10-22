#!/bin/bash

echo "======================================================"
echo "  🖥️  TESTING ELECTRON APP DIRECTLY"
echo "======================================================"
echo ""
echo "This will run the Electron app directly for testing..."
echo ""

# Check if we're in the right directory
if [ ! -f "electron/main.js" ]; then
    echo "❌ Error: Please run this from the project root directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if client is built
if [ ! -d "client/build" ]; then
    echo "🔨 Building client..."
    cd client
    npm install
    npm run build
    cd ..
fi

echo "🚀 Starting Electron app..."
echo "   - This will open the actual desktop app"
echo "   - Open DevTools with Cmd+Option+I"
echo "   - Check console for Electron detection logs"
echo ""

# Run Electron directly
npx electron electron/main.js
