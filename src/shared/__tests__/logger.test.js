import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Logger, LOG_LEVELS, logMetrics } from '../logger.js';

describe('Logger', () => {
  let logger;
  let originalConsoleLog;
  let originalConsoleError;
  let originalConsoleWarn;
  let originalConsoleInfo;
  let originalConsoleDebug;
  let originalConsoleTrace;

  beforeEach(() => {
    logger = new Logger('test-service', '1.0.0');
    
    // Mock console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    originalConsoleInfo = console.info;
    originalConsoleDebug = console.debug;
    originalConsoleTrace = console.trace;
    
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
    console.trace = jest.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
    console.debug = originalConsoleDebug;
    console.trace = originalConsoleTrace;
    
    // Reset metrics
    logMetrics.reset();
  });

  describe('Log Entry Creation', () => {
    it('should create a basic log entry', () => {
      const entry = logger.createLogEntry('info', 'Test message');
      
      expect(entry).toMatchObject({
        level: 'INFO',
        service: 'test-service',
        version: '1.0.0',
        message: 'Test message',
        correlationId: expect.any(String),
        uptime: expect.any(Number)
      });
      
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include data in log entry', () => {
      const data = { userId: '123', action: 'test' };
      const entry = logger.createLogEntry('info', 'Test message', data);
      
      expect(entry).toMatchObject({
        ...data,
        level: 'INFO',
        message: 'Test message'
      });
    });

    it('should include error details in log entry', () => {
      const error = new Error('Test error');
      error.code = 'TEST_ERROR';
      const entry = logger.createLogEntry('error', 'Test message', {}, error);
      
      expect(entry.error).toMatchObject({
        name: 'Error',
        message: 'Test error',
        code: 'TEST_ERROR',
        stack: expect.any(String)
      });
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect log level settings', () => {
      const testLogger = new Logger('test', '1.0.0');
      testLogger.currentLogLevel = LOG_LEVELS.WARN;
      
      testLogger.info('Info message');
      testLogger.warn('Warn message');
      testLogger.error('Error message');
      
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Correlation ID Management', () => {
    it('should generate correlation ID when none exists', () => {
      const correlationId = logger.getCorrelationId();
      
      expect(correlationId).toMatch(/^[a-f0-9-]{36}$/);
    });

    it('should set and get correlation ID', () => {
      const testId = 'test-correlation-id';
      logger.setCorrelationId(testId);
      
      expect(logger.getCorrelationId()).toBe(testId);
      
      logger.clearCorrelationId();
      expect(logger.getCorrelationId()).not.toBe(testId);
    });
  });

  describe('Performance Logging', () => {
    it('should log performance metrics', () => {
      logger.logPerformance('test-operation', 1500, { success: true });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      );
      
      const loggedData = JSON.parse(console.info.mock.calls[0][0]);
      expect(loggedData).toMatchObject({
        operation: 'test-operation',
        duration: 1500,
        durationMs: 1500,
        success: true
      });
    });
  });

  describe('Request Logging', () => {
    it('should log request metrics', () => {
      logger.logRequest('GET', '/api/test', 200, 250, {
        userId: '123',
        userAgent: 'test-agent'
      });
      
      expect(console.info).toHaveBeenCalled();
      
      const loggedData = JSON.parse(console.info.mock.calls[0][0]);
      expect(loggedData).toMatchObject({
        method: 'GET',
        url: '/api/test',
        statusCode: 200,
        duration: 250,
        durationMs: 250,
        userId: '123',
        userAgent: 'test-agent'
      });
    });

    it('should log error requests with warn level', () => {
      logger.logRequest('POST', '/api/test', 400, 100);
      
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log server error requests with error level', () => {
      logger.logRequest('DELETE', '/api/test', 500, 300);
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Specialized Logging Methods', () => {
    it('should log job events', () => {
      logger.logJobEvent('job-123', 'started', { type: 'search' });
      
      expect(console.info).toHaveBeenCalled();
      
      const loggedData = JSON.parse(console.info.mock.calls[0][0]);
      expect(loggedData).toMatchObject({
        message: 'Job started',
        jobId: 'job-123',
        event: 'started',
        type: 'search'
      });
    });

    it('should log security events', () => {
      logger.logSecurity('unauthorized_access', { ip: '192.168.1.1' });
      
      expect(console.warn).toHaveBeenCalled();
      
      const loggedData = JSON.parse(console.warn.mock.calls[0][0]);
      expect(loggedData).toMatchObject({
        message: 'Security: unauthorized_access',
        securityEvent: 'unauthorized_access',
        ip: '192.168.1.1'
      });
    });

    it('should log business events', () => {
      logger.logBusiness('job_application', { jobId: 'job-123', success: true });
      
      expect(console.info).toHaveBeenCalled();
      
      const loggedData = JSON.parse(console.info.mock.calls[0][0]);
      expect(loggedData).toMatchObject({
        message: 'Business: job_application',
        businessEvent: 'job_application',
        jobId: 'job-123',
        success: true
      });
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with additional context', () => {
      const { createChildLogger } = require('../logger.js');
      const childLogger = createChildLogger(logger, { module: 'test-module' });
      
      const entry = childLogger.createLogEntry('info', 'Test message');
      
      expect(entry).toMatchObject({
        module: 'test-module',
        level: 'INFO',
        message: 'Test message'
      });
    });
  });
});

describe('LogMetrics', () => {
  let metrics;

  beforeEach(() => {
    metrics = new (require('../logger.js')).LogMetrics();
  });

  afterEach(() => {
    metrics.reset();
  });

  describe('Metrics Collection', () => {
    it('should record log entries', () => {
      const entry = {
        level: 'INFO',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        correlationId: 'test-id'
      };
      
      metrics.record(entry);
      
      expect(metrics.metrics.totalLogs).toBe(1);
      expect(metrics.metrics.infoCount).toBe(1);
    });

    it('should count different log levels', () => {
      const entries = [
        { level: 'INFO', message: 'Info', timestamp: new Date().toISOString() },
        { level: 'ERROR', message: 'Error', timestamp: new Date().toISOString() },
        { level: 'WARN', message: 'Warning', timestamp: new Date().toISOString() },
        { level: 'ERROR', message: 'Another Error', timestamp: new Date().toISOString() }
      ];
      
      entries.forEach(entry => metrics.record(entry));
      
      expect(metrics.metrics.totalLogs).toBe(4);
      expect(metrics.metrics.infoCount).toBe(1);
      expect(metrics.metrics.errorCount).toBe(2);
      expect(metrics.metrics.warnCount).toBe(1);
    });

    it('should track performance logs', () => {
      const entry = {
        level: 'INFO',
        message: 'Performance',
        timestamp: new Date().toISOString(),
        duration: 1500,
        operation: 'test-operation',
        correlationId: 'test-id'
      };
      
      metrics.record(entry);
      
      expect(metrics.metrics.performance).toHaveLength(1);
      expect(metrics.metrics.performance[0]).toMatchObject({
        duration: 1500,
        operation: 'test-operation',
        correlationId: 'test-id'
      });
    });

    it('should track requests', () => {
      const entry = {
        level: 'INFO',
        message: 'Request',
        timestamp: new Date().toISOString(),
        method: 'GET',
        url: '/api/test',
        correlationId: 'test-id'
      };
      
      metrics.record(entry);
      
      expect(metrics.metrics.requests).toBe(1);
    });
  });

  describe('Metrics Summary', () => {
    it('should generate metrics summary', () => {
      // Add some test data
      for (let i = 0; i < 10; i++) {
        metrics.record({
          level: i < 8 ? 'INFO' : 'ERROR',
          message: `Test ${i}`,
          timestamp: new Date().toISOString(),
          correlationId: `test-${i}`
        });
      }
      
      const summary = metrics.getMetrics();
      
      expect(summary).toMatchObject({
        totalLogs: 10,
        infoCount: 8,
        errorCount: 2,
        logsPerSecond: expect.any(String),
        errorRate: expect.any(String)
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all metrics', () => {
      // Add some data
      metrics.record({
        level: 'INFO',
        message: 'Test',
        timestamp: new Date().toISOString(),
        correlationId: 'test'
      });
      
      expect(metrics.metrics.totalLogs).toBe(1);
      
      metrics.reset();
      
      expect(metrics.metrics.totalLogs).toBe(0);
      expect(metrics.metrics.infoCount).toBe(0);
    });
  });
});
