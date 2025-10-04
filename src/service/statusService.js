import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { CONFIG } from '../config/environment.js';
import { nowIso } from '../utils/helpers.js';
import { Logger } from '../utils/logger.js';

const ddb = new DynamoDBClient({ region: CONFIG.region });
const doc = DynamoDBDocumentClient.from(ddb);

export async function writeStatus(status) {
  try {
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
