import CircuitBreaker from 'opossum';
import { Logger } from '../utils/logger.js';
import { aggregateHealth } from './healthChecker.js';
import { writeAudit, writeStatus, alert } from '../service/index.js';
import { CONFIG } from '../config/environment.js';
import { SUGGESTIONS, nowIso } from '../utils/helper.js';

export function createCircuitBreaker() {
  // Wrap aggregate health check with circuit breaker
  const healthFunction = () => aggregateHealth(CONFIG.checks);
  const breaker = new CircuitBreaker(healthFunction, CONFIG.breakerOptions);

  // Wire breaker events
  breaker.on('open', async () => {
    const msg = `Circuit OPEN for ${CONFIG.pipelineName} at ${nowIso()}`;
    Logger.error('Circuit breaker opened', null, { pipeline: CONFIG.pipelineName });
    await writeAudit('FAILURE_DETECTED', { message: msg });
    await writeStatus({
      status: 'DOWN',
      circuitState: 'OPEN',
      suggestedAction: SUGGESTIONS.DOWN.action,
      editorMessage: SUGGESTIONS.DOWN.message,
      details: { reason: 'circuit_open' }
    });
    await alert('Publishing pipeline DOWN', msg);
  });

  breaker.on('halfOpen', async () => {
    const msg = `Circuit HALF_OPEN for ${CONFIG.pipelineName} at ${nowIso()}`;
    Logger.warn('Circuit breaker half-open', { pipeline: CONFIG.pipelineName });
    await writeAudit('CIRCUIT_HALF_OPEN', { message: msg });
    await writeStatus({
      status: 'DEGRADED',
      circuitState: 'HALF_OPEN',
      suggestedAction: SUGGESTIONS.DEGRADED.action,
      editorMessage: SUGGESTIONS.DEGRADED.message,
      details: { reason: 'circuit_half_open' }
    });
  });

  breaker.on('close', async () => {
    const msg = `Circuit CLOSED for ${CONFIG.pipelineName} at ${nowIso()}`;
    Logger.info('Circuit breaker closed - recovery successful', { pipeline: CONFIG.pipelineName });
    await writeAudit('RECOVERY_SUCCEEDED', { message: msg });
    await writeStatus({
      status: 'OK',
      circuitState: 'CLOSED',
      suggestedAction: SUGGESTIONS.OK.action,
      editorMessage: SUGGESTIONS.OK.message
    });
    await alert('Publishing pipeline recovered', msg);
  });

  return breaker;
}
