import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CONFIG } from '../config/environment.js';
import { ttlFromDays } from '../utils/helpers.js';
import { Logger } from '../utils/logger.js';

const ddb = new DynamoDBClient({ region: CONFIG.region });
const doc = DynamoDBDocumentClient.from(ddb);

export async function writeAudit(eventType, detail) {
  try {
    await doc.send(new PutCommand({
      TableName: CONFIG.auditTable,
      Item: {
        pipeline: CONFIG.pipelineName,
        ts: Date.now(),
        eventType,       // FAILURE_DETECTED | RECOVERY_ATTEMPT | RECOVERY_SUCCEEDED | RECOVERY_FAILED | STATUS
        detail,
        ttl: ttlFromDays(CONFIG.auditTtlDays)
      }
    }));
    
    Logger.info('Audit event recorded', { eventType, pipeline: CONFIG.pipelineName });
  } catch (error) {
    Logger.error('Failed to write audit log', error, { eventType });
  }
}
