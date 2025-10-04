// AWS SDK v3 mocking utilities
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SNSClient } from '@aws-sdk/client-sns';

// Create mock clients
export const ddbMock = mockClient(DynamoDBClient);
export const snsMock = mockClient(SNSClient);

export function setupAWSMocks() {
  // Reset all mocks
  ddbMock.reset();
  snsMock.reset();
  
  // Default successful responses
  ddbMock.resolves({});
  snsMock.resolves({ MessageId: 'mock-message-id' });
  
  return { ddbMock, snsMock };
}

export function setupAWSFailures() {
  ddbMock.rejects(new Error('DynamoDB error'));
  snsMock.rejects(new Error('SNS error'));
}
