#!/bin/bash

echo "🚀 Design Evaluator - Internet Sharing Setup"
echo "============================================="
echo ""

# Check if servers are running
echo "📡 Checking server status..."
if ! curl -s http://192.168.5.34:8000/health > /dev/null; then
    echo "❌ Backend not running on network IP. Please run:"
    echo "   cd backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000"
    exit 1
fi

if ! curl -s http://192.168.5.34:3000 > /dev/null; then
    echo "❌ Frontend not running. Please run:"
    echo "   cd frontend && npm start"
    exit 1
fi

echo "✅ Both servers are running!"
echo ""

# Start ngrok tunnels
echo "🌍 Creating internet tunnels..."
echo ""

# Start ngrok for frontend in background
~/bin/ngrok http 3000 --log=stdout > frontend_ngrok.log 2>&1 &
FRONTEND_PID=$!

# Start ngrok for backend in background  
~/bin/ngrok http 8000 --log=stdout > backend_ngrok.log 2>&1 &
BACKEND_PID=$!

echo "⏳ Starting tunnels... (waiting 5 seconds)"
sleep 5

echo ""
echo "🎉 Your Design Evaluator is now accessible worldwide!"
echo ""

# Extract URLs from ngrok logs
FRONTEND_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.ngrok-free\.app' frontend_ngrok.log | head -1)
BACKEND_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.ngrok-free\.app' backend_ngrok.log | head -1)

echo "📱 Share these URLs with your co-worker:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo ""
echo "📝 NOTE: You'll need to update the frontend to use the backend URL"
echo "   Edit: frontend/src/components/ImageUpload.tsx"
echo "   Change: const API_BASE_URL = 'http://192.168.5.34:8000';"
echo "   To:     const API_BASE_URL = '$BACKEND_URL';"
echo ""
echo "🛑 To stop tunnels: kill $FRONTEND_PID $BACKEND_PID"
echo ""
echo "Press Ctrl+C to stop and view logs in frontend_ngrok.log and backend_ngrok.log"

# Wait for user interruption
wait