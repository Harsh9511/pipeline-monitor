export const mockHealthCheckSuccess = {
    ok: true,
    detail: 200,
    timestamp: '2025-10-04T10:30:00.000Z'
  };
  
  export const mockHealthCheckFailure = new Error('Health check failed');
  
  export const mockStatusResponse = {
    pipeline: 'ess-publishing',
    status: 'OK',
    circuitState: 'CLOSED',
    suggestedAction: 'No action needed',
    editorMessage: 'Pipeline healthy',
    updatedAt: '2025-10-04T10:30:00.000Z'
  };
  
  export const mockAuditEvent = {
    pipeline: 'ess-publishing',
    ts: 1728039000000,
    eventType: 'STATUS',
    detail: { message: 'Health OK', at: '2025-10-04T10:30:00.000Z' },
    ttl: 1728644800
  };
  
  export const mockRecoveryResult = {
    passed: 3,
    failed: 0,
    timestamp: '2025-10-04T10:30:00.000Z',
    details: [
      { check: 'ValidatorAPI', status: 'fulfilled', value: { ok: true, detail: 200 } },
      { check: 'DBWrite', status: 'fulfilled', value: { ok: true, detail: 'db-ok' } },
      { check: 'QueueReachability', status: 'fulfilled', value: { ok: true, detail: 200 } }
    ]
  };
  
  export const createMockAxiosResponse = (status = 200, data = {}) => ({
    status,
    data,
    statusText: 'OK',
    headers: {},
    config: {}
  });
  