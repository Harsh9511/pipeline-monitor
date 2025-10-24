// Mock Validator Service
import express from 'express';

const app = express();
const port = 3001;

app.use(express.json());

let forceFail = false; // runtime toggle

// Toggle failure on/off
app.post('/toggle-failure', (req, res) => {
  forceFail = !forceFail;
  console.log(`⚙️ Validator failure mode: ${forceFail ? 'ON' : 'OFF'}`);
  res.json({ forceFail });
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Validator health check requested');
  const shouldFail = forceFail || req.query.fail === '1' || process.env.VALIDATOR_FAIL === '1';
  if (shouldFail) {
    return res.status(500).json({ status: 'ERROR', service: 'validator', timestamp: new Date().toISOString() });
  }
  res.json({
    status: 'OK',
    service: 'validator',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Warm endpoint
app.get('/warm', (req, res) => {
  console.log('🔥 Validator warm-up requested');
  res.json({
    status: 'WARMED',
    service: 'validator',
    timestamp: new Date().toISOString()
  });
});

// Simulate occasional failures for testing
app.get('/simulate-failure', (req, res) => {
  console.log('💥 Simulating validator failure');
  res.status(500).json({
    status: 'ERROR',
    message: 'Simulated failure for testing'
  });
});

app.listen(port, () => {
  console.log(`🔧 Mock Validator service running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  GET /health?fail=1 - Force failure via query');
  console.log('  POST /toggle-failure - Toggle persistent failure');
  console.log('  GET /warm - Warm-up');
  console.log('  GET /simulate-failure - Simulate failure');
});
