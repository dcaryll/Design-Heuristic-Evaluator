#!/bin/bash

# Start the Design Evaluator servers
echo "🚀 Starting Design Evaluator servers..."

# Function to cleanup processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    pkill -f "uvicorn main:app"
    pkill -f "npm start"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend
echo "📡 Starting backend server..."
cd backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend (if not already running)
if ! lsof -i :3000 > /dev/null 2>&1; then
    echo "🌐 Starting frontend server..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
else
    echo "🌐 Frontend already running on port 3000"
fi

# Wait a bit for both to start
sleep 5

echo "✅ Servers started!"
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Testing backend connection..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend is not responding"
fi

# Open the app
open http://localhost:3000

echo "Press Ctrl+C to stop servers"
wait