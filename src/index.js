import express from 'express';
import bodyParser from 'body-parser';
import { CONFIG, validateConfig } from './config/environment.js';
import { createCircuitBreaker } from './core/circuitBreaker.js';
import { createRoutes } from './api/routes.js';
import { writeAudit, writeStatus } from './service/index.js';
import { Logger } from './utils/logger.js';
import { SUGGESTIONS, getStatusFromCircuit, nowIso } from './utils/helpers.js';

export * from './service/index.js';

class PipelineMonitor {
  constructor() {
    this.app = null;
    this.server = null;
    this.breaker = null;
    this.healthInterval = null;
  }

  async initialize() {
    validateConfig();

    // Create circuit breaker
    this.breaker = createCircuitBreaker();

    // Setup express app and routes
    this.app = express();
    this.app.use(bodyParser.json());
    this.app.use('/api', createRoutes(this.breaker));

    // initial status
    await writeStatus({
      status: 'OK',
      circuitState: getStatusFromCircuit(this.breaker),
      suggestedAction: SUGGESTIONS.OK.action,
      editorMessage: SUGGESTIONS.OK.message
    });
  }

  async start() {
    if (!this.app) {
      await this.initialize();
    }
    this.server = this.app.listen(CONFIG.port, () => {
      Logger.info('Pipeline monitor listening', { port: CONFIG.port });
    });

    // start periodic health checks
    this.healthInterval = setInterval(async () => {
      try {
        await this.breaker.fire();
      } catch (err) {
        Logger.error('Health check failed', err);
      }
    }, CONFIG.healthIntervalMs);
  }

  async stop() {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve));
      this.server = null;
    }
    Logger.info('Pipeline monitor stopped');
  }
}

// If executed directly, start service
if (process.env.NODE_ENV !== 'test' && process.argv[1].endsWith('src/index.js')) {
  const monitor = new PipelineMonitor();

  process.on('SIGINT', async () => {
    Logger.info('Received SIGINT, shutting down gracefully');
    await monitor.stop();
    process.exit(0);
  });

  monitor.start().catch(error => {
    Logger.error('Failed to start pipeline monitor', error);
    process.exit(1);
  });
}

export default PipelineMonitor;
