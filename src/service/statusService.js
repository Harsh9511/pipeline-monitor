import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { CONFIG } from '../config/environment.js';
import { nowIso } from '../utils/helper.js';
import { Logger } from '../utils/logger.js';
import { createMockAWSClients, mockServices } from '../config/localMocks.js';

// Use mock services in local development, real AWS in production
const isLocalDev = process.env.NODE_ENV === 'development' || process.env.AWS_ENDPOINT;
const { ddb, doc } = isLocalDev ? createMockAWSClients() : {
  ddb: new DynamoDBClient({ region: CONFIG.region }),
  doc: DynamoDBDocumentClient.from(new DynamoDBClient({ region: CONFIG.region }))
};

export async function writeStatus(status) {
  try {
    // Use mock service in local development
    if (isLocalDev) {
      return await mockServices.writeStatus(status);
    }

    await doc.send(new PutCommand({
      TableName: CONFIG.statusTable,
      Item: {
        pipeline: CONFIG.pipelineName,
        status: status.status,               // OK | DEGRADED | DOWN
        circuitState: status.circuitState || 'UNKNOWN',
        suggestedAction: status.suggestedAction || 'Check logs',
        editorMessage: status.editorMessage || '',
        details: status.details || {},
        updatedAt: nowIso()
      }
    }));

    Logger.info('Pipeline status updated', { pipeline: CONFIG.pipelineName, status: status.status });
  } catch (error) {
    Logger.error('Failed to write status', error);
    throw error;
  }
}

export async function readStatus() {
  try {
    // Use mock service in local development
    if (isLocalDev) {
      return await mockServices.readStatus();
    }

    const result = await doc.send(new GetCommand({
      TableName: CONFIG.statusTable,
      Key: { pipeline: CONFIG.pipelineName }
    }));

    return result.Item;
  } catch (error) {
    Logger.error('Failed to read status', error);
    throw error;
  }
}
