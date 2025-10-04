import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { setupAWSMocks } from '../mocks/awsMocks.js';
import PipelineMonitor from '../../src/index.js';

// Mock axios for controlled responses
const axiosMock = {
  request: mock.fn()
};

mock.module('axios', {
  namedExports: { default: axiosMock }
});

describe('Pipeline Integration Tests', () => {
  let monitor;

  beforeEach(async () => {
    // Setup test environment with shorter intervals
    process.env.HEALTH_INTERVAL_MS = '100'; // Very fast for testing
    process.env.VALIDATOR_URL = 'https://test-validator.com/health';
    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-topic';
    process.env.BREAKER_TIMEOUT = '1000';
    process.env.RESET_TIMEOUT = '2000';
    
    setupAWSMocks();
    axiosMock.request.mock.resetCalls();
    
    monitor = new PipelineMonitor();
  });

  afterEach(async () => {
    if (monitor) {
      await monitor.stop();
    }
  });

  test('should initialize and start monitoring', async () => {
    axiosMock.request.mock.mockImplementation(() => 
      Promise.resolve({ status: 200, data: {} })
    );

    await monitor.initialize();
    
    assert.ok(monitor.app);
    assert.ok(monitor.breaker);
    assert.strictEqual(monitor.breaker.opened, false);
  });

  test('should handle health check cycle', async () => {
    axiosMock.request.mock.mockImplementation(() => 
      Promise.resolve({ status: 200, data: {} })
    );

    await monitor.initialize();
    monitor.startHealthLoop();
    
    // Wait for a few health check cycles
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Should have made health check requests
    assert.ok(axiosMock.request.mock.callCount() > 0);
  });

  test('should detect and handle failures', async () => {
    // Start with success, then fail
    let callCount = 0;
    axiosMock.request.mock.mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.resolve({ status: 200, data: {} });
      }
      return Promise.resolve({ status: 500, data: {} });
    });

    await monitor.initialize();
    monitor.startHealthLoop();
    
    // Wait for failures to accumulate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Circuit breaker should react to failures
    assert.ok(axiosMock.request.mock.callCount() > 2);
  });

  test('should validate required configuration', async () => {
    // Remove required config
    delete process.env.VALIDATOR_URL;
    delete process.env.SNS_TOPIC_ARN;

    await assert.rejects(
      () => monitor.initialize(),
      { message: /Missing required environment variables/ }
    );
  });
});
