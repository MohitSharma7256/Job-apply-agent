import { v4 as uuidv4 } from 'uuid';
import { ContextManager } from './context.js';

// Log levels with severity
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Current log level from environment
const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

// Structured logger class
export class Logger {
  constructor(service = 'job-apply-agent', version = '1.0.0') {
    this.service = service;
    this.version = version;
    this.startTime = Date.now();
  }

  // Create log entry with correlation ID
  createLogEntry(level, message, data = {}, error = null) {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;
    
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.service,
      version: this.version,
      message,
      uptime,
      correlationId: data.correlationId || this.getCorrelationId(),
      ...data
    };

    // Add error details if provided
    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      };
    }

    // Add process info in production
    if (process.env.NODE_ENV === 'production') {
      logEntry.pid = process.pid;
      logEntry.hostname = require('os').hostname();
      logEntry.memory = process.memoryUsage();
    }

    return logEntry;
  }

  // Get correlation ID from current context
  getCorrelationId() {
    // Try to get from AsyncLocalStorage context
    const correlationId = ContextManager.getCorrelationId();
    if (correlationId) {
      return correlationId;
    }
    
    // Generate new one if none exists
    return uuidv4();
  }

  // Set correlation ID for current context (deprecated - use ContextManager)
  setCorrelationId(correlationId) {
    // This is deprecated - use ContextManager instead
    console.warn('setCorrelationId is deprecated. Use ContextManager instead.');
  }

  // Clear correlation ID (deprecated - use ContextManager)
  clearCorrelationId() {
    // This is deprecated - use ContextManager instead
    console.warn('clearCorrelationId is deprecated. Use ContextManager instead.');
  }

  // Log methods
  error(message, data = {}, error = null) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      const entry = this.createLogEntry('error', message, data, error);
      this.writeLog(entry);
    }
  }

  warn(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      const entry = this.createLogEntry('warn', message, data);
      this.writeLog(entry);
    }
  }

  info(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      const entry = this.createLogEntry('info', message, data);
      this.writeLog(entry);
    }
  }

  debug(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      const entry = this.createLogEntry('debug', message, data);
      this.writeLog(entry);
    }
  }

  trace(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.TRACE) {
      const entry = this.createLogEntry('trace', message, data);
      this.writeLog(entry);
    }
  }

  // Write log to console (structured JSON)
  writeLog(entry) {
    const logLine = JSON.stringify(entry);
    
    switch (entry.level) {
      case 'ERROR':
        console.error(logLine);
        break;
      case 'WARN':
        console.warn(logLine);
        break;
      case 'INFO':
        console.info(logLine);
        break;
      case 'DEBUG':
        console.debug(logLine);
        break;
      case 'TRACE':
        console.trace(logLine);
        break;
      default:
        console.log(logLine);
    }
  }

  // Performance logging
  logPerformance(operation, duration, data = {}) {
    this.info(`${operation} completed`, {
      operation,
      duration,
      durationMs: duration,
      ...data
    });
  }

  // Request logging
  logRequest(method, url, statusCode, duration, data = {}) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this[level](`${method} ${url} ${statusCode}`, {
      method,
      url,
      statusCode,
      duration,
      durationMs: duration,
      ...data
    });
  }

  // Job logging
  logJobEvent(jobId, event, data = {}) {
    this.info(`Job ${event}`, {
      jobId,
      event,
      ...data
    });
  }

  // Security logging
  logSecurity(event, data = {}) {
    this.warn(`Security: ${event}`, {
      securityEvent: event,
      ...data
    });
  }

  // Business logging
  logBusiness(event, data = {}) {
    this.info(`Business: ${event}`, {
      businessEvent: event,
      ...data
    });
  }
}

// Create default logger instance
export const logger = new Logger();

// Request correlation middleware (deprecated - use withRequestContext)
export function withCorrelationLogger(handler) {
  console.warn('withCorrelationLogger is deprecated. Use withRequestContext instead.');
  return withRequestContext(handler);
}

// Performance measurement helper
export function measurePerformance(operation, fn) {
  return async (...args) => {
    const startTime = Date.now();
    const correlationId = logger.getCorrelationId();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      logger.logPerformance(operation, duration, {
        correlationId,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.logPerformance(operation, duration, {
        correlationId,
        success: false,
        error: error.message
      });
      
      throw error;
    }
  };
}

// Create child logger with additional context
export function createChildLogger(parentLogger, context) {
  const childLogger = Object.create(parentLogger);
  childLogger.context = { ...parentLogger.context, ...context };
  
  const originalCreateLogEntry = childLogger.createLogEntry.bind(childLogger);
  childLogger.createLogEntry = (level, message, data, error) => {
    return originalCreateLogEntry(level, message, { ...childLogger.context, ...data }, error);
  };
  
  return childLogger;
}

// Log aggregation and metrics
export class LogMetrics {
  constructor() {
    this.metrics = {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0,
      traceCount: 0,
      requests: 0,
      errors: [],
      performance: []
    };
    
    this.startTime = Date.now();
  }

  // Record log entry
  record(entry) {
    this.metrics.totalLogs++;
    
    switch (entry.level) {
      case 'ERROR':
        this.metrics.errorCount++;
        this.metrics.errors.push({
          timestamp: entry.timestamp,
          message: entry.message,
          correlationId: entry.correlationId
        });
        break;
      case 'WARN':
        this.metrics.warnCount++;
        break;
      case 'INFO':
        this.metrics.infoCount++;
        break;
      case 'DEBUG':
        this.metrics.debugCount++;
        break;
      case 'TRACE':
        this.metrics.traceCount++;
        break;
    }

    // Track performance logs
    if (entry.duration) {
      this.metrics.performance.push({
        timestamp: entry.timestamp,
        operation: entry.operation,
        duration: entry.duration,
        correlationId: entry.correlationId
      });
    }

    // Track requests
    if (entry.method && entry.url) {
      this.metrics.requests++;
    }
  }

  // Get metrics summary
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    
    return {
      ...this.metrics,
      uptime,
      logsPerSecond: (this.metrics.totalLogs / (uptime / 1000)).toFixed(2),
      errorRate: this.metrics.requests > 0 
        ? ((this.metrics.errorCount / this.metrics.requests) * 100).toFixed(2) + '%'
        : '0%',
      avgResponseTime: this.metrics.performance.length > 0
        ? (this.metrics.performance.reduce((sum, p) => sum + p.duration, 0) / this.metrics.performance.length).toFixed(2) + 'ms'
        : 'N/A'
    };
  }

  // Reset metrics
  reset() {
    this.metrics = {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0,
      traceCount: 0,
      requests: 0,
      errors: [],
      performance: []
    };
    this.startTime = Date.now();
  }
}

// Global metrics instance
export const logMetrics = new LogMetrics();

// Hook into logger to collect metrics
const originalWriteLog = logger.writeLog.bind(logger);
logger.writeLog = (entry) => {
  logMetrics.record(entry);
  originalWriteLog(entry);
};
