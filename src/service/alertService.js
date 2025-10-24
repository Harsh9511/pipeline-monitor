import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CONFIG } from '../config/environment.js';
import { Logger } from '../utils/logger.js';
import { createMockAWSClients, mockServices } from '../config/localMocks.js';

// Use mock services in local development, real AWS in production
const isLocalDev = process.env.NODE_ENV === 'development' || process.env.AWS_ENDPOINT;
const sns = isLocalDev ? createMockAWSClients().snsClient : new SNSClient({ region: CONFIG.region });

export async function alert(subject, message) {
  if (!CONFIG.snsTopicArn) {
    Logger.warn('SNS topic not configured, skipping alert', { subject });
    return;
  }
  
  try {
    // Use mock service in local development
    if (isLocalDev) {
      return await mockServices.sendAlert(subject, message);
    }

    await sns.send(new PublishCommand({
      TopicArn: CONFIG.snsTopicArn,
      Subject: subject,
      Message: message
    }));
    
    Logger.info('Alert sent', { subject });
  } catch (error) {
    Logger.error('Failed to send alert', error, { subject });
  }
}
