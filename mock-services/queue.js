// Mock Queue Service
import express from 'express';

const app = express();
const port = 3002;

app.use(express.json());

let forceFail = false; // runtime toggle

// Toggle failure on/off
app.post('/toggle-failure', (req, res) => {
  forceFail = !forceFail;
  console.log(`⚙️ Queue failure mode: ${forceFail ? 'ON' : 'OFF'}`);
  res.json({ forceFail });
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Queue health check requested');
  const shouldFail = forceFail || req.query.fail === '1' || process.env.QUEUE_FAIL === '1';
  if (shouldFail) {
    return res.status(500).json({ status: 'ERROR', service: 'queue', timestamp: new Date().toISOString() });
  }
  res.json({
    status: 'OK',
    service: 'queue',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    queueLength: Math.floor(Math.random() * 100)
  });
});

// Simulate occasional failures for testing
app.get('/simulate-failure', (req, res) => {
  console.log('💥 Simulating queue failure');
  res.status(500).json({
    status: 'ERROR',
    message: 'Simulated queue failure for testing'
  });
});

app.listen(port, () => {
  console.log(`🔧 Mock Queue service running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  GET /health?fail=1 - Force failure via query');
  console.log('  POST /toggle-failure - Toggle persistent failure');
  console.log('  GET /simulate-failure - Simulate failure');
});
