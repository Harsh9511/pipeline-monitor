import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupAWSMocks } from '../mocks/awsMocks.js';
import PipelineMonitor from '../../src/index.js';

describe('API Integration Tests', () => {
  let monitor;
  let server;
  const testPort = 3001;

  beforeEach(async () => {
    // Setup test environment
    process.env.PORT = testPort.toString();
    process.env.VALIDATOR_URL = 'https://test-validator.com/health';
    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:ap-south-1:123456789012:test-topic';
    
    setupAWSMocks();
    
    monitor = new PipelineMonitor();
    await monitor.initialize();
    
    // Start server
    server = monitor.app.listen(testPort);
  });

  afterEach(async () => {
    if (server) {
      server.close();
    }
    if (monitor) {
      await monitor.stop();
    }
  });

  test('should return pipeline status', async () => {
    const response = await fetch(`http://localhost:${testPort}/api/pipeline/status`);
    const data = await response.json();
    
    assert.strictEqual(response.status, 200);
    assert.ok(data.pipeline);
    assert.ok(data.status);
    assert.ok(data.circuitState);
  });

  test('should handle manual recovery request', async () => {
    const response = await fetch(`http://localhost:${testPort}/api/pipeline/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    // May succeed or fail depending on health checks, but should return proper response
    assert.ok(response.status === 200 || response.status === 503);
    
    const data = await response.json();
    assert.ok(typeof data.ok === 'boolean');
  });

  test('should return health check endpoint', async () => {
    const response = await fetch(`http://localhost:${testPort}/api/health`);
    const data = await response.json();
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.status, 'healthy');
    assert.ok(data.timestamp);
  });

  test('should handle invalid endpoints', async () => {
    const response = await fetch(`http://localhost:${testPort}/api/nonexistent`);
    assert.strictEqual(response.status, 404);
  });
});
