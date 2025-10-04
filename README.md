Installation & Usage

You can run the service either directly on your machine or inside Docker.

### Option 1: Run Locally

1. Install dependencies: npm install
Start the server: npm start
Server will run at http://localhost:3000/status

Run tests: npm test

### Option 2: Run with Docker (Recommended)
Using Docker directly
Build the image: docker build -t pipeline-monitor .
Run the service: docker run -p 3000:3000 pipeline-monitor
Run tests: docker run pipeline-monitor npm test


Using Docker Compose (One-Command Setup)
Build and start the service: docker-compose up --build
This will:
Build the image
Start the server at http://localhost:3000/status
Mount logs to your local ./logs folder

To run tests inside the container: docker-compose run pipeline-monitor npm test
Stop everything: docker-compose down


# Pipeline Monitor

This repository implements a publishing pipeline health monitor for EssentiallySports.

## What it does (short)
- Periodically runs health checks (HTTP endpoints, DynamoDB write) using a circuit breaker.
- Writes pipeline status and audit events to DynamoDB tables: `PipelineStatus` and `PipelineAudit`.
- Sends alerts via SNS when failures are detected or when recovery succeeds.
- Provides HTTP endpoints to view status and trigger manual recovery:
  - `GET /api/health` - LB friendly health check
  - `GET /api/pipeline/status` - Current pipeline status and suggested actions
  - `POST /api/pipeline/recover` - Trigger a manual recovery attempt

## How to run locally (development)

> This project uses Node.js (ES modules). Ensure you have Node version 18+ installed. 
**[ Personally, I have used Node v23.11.0 ]**

1. Install dependencies

npm ci

2. Provide environment variables (example `.env` provided)

cp .env .env.local
# Edit .env.local with appropriate values, especially:
# VALIDATOR_URL, SNS_TOPIC_ARN


3. Start the service

npm run dev
# or
node src/index.js


4. Run tests (unit + integration)

npm test


> Note: integration tests use aws-sdk-client-mock to avoid real AWS usage. For local end-to-end with real AWS, create the DynamoDB tables and SNS topic referenced in `.env` and provide credentials with permissions to DynamoDB and SNS.

## Interpreting logs / audit events
The service logs JSON objects to stdout. Example audit events (see `samples/audit-samples.json`) include:
- `FAILURE_DETECTED` - circuit opened, pipeline is down
- `RECOVERY_ATTEMPT` - an automatic or manual recovery started
- `RECOVERY_SUCCEEDED` - recovery attempt succeeded
- `RECOVERY_FAILED` - recovery attempt failed

Each audit log contains `pipeline`, `ts` (epoch), `eventType`, `detail`, and `ttl` (expiry days).

## Files changed / implemented
- `src/config/environment.js` - Completed config and validation
- `src/core/healthChecker.js` - Implemented HTTP and DB write probes, runCheck, aggregateHealth
- `src/core/circuitBreaker.js` - Implemented breaker event handlers (open/halfOpen/close)
- `src/recovery/recoveryService.js` - Implemented recovery flow (warmup + re-check)
- `src/service/statusService.js` - Completed writeStatus/readStatus
- `src/api/routes.js` - Implemented `/pipeline/status`, `/pipeline/recover`, and `/health`
- `src/index.js` - Implemented PipelineMonitor class (initialize/start/stop)

## Testing plan
- Unit tests validate individual probes and services.
- Integration tests start the server and validate HTTP endpoints and periodic health checks.
- Manually simulate failures by pointing `VALIDATOR_URL` to a non-responsive endpoint and observe:
  - Circuit opens and `FAILURE_DETECTED` audit is written.
  - SNS alert is attempted.
  - Recovery attempts are logged.


## Running tests inside Docker

If you want a self-contained environment to run tests (recommended), use Docker Compose. This builds the image with dev dependencies and runs tests inside the container.

Build & start (server):
```bash
docker-compose up --build
# server will be available at http://localhost:3000/api/health
```

Run test suite inside container (separate command):
```bash
# One-shot test run
docker-compose run --rm pipeline-monitor npm test

# Or run unit tests only
docker-compose run --rm pipeline-monitor npm run test:unit
```

This ensures tests run with the correct Node version and dependencies installed.

