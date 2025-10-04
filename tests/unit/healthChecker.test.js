import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { probeHttp, probeDbWrite, runCheck, aggregateHealth } from '../../src/core/healthChecker.js';
import { mockHealthCheckSuccess, createMockAxiosResponse } from '../fixtures/mockData.js';

// Mock axios
const axiosMock = {
  request: mock.fn()
};

// Override axios import
mock.module('axios', {
  namedExports: { default: axiosMock }
});

describe('HealthChecker', () => {
  beforeEach(() => {
    axiosMock.request.mock.resetCalls();
  });

  describe('probeHttp', () => {
    test('should return success for 2xx status codes', async () => {
      axiosMock.request.mock.mockImplementation(() => 
        Promise.resolve(createMockAxiosResponse(200))
      );

      const result = await probeHttp({ url: 'https://example.com/health' });
      
      assert.deepEqual(result, { ok: true, detail: 200 });
      assert.strictEqual(axiosMock.request.mock.callCount(), 1);
    });

    test('should throw error for non-2xx status codes', async () => {
      axiosMock.request.mock.mockImplementation(() => 
        Promise.resolve(createMockAxiosResponse(500))
      );

      await assert.rejects(
        () => probeHttp({ url: 'https://example.com/health' }),
        { message: 'HTTP 500' }
      );
    });

    test('should throw error for network failures', async () => {
      axiosMock.request.mock.mockImplementation(() => 
        Promise.reject(new Error('Network error'))
      );

      await assert.rejects(
        () => probeHttp({ url: 'https://example.com/health' }),
        { message: 'Network error' }
      );
    });

    test('should use correct request parameters', async () => {
      axiosMock.request.mock.mockImplementation(() => 
        Promise.resolve(createMockAxiosResponse(200))
      );

      const config = {
        url: 'https://api.example.com/status',
        method: 'POST',
        timeout: 5000
      };

      await probeHttp(config);

      const call = axiosMock.request.mock.calls[0];
      assert.strictEqual(call.arguments[0].url, config.url);
      assert.strictEqual(call.arguments[0].method, config.method);
      assert.strictEqual(call.arguments[0].timeout, config.timeout);
    });
  });

  describe('probeDbWrite', () => {
    test('should return success for db probe', async () => {
      const result = await probeDbWrite();
      assert.deepEqual(result, { ok: true, detail: 'db-ok' });
    });
  });

  describe('runCheck', () => {
    test('should execute http check successfully', async () => {
      axiosMock.request.mock.mockImplementation(() => 
        Promise.resolve(createMockAxiosResponse(200))
      );

      const check = {
        name: 'TestAPI',
        type: 'http',
        url: 'https://test.com/health'
      };

      const result = await runCheck(check);
      assert.deepEqual(result, { ok: true, detail: 200 });
    });

    test('should execute function check successfully', async () => {
      const check = {
        name: 'DBCheck',
        type: 'function',
        fnName: 'probeDbWrite'
      };

      const result = await runCheck(check);
      assert.deepEqual(result, { ok: true, detail: 'db-ok' });
    });

    test('should throw error for unknown check type', async () => {
      const check = {
        name: 'UnknownCheck',
        type: 'unknown'
      };

      await assert.rejects(
        () => runCheck(check),
        { message: 'Unknown check type: unknown' }
      );
    });
  });

  describe('aggregateHealth', () => {
    test('should return success when all checks pass', async () => {
      axiosMock.request.mock.mockImplementation(() => 
        Promise.resolve(createMockAxiosResponse(200))
      );

      const checks = [
        { name: 'API1', type: 'http', url: 'https://api1.com' },
        { name: 'DB', type: 'function', fnName: 'probeDbWrite' }
      ];

      const result = await aggregateHealth(checks);
      
      assert.strictEqual(result.passed, 2);
      assert.strictEqual(result.failed, 0);
      assert.ok(result.timestamp);
      assert.strictEqual(result.details.length, 2);
    });

    test('should throw error when any check fails', async () => {
      axiosMock.request.mock.mockImplementation(() => 
        Promise.resolve(createMockAxiosResponse(500))
      );

      const checks = [
        { name: 'API1', type: 'http', url: 'https://api1.com' },
        { name: 'DB', type: 'function', fnName: 'probeDbWrite' }
      ];

      await assert.rejects(
        () => aggregateHealth(checks),
        { message: 'Health failed: 1/2 checks' }
      );
    });

    test('should include failure details in error', async () => {
      axiosMock.request.mock.mockImplementation(() => 
        Promise.reject(new Error('Connection refused'))
      );

      const checks = [
        { name: 'API1', type: 'http', url: 'https://api1.com' }
      ];

      try {
        await aggregateHealth(checks);
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.summary);
        assert.strictEqual(error.summary.failed, 1);
        assert.strictEqual(error.summary.details[0].status, 'rejected');
      }
    });
  });
});
