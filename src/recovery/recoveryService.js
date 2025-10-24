import { probeHttp, aggregateHealth } from '../core/healthChecker.js';
import { writeAudit } from '../service/index.js';
import { CONFIG } from '../config/environment.js';
import { nowIso } from '../utils/helper.js';
import { Logger } from '../utils/logger.js';

export async function attemptRecovery(reason) {
  Logger.info('Starting recovery attempt', { reason });

  await writeAudit('RECOVERY_ATTEMPT', { reason, at: nowIso() });

  try {
    // Recovery step 1: Warm critical dependency if configured
    if (CONFIG.validatorWarmUrl) {
      try {
        Logger.info('Warming validator endpoint', { url: CONFIG.validatorWarmUrl });
        await probeHttp({ url: CONFIG.validatorWarmUrl, method: 'GET', timeout: 5000 });
        await writeAudit('RECOVERY_STEP', { step: 'validator_warm', at: nowIso() });
      } catch (err) {
        Logger.warn('Validator warmup failed', { error: err?.message });
      }
    }

    // Recovery step 2: Probe aggregate health
    const result = await aggregateHealth(CONFIG.checks);

    Logger.info('Recovery attempt successful', { result });
    await writeAudit('RECOVERY_SUCCEEDED', { result, at: nowIso() });
    return { ok: true, result };
  } catch (error) {
    Logger.error('Recovery attempt failed', error);
    await writeAudit('RECOVERY_FAILED', { error: error.message, at: nowIso() });
    return { ok: false, error: error.message };
  }
}
