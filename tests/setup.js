import { beforeEach } from 'node:test';

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.AWS_REGION = 'ap-south-1';
  process.env.STATUS_TABLE = 'TestPipelineStatus';
  process.env.AUDIT_TABLE = 'TestPipelineAudit';
  
  if (!process.env.DEBUG_TESTS) {
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
  }
});
