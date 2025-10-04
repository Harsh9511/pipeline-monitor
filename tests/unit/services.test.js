import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeAudit } from '../../src/services/auditService.js';
import { writeStatus, readStatus } from '../../src/services/statusService.js';
import { alert } from '../../src/services/alertService.js';
import { setupAWSMocks, setupAWSFailures } from '../mocks/awsMocks.js';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { PublishCommand } from '@aws-sdk/client-sns';

describe('Services', () => {
  let awsMocks;

  beforeEach(() => {
    awsMocks = setupAWSMocks();
  });

  afterEach(() => {
    awsMocks.ddbMock.reset();
    awsMocks.snsMock.reset();
  });

  describe('AuditService', () => {
    test('should write audit event successfully', async () => {
      const eventType = 'FAILURE_DETECTED';
      const detail = { message: 'Test failure', at: new Date().toISOString() };

      await writeAudit(eventType, detail);

      assert.strictEqual(awsMocks.ddbMock.calls().length, 1);
      const call = awsMocks.ddbMock.call(0);
      assert.ok(call.args[0].input instanceof PutCommand);
      
      const item = call.args[0].input.Item;
      assert.strictEqual(item.eventType, eventType);
      assert.deepEqual(item.detail, detail);
      assert.ok(item.pipeline);
      assert.ok(item.ts);
      assert.ok(item.ttl);
    });

    test('should handle DynamoDB errors gracefully', async () => {
      setupAWSFailures();

      await assert.doesNotReject(() => 
        writeAudit('STATUS', { message: 'test' })
      );
    });
  });

  describe('StatusService', () => {
    test('should write status successfully', async () => {
      const status = {
        status: 'OK',
        circuitState: 'CLOSED',
        suggestedAction: 'No action needed',
        editorMessage: 'Pipeline healthy'
      };

      await writeStatus(status);

      assert.strictEqual(awsMocks.ddbMock.calls().length, 1);
      const call = awsMocks.ddbMock.call(0);
      const item = call.args[0].input.Item;
      
      assert.strictEqual(item.status, 'OK');
      assert.strictEqual(item.circuitState, 'CLOSED');
      assert.ok(item.updatedAt);
    });

    test('should read status successfully', async () => {
      const mockStatus = {
        pipeline: 'ess-publishing',
        status: 'OK',
        updatedAt: new Date().toISOString()
      };

      awsMocks.ddbMock.on(GetCommand).resolves({ Item: mockStatus });

      const result = await readStatus();
      
      assert.deepEqual(result, mockStatus);
      assert.strictEqual(awsMocks.ddbMock.calls().length, 1);
    });

    test('should throw error on DynamoDB failure for write', async () => {
      setupAWSFailures();

      await assert.rejects(
        () => writeStatus({ status: 'OK' }),
        { message: 'DynamoDB error' }
      );
    });
  });

  describe('AlertService', () => {
    test('should send alert successfully', async () => {
      const subject = 'Test Alert';
      const message = 'This is a test alert';

      await alert(subject, message);

      assert.strictEqual(awsMocks.snsMock.calls().length, 1);
      const call = awsMocks.snsMock.call(0);
      
      assert.ok(call.args[0].input instanceof PublishCommand);
      assert.strictEqual(call.args[0].input.Subject, subject);
      assert.strictEqual(call.args[0].input.Message, message);
    });

    test('should handle SNS errors gracefully', async () => {
      setupAWSFailures();

      await assert.doesNotReject(() => 
        alert('Test', 'Message')
      );
    });

    test('should skip alert when SNS topic not configured', async () => {
      // Temporarily clear SNS topic
      const originalTopic = process.env.SNS_TOPIC_ARN;
      delete process.env.SNS_TOPIC_ARN;

      await alert('Test', 'Message');

      // Should not call SNS
      assert.strictEqual(awsMocks.snsMock.calls().length, 0);

      // Restore original config
      if (originalTopic) {
        process.env.SNS_TOPIC_ARN = originalTopic;
      }
    });
  });
});
