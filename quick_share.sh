#!/bin/bash

echo "🎯 Design Evaluator - Quick Share"
echo "================================="
echo ""

# Get the current network IP
NETWORK_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

echo "🌐 Your app is accessible at:"
echo ""
echo "   Frontend: http://$NETWORK_IP:3000"
echo "   Backend:  http://$NETWORK_IP:8000"
echo ""
echo "📋 Share this URL with your co-worker: http://$NETWORK_IP:3000"
echo ""
echo "✅ Requirements: You and your co-worker must be on the same WiFi network"
echo ""
echo "🔍 Testing connectivity..."

# Test if services are running
if curl -s http://$NETWORK_IP:8000/health > /dev/null; then
    echo "✅ Backend is accessible on the network"
else
    echo "❌ Backend not accessible. Make sure it's running with:"
    echo "   cd backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000"
fi

if curl -s http://$NETWORK_IP:3000 > /dev/null; then
    echo "✅ Frontend is accessible on the network"
else
    echo "❌ Frontend not accessible. Make sure it's running with:"
    echo "   cd frontend && npm start"
fi

echo ""
echo "🚀 Ready to share! Send your co-worker: http://$NETWORK_IP:3000"