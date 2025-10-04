import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CONFIG } from '../config/environment.js';
import { Logger } from '../utils/logger.js';

const sns = new SNSClient({ region: CONFIG.region });

export async function alert(subject, message) {
  if (!CONFIG.snsTopicArn) {
    Logger.warn('SNS topic not configured, skipping alert', { subject });
    return;
  }
  
  try {
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
