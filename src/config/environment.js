export const CONFIG = {
  // Core service config
  pipelineName: process.env.PIPELINE_NAME || 'ess-publishing',
  port: Number(process.env.PORT || 8080),
  healthIntervalMs: Number(process.env.HEALTH_INTERVAL_MS || 10000),

  // AWS config
  region: process.env.AWS_REGION || 'us-east-1',
  statusTable: process.env.STATUS_TABLE || 'PipelineStatus',
  auditTable: process.env.AUDIT_TABLE || 'PipelineAudit',
  snsTopicArn: process.env.SNS_TOPIC_ARN || null,

  // Circuit breaker tuning
  breakerOptions: {
    timeout: Number(process.env.BREAKER_TIMEOUT || 5000),
    errorThresholdPercentage: Number(process.env.ERROR_THRESHOLD || 50),
    volumeThreshold: Number(process.env.VOLUME_THRESHOLD || 5),
    resetTimeout: Number(process.env.RESET_TIMEOUT || 15000)
  },

  // Health checks (simple defaults; can be overridden by env)
  checks: [
    {
      name: 'ValidatorAPI',
      type: 'http',
      url: process.env.VALIDATOR_URL || 'https://validator.example.com/health',
      method: 'GET',
      timeout: 4000
    },
    {
      name: 'QueueReachability',
      type: 'http',
      url: process.env.QUEUE_HEALTH_URL || '',
      method: 'GET',
      timeout: 4000
    },
    {
      name: 'DBWrite',
      type: 'dbwrite',
      table: process.env.STATUS_TABLE || 'PipelineStatus'
    }
  ],

  validatorWarmUrl: process.env.VALIDATOR_WARM_URL || null,
  auditTtlDays: Number(process.env.AUDIT_TTL_DAYS || 7)
};

// Validation
export function validateConfig() {
  const required = ['VALIDATOR_URL', 'SNS_TOPIC_ARN'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!Array.isArray(CONFIG.checks) || CONFIG.checks.length === 0) {
    throw new Error('No valid health checks configured');
  }
}
