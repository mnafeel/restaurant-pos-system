#!/bin/bash

# Restaurant POS System Startup Script

echo "========================================="
echo "  Restaurant POS System"
echo "========================================="
echo ""

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "Docker detected. Starting with Docker Compose..."
    echo ""
    
    # Check if docker-compose is available
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
        echo ""
        echo "✅ Services started successfully!"
        echo ""
        echo "Access points:"
        echo "  Web App:         http://localhost"
        echo "  API Server:      http://localhost:5002"
        echo "  Print Service:   http://localhost:5003"
        echo "  Kitchen Display: http://localhost:8080"
        echo ""
        echo "Default credentials:"
        echo "  Admin:    username=admin,   password=admin123"
        echo "  Cashier:  username=cashier, password=cashier123"
        echo "  Chef:     username=chef,    password=chef123"
        echo ""
        echo "To view logs: docker-compose logs -f"
        echo "To stop: docker-compose down"
    else
        echo "❌ docker-compose not found. Please install Docker Compose."
        exit 1
    fi
else
    echo "Docker not detected. Starting manually..."
    echo ""
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        npm install
    fi
    
    if [ ! -d "client/node_modules" ]; then
        echo "Installing frontend dependencies..."
        cd client && npm install && cd ..
    fi
    
    # Start services
    echo ""
    echo "Starting backend server..."
    node server.js &
    BACKEND_PID=$!
    
    echo "Starting print service..."
    node print-service.js &
    PRINT_PID=$!
    
    echo "Starting frontend..."
    cd client && npm start &
    FRONTEND_PID=$!
    cd ..
    
    echo ""
    echo "✅ Services started successfully!"
    echo ""
    echo "Access points:"
    echo "  Web App:         http://localhost:3000"
    echo "  API Server:      http://localhost:5002"
    echo "  Print Service:   http://localhost:5003"
    echo ""
    echo "Default credentials:"
    echo "  Admin:    username=admin,   password=admin123"
    echo "  Cashier:  username=cashier, password=cashier123"
    echo "  Chef:     username=chef,    password=chef123"
    echo ""
    echo "PIDs: Backend=$BACKEND_PID, Print=$PRINT_PID, Frontend=$FRONTEND_PID"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for interrupt
    trap "kill $BACKEND_PID $PRINT_PID $FRONTEND_PID 2>/dev/null; exit" INT
    wait
fi

