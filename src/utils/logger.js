export class Logger {
    static info(message, meta = {}) {
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message,
        ...meta
      }));
    }
    
    static error(message, error = null, meta = {}) {
      console.error(JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        message,
        error: error?.message || error,
        stack: error?.stack,
        ...meta
      }));
    }
    
    static warn(message, meta = {}) {
      console.warn(JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        message,
        ...meta
      }));
    }
  }
  