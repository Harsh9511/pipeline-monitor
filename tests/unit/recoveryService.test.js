import { test, describe, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { attemptRecovery } from '../../src/recovery/recoveryService.js';
import { setupAWSMocks } from '../mocks/awsMocks.js';

// Mock dependencies
mock.module('../../src/core/healthChecker.js', {
  namedExports: {
    probeHttp: mock.fn(),
    aggregateHealth: mock.fn()
  }
});

mock.module('../../src/services/auditService.js', {
  namedExports: {
    writeAudit: mock.fn()
  }
});

describe('RecoveryService', () => {
  let mocks;

  beforeEach(async () => {
    setupAWSMocks();
    
    const { probeHttp, aggregateHealth } = await import('../../src/core/healthChecker.js');
    const { writeAudit } = await import('../../src/services/auditService.js');
    
    probeHttp.mock.resetCalls();
    aggregateHealth.mock.resetCalls();
    writeAudit.mock.resetCalls();
    
    mocks = { probeHttp, aggregateHealth, writeAudit };
  });

  test('should perform recovery successfully', async () => {
    const mockResult = {
      passed: 3,
      failed: 0,
      timestamp: new Date().toISOString()
    };

    mocks.probeHttp.mock.mockImplementation(() => 
      Promise.resolve({ ok: true, detail: 200 })
    );
    mocks.aggregateHealth.mock.mockImplementation(() => 
      Promise.resolve(mockResult)
    );
    mocks.writeAudit.mock.mockImplementation(() => Promise.resolve());

    const result = await attemptRecovery('manual');
    
    assert.deepEqual(result, mockResult);
    assert.strictEqual(mocks.writeAudit.mock.callCount(), 1);
    assert.strictEqual(mocks.aggregateHealth.mock.callCount(), 1);
  });

  test('should handle warmup failure gracefully', async () => {
    const mockResult = {
      passed: 3,
      failed: 0,
      timestamp: new Date().toISOString()
    };

    // Warmup fails but recovery continues
    mocks.probeHttp.mock.mockImplementation(() => 
      Promise.reject(new Error('Warmup failed'))
    );
    mocks.aggregateHealth.mock.mockImplementation(() => 
      Promise.resolve(mockResult)
    );
    mocks.writeAudit.mock.mockImplementation(() => Promise.resolve());

    const result = await attemptRecovery('auto');
    
    assert.deepEqual(result, mockResult);
    // Should still attempt aggregate health even if warmup fails
    assert.strictEqual(mocks.aggregateHealth.mock.callCount(), 1);
  });

  test('should throw error when aggregate health fails', async () => {
    mocks.probeHttp.mock.mockImplementation(() => 
      Promise.resolve({ ok: true, detail: 200 })
    );
    mocks.aggregateHealth.mock.mockImplementation(() => 
      Promise.reject(new Error('Health check failed'))
    );
    mocks.writeAudit.mock.mockImplementation(() => Promise.resolve());

    await assert.rejects(
      () => attemptRecovery('manual'),
      { message: 'Health check failed' }
    );
    
    assert.strictEqual(mocks.writeAudit.mock.callCount(), 1);
  });

  test('should log recovery attempt with correct reason', async () => {
    mocks.aggregateHealth.mock.mockImplementation(() => 
      Promise.resolve({ passed: 1, failed: 0 })
    );
    mocks.writeAudit.mock.mockImplementation(() => Promise.resolve());

    await attemptRecovery('scheduled');
    
    const auditCall = mocks.writeAudit.mock.calls[0];
    assert.strictEqual(auditCall.arguments[0], 'RECOVERY_ATTEMPT');
    assert.strictEqual(auditCall.arguments[1].reason, 'scheduled');
  });
});
