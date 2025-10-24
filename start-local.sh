#!/bin/bash

# Pipeline Monitor - Local Development Startup Script
echo "🚀 Starting Pipeline Monitor locally with mock services..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start mock services in background
echo "🔧 Starting mock services..."
node mock-services/validator.js &
VALIDATOR_PID=$!

node mock-services/queue.js &
QUEUE_PID=$!

# Wait a moment for services to start
sleep 2

# Start the main pipeline monitor
echo "🏥 Starting Pipeline Monitor..."
npm run start:local &
MONITOR_PID=$!

echo ""
echo "✅ All services started!"
echo "📊 Pipeline Monitor: http://localhost:8080"
echo "🔧 Mock Validator: http://localhost:3001"
echo "🔧 Mock Queue: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $VALIDATOR_PID $QUEUE_PID $MONITOR_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for any process to exit
wait
