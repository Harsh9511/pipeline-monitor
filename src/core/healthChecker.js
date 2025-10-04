import axios from 'axios';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '../utils/logger.js';
import { nowIso } from '../utils/helpers.js';
import { CONFIG } from '../config/environment.js';

export async function probeHttp({ url, method = 'GET', timeout = 3000 }) {
  const res = await axios.request({
    url,
    method,
    timeout,
    validateStatus: () => true
  });

  if (res.status >= 200 && res.status < 300) {
    return { ok: true, detail: res.status, timestamp: nowIso() };
  }

  return { ok: false, detail: res.status, timestamp: nowIso() };
}

/**
 * probeDbWrite - attempt to write a lightweight item to DynamoDB to verify write capability.
 * This writes to the configured status table with a short-lived item (ttl is not strictly enforced here).
 */
export async function probeDbWrite({ table = CONFIG.statusTable } = {}) {
  try {
    const client = new DynamoDBClient({ region: CONFIG.region });
    const doc = DynamoDBDocumentClient.from(client);

    const item = {
      pipeline: CONFIG.pipelineName,
      probe: 'db-write-check',
      ts: Date.now(),
      note: 'health-check'
    };

    await doc.send(new PutCommand({ TableName: table, Item: item }));
    return { ok: true, detail: 'db-ok', timestamp: nowIso() };
  } catch (error) {
    Logger.error('probeDbWrite failed', error);
    return { ok: false, detail: error.message, timestamp: nowIso() };
  }
}

/**
 * Run a single check based on type.
 */
export async function runCheck(check) {
  const t0 = Date.now();
  try {
    if (check.type === 'http') {
      const res = await probeHttp({ url: check.url, method: check.method, timeout: check.timeout });
      return { name: check.name, ok: res.ok, detail: res.detail, elapsedMs: Date.now() - t0 };
    } else if (check.type === 'dbwrite') {
      const res = await probeDbWrite({ table: check.table });
      return { name: check.name, ok: res.ok, detail: res.detail, elapsedMs: Date.now() - t0 };
    } else {
      // Unknown check type - treat as passed but warn
      Logger.warn('Unknown check type, skipping', { check });
      return { name: check.name, ok: true, detail: 'skipped', elapsedMs: Date.now() - t0 };
    }
  } catch (error) {
    Logger.error('runCheck error', error, { check });
    return { name: check.name, ok: false, detail: error.message, elapsedMs: Date.now() - t0 };
  }
}

/**
 * Aggregate health across configured checks.
 * Returns a summary or throws an error with `summary` on failures.
 */
export async function aggregateHealth(checks = []) {
  const promises = checks.map(async (c) => {
    try {
      const r = await runCheck(c);
      return { check: c.name, status: 'fulfilled', value: { ok: r.ok, detail: r.detail } };
    } catch (err) {
      return { check: c.name, status: 'rejected', reason: err };
    }
  });

  const results = await Promise.all(promises);

  const passed = results.filter(r => r.status === 'fulfilled' && r.value?.ok).length;
  const failed = results.length - passed;

  const summary = {
    pipeline: CONFIG.pipelineName,
    passed,
    failed,
    total: results.length,
    details: results
  };

  if (failed > 0) {
    const err = new Error(`Health failed: ${failed}/${results.length} checks`);
    err.summary = summary;
    throw err;
  }

  return summary;
}
