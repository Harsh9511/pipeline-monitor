import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CONFIG } from '../config/environment.js';
import { ttlFromDays } from '../utils/helper.js';
import { Logger } from '../utils/logger.js';
import { createMockAWSClients, mockServices } from '../config/localMocks.js';

// Use mock services in local development, real AWS in production
const isLocalDev = process.env.NODE_ENV === 'development' || process.env.AWS_ENDPOINT;
const { ddb, doc } = isLocalDev ? createMockAWSClients() : {
  ddb: new DynamoDBClient({ region: CONFIG.region }),
  doc: DynamoDBDocumentClient.from(new DynamoDBClient({ region: CONFIG.region }))
};

export async function writeAudit(eventType, detail) {
  try {
    // Use mock service in local development
    if (isLocalDev) {
      return await mockServices.writeAudit(eventType, detail);
    }

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
