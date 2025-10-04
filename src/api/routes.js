import express from 'express';
import { readStatus, writeStatus, writeAudit, alert } from '../service/index.js';
import { attemptRecovery } from '../recovery/recoveryService.js';
import { CONFIG } from '../config/environment.js';
import { SUGGESTIONS, nowIso, getStatusFromCircuit } from '../utils/helpers.js';
import { Logger } from '../utils/logger.js';

export function createRoutes(breaker) {
  const router = express.Router();

  router.get('/pipeline/status', async (req, res) => {
    try {
      const status = await readStatus();
      const fallback = {
        pipeline: CONFIG.pipelineName,
        status: 'UNKNOWN',
        circuitState: getStatusFromCircuit(breaker),
        suggestedAction: 'Await next health cycle',
        editorMessage: 'Initializing'
      };

      res.json(status || fallback);
    } catch (error) {
      Logger.error('Failed to get status', error);
      res.status(500).json({ error: 'Failed to retrieve status' });
    }
  });

  router.post('/pipeline/recover', async (req, res) => {
    try {
      const reason = req.body?.reason || 'manual';
      const result = await attemptRecovery(reason);

      if (result.ok) {
        return res.json({ ok: true, message: 'Recovery succeeded', result });
      } else {
        return res.status(503).json({ ok: false, message: 'Recovery failed', error: result.error });
      }
    } catch (error) {
      Logger.error('Recovery route error', error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  // Health endpoint for load balancer
  router.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: nowIso() });
  });

  return router;
}
