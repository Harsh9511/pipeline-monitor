# 🚀 Pipeline Monitor - Local Development Guide

This guide will help you run the pipeline monitor locally **without needing AWS credentials** using mock services.

## 📋 What You Need

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Docker** (optional, for containerized setup)

## 🎯 Quick Start (Easiest Method)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Everything
```bash
# Make the script executable (run this once)
chmod +x start-local.sh

# Start all services
./start-local.sh
```

**Alternative (if the script doesn't work):**
```bash
# Start mock services in separate terminals
node mock-services/validator.js &
node mock-services/queue.js &

# Start pipeline monitor
npm run start:local
```

That's it! 🎉 The pipeline monitor will be running at `http://localhost:8080`

## 🔧 Manual Setup (Step by Step)

If you prefer to run services manually or want to understand what's happening:

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Mock Services
Open **3 separate terminal windows** and run these commands:

**Terminal 1 - Mock Validator Service:**
```bash
node mock-services/validator.js
```

**Terminal 2 - Mock Queue Service:**
```bash
node mock-services/queue.js
```

**Terminal 3 - Pipeline Monitor:**
```bash
NODE_ENV=development node src/index.js
```

### Step 3: Test the Setup
Open your browser and go to:
- **Pipeline Monitor**: http://localhost:8080
- **Mock Validator**: http://localhost:3001/health
- **Mock Queue**: http://localhost:3002/health

## 🐳 Docker Setup (No Commands Needed!)

### Option 1: Normal Operation
```bash
docker-compose up --build
```

### Option 2: Test Failures
```bash
docker-compose -f docker-compose.yml -f docker-compose.failures.yml up --build
```

### Option 3: Background Mode
```bash
docker-compose up -d --build
```

This will start:
- Mock Validator service on port 3001
- Mock Queue service on port 3002  
- Pipeline Monitor on port 8080

**No npm commands, no shell scripts needed!** Just `docker-compose up` and you're done.

## 🧪 Testing the Pipeline Monitor

### 1. Check Health Status
```bash
curl http://localhost:8080/api/health
```

### 2. Get Pipeline Status
```bash
curl http://localhost:8080/api/status
```

### 3. Simulate Failures (for testing)
```bash
# Simulate validator failure
curl http://localhost:3001/simulate-failure

# Simulate queue failure  
curl http://localhost:3002/simulate-failure
```

### 4. View Logs
The pipeline monitor will show logs in the terminal, including:
- 📝 Status updates
- 📋 Audit events
- 🚨 Alert notifications (mocked)

## 🔍 What's Happening Behind the Scenes

### Mock Services
- **Validator Service** (port 3001): Simulates a health check endpoint
- **Queue Service** (port 3002): Simulates a queue health check
- **AWS Services**: DynamoDB and SNS are mocked in memory

### Pipeline Monitor Features
- **Health Checks**: Monitors validator and queue services every 10 seconds
- **Circuit Breaker**: Automatically detects and handles failures
- **Status Tracking**: Records pipeline status in mock DynamoDB
- **Audit Logging**: Logs all events in mock audit table
- **Alerting**: Sends mock alerts via mock SNS

## 🛠️ Configuration

All configuration is in `local.env`:
- **Port**: 8080 (pipeline monitor)
- **Health Check Interval**: 10 seconds
- **Circuit Breaker**: 5 second timeout, 50% error threshold
- **Mock Services**: Ports 3001 and 3002

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill processes using the ports
lsof -ti:8080 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

### Services Not Starting
1. Check if Node.js is installed: `node --version`
2. Check if dependencies are installed: `ls node_modules`
3. Check for error messages in the terminal

### Mock Services Not Responding
1. Make sure all 3 services are running
2. Check the terminal output for error messages
3. Try accessing the health endpoints directly

## 📊 Monitoring Dashboard

Once running, you can:
1. **View Real-time Status**: http://localhost:8080/api/status
2. **Check Health**: http://localhost:8080/api/health
3. **Monitor Circuit Breaker**: Watch the terminal logs
4. **Test Failures**: Use the simulate-failure endpoints

## 🎉 Success!

If everything is working, you should see:
- ✅ Pipeline Monitor running on port 8080
- ✅ Mock services responding to health checks
- ✅ Status updates every 10 seconds in the logs
- ✅ Mock AWS services working (no real AWS needed!)

The pipeline monitor is now running completely locally with mock services! 🚀
