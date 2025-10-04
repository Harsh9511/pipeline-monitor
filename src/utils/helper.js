export const nowIso = () => new Date().toISOString();

export const ttlFromDays = (days) => 
  Math.floor((Date.now() + days * 24 * 3600 * 1000) / 1000);

// Editor-facing suggestions catalog
export const SUGGESTIONS = {
  OK: { 
    message: 'Pipeline healthy', 
    action: 'No action needed' 
  },
  DEGRADED: { 
    message: 'Partial outage detected', 
    action: 'Allow auto-recovery to proceed; review logs' 
  },
  DOWN: { 
    message: 'Publishing unavailable', 
    action: 'Retry recovery; if persists, escalate with incident ticket' 
  }
};

// Circuit state mapping
export const getStatusFromCircuit = (breaker) => {
  if (breaker.opened) return 'DOWN';
  if (breaker.halfOpen) return 'DEGRADED';
  return 'OK';
};
