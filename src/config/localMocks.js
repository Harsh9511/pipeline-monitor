// Local development mock setup for AWS services
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SNSClient } from '@aws-sdk/client-sns';
import { CONFIG } from './environment.js';

// Create mock AWS clients for local development
export function createMockAWSClients() {
  const ddbClient = new DynamoDBClient({
    region: CONFIG.region,
    endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
    }
  });

  const docClient = DynamoDBDocumentClient.from(ddbClient);
  
  const snsClient = new SNSClient({
    region: CONFIG.region,
    endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
    }
  });

  return { ddbClient, docClient, snsClient };
}

// Mock data storage for local development
export const mockData = {
  status: new Map(),
  audit: new Map()
};

// Mock implementations for local development
export const mockServices = {
  async writeStatus(status) {
    const key = CONFIG.pipelineName;
    mockData.status.set(key, {
      ...status,
      updatedAt: new Date().toISOString()
    });
    console.log('📝 Mock Status Written:', { pipeline: key, status: status.status });
    return { success: true };
  },

  async readStatus() {
    const key = CONFIG.pipelineName;
    const status = mockData.status.get(key);
    console.log('📖 Mock Status Read:', status || 'No status found');
    return status || null;
  },

  async writeAudit(eventType, detail) {
    const key = `${CONFIG.pipelineName}-${Date.now()}`;
    const auditEntry = {
      pipeline: CONFIG.pipelineName,
      ts: Date.now(),
      eventType,
      detail,
      ttl: Math.floor(Date.now() / 1000) + (CONFIG.auditTtlDays * 24 * 60 * 60)
    };
    mockData.audit.set(key, auditEntry);
    console.log('📋 Mock Audit Written:', { eventType, pipeline: CONFIG.pipelineName });
    return { success: true };
  },

  async sendAlert(subject, message) {
    console.log('🚨 Mock Alert Sent:', { subject, message: message.substring(0, 100) + '...' });
    return { MessageId: 'mock-message-id' };
  }
};
