import { logger } from './logger.js';

// Error monitoring and metrics collection
export class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.metrics = {
      totalErrors: 0,
      errorsByType: {},
      errorsByEndpoint: {},
      errorsByHour: {},
      criticalErrors: [],
      recentErrors: []
    };
    this.startTime = Date.now();
    this.maxErrors = 1000; // Keep last 1000 errors
  }

  // Record an error
  recordError(error, context = {}) {
    const errorEntry = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      statusCode: error.statusCode,
      correlationId: context.correlationId,
      userId: context.userId,
      endpoint: context.endpoint,
      method: context.method,
      userAgent: context.userAgent,
      ip: context.ip,
      level: this.getErrorLevel(error),
      ...context
    };

    // Add to errors array
    this.errors.push(errorEntry);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Update metrics
    this.updateMetrics(errorEntry);

    // Log the error
    logger.error('Error recorded', errorEntry, error);

    return errorEntry.id;
  }

  // Generate unique error ID
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Determine error level
  getErrorLevel(error) {
    if (error.statusCode >= 500) return 'critical';
    if (error.statusCode >= 400) return 'warning';
    if (error.name === 'ValidationError') return 'warning';
    return 'error';
  }

  // Update error metrics
  updateMetrics(errorEntry) {
    this.metrics.totalErrors++;

    // Count by type
    const errorType = errorEntry.name || 'Unknown';
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;

    // Count by endpoint
    if (errorEntry.endpoint) {
      this.metrics.errorsByEndpoint[errorEntry.endpoint] = (this.metrics.errorsByEndpoint[errorEntry.endpoint] || 0) + 1;
    }

    // Count by hour
    const hour = new Date(errorEntry.timestamp).getHours();
    this.metrics.errorsByHour[hour] = (this.metrics.errorsByHour[hour] || 0) + 1;

    // Track critical errors
    if (errorEntry.level === 'critical') {
      this.metrics.criticalErrors.push(errorEntry);
      // Keep only last 50 critical errors
      if (this.metrics.criticalErrors.length > 50) {
        this.metrics.criticalErrors = this.metrics.criticalErrors.slice(-50);
      }
    }

    // Track recent errors (last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.metrics.recentErrors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() > oneHourAgo
    );
  }

  // Get error statistics
  getErrorStats() {
    const uptime = Date.now() - this.startTime;
    const errorsPerHour = this.metrics.totalErrors / (uptime / (1000 * 60 * 60));
    
    return {
      totalErrors: this.metrics.totalErrors,
      errorsPerHour: errorsPerHour.toFixed(2),
      criticalErrors: this.metrics.criticalErrors.length,
      recentErrors: this.metrics.recentErrors.length,
      errorsByType: this.metrics.errorsByType,
      errorsByEndpoint: this.metrics.errorsByEndpoint,
      errorsByHour: this.metrics.errorsByHour,
      uptime: uptime,
      mostCommonError: this.getMostCommonError(),
      errorRate: this.calculateErrorRate()
    };
  }

  // Get most common error
  getMostCommonError() {
    const types = this.metrics.errorsByType;
    const mostCommon = Object.keys(types).reduce((a, b) => types[a] > types[b] ? a : b, '');
    
    return {
      type: mostCommon,
      count: types[mostCommon] || 0
    };
  }

  // Calculate error rate
  calculateErrorRate() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentErrors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() > oneHourAgo
    );
    
    return (recentErrors.length / 60).toFixed(2); // errors per minute
  }

  // Get errors by time range
  getErrorsByTimeRange(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return this.errors.filter(error => {
      const errorTime = new Date(error.timestamp);
      return errorTime >= start && errorTime <= end;
    });
  }

  // Clear old errors
  clearOldErrors(olderThanHours = 24) {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    this.errors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() > cutoffTime
    );
    
    logger.info('Cleared old errors', {
      cutoffHours: olderThanHours,
      remainingErrors: this.errors.length
    });
  }
}

// Performance metrics collector
export class PerformanceMonitor {
  constructor() {
    this.requests = [];
    this.slowRequests = [];
    this.metrics = {
      totalRequests: 0,
      totalResponseTime: 0,
      requestsByEndpoint: {},
      requestsByMethod: {},
      requestsByHour: {},
      slowRequests: [],
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0
    };
    this.startTime = Date.now();
    this.maxRequests = 10000; // Keep last 10000 requests
  }

  // Record a request
  recordRequest(requestData) {
    const requestEntry = {
      id: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      method: requestData.method,
      url: requestData.url,
      statusCode: requestData.statusCode,
      responseTime: responseData.duration,
      responseSize: responseData.size || 0,
      correlationId: requestData.correlationId,
      userId: requestData.userId,
      userAgent: requestData.userAgent,
      ip: requestData.ip,
      endpoint: this.extractEndpoint(requestData.url),
      isSlow: responseData.duration > 5000 // > 5 seconds is slow
    };

    // Add to requests array
    this.requests.push(requestEntry);
    
    // Keep only recent requests
    if (this.requests.length > this.maxRequests) {
      this.requests = this.requests.slice(-this.maxRequests);
    }

    // Track slow requests
    if (requestEntry.isSlow) {
      this.slowRequests.push(requestEntry);
      // Keep only last 100 slow requests
      if (this.slowRequests.length > 100) {
        this.slowRequests = this.slowRequests.slice(-100);
      }
    }

    // Update metrics
    this.updateMetrics(requestEntry);

    return requestEntry.id;
  }

  // Generate unique request ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Extract endpoint from URL
  extractEndpoint(url) {
    // Remove query parameters and IDs
    const cleanUrl = url.split('?')[0];
    return cleanUrl.replace(/\/[a-f0-9-]{36}/g, '/:id').replace(/\/\d+/g, '/:id');
  }

  // Update performance metrics
  updateMetrics(requestEntry) {
    this.metrics.totalRequests++;
    this.metrics.totalResponseTime += requestEntry.responseTime;

    // Count by endpoint
    this.metrics.requestsByEndpoint[requestEntry.endpoint] = 
      (this.metrics.requestsByEndpoint[requestEntry.endpoint] || 0) + 1;

    // Count by method
    this.metrics.requestsByMethod[requestEntry.method] = 
      (this.metrics.requestsByMethod[requestEntry.method] || 0) + 1;

    // Count by hour
    const hour = new Date(requestEntry.timestamp).getHours();
    this.metrics.requestsByHour[hour] = (this.metrics.requestsByHour[hour] || 0) + 1;

    // Calculate percentiles
    this.calculatePercentiles();
  }

  // Calculate response time percentiles
  calculatePercentiles() {
    if (this.requests.length === 0) return;

    const responseTimes = this.requests.map(req => req.responseTime).sort((a, b) => a - b);
    const len = responseTimes.length;

    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;
    this.metrics.p95ResponseTime = responseTimes[Math.floor(len * 0.95)];
    this.metrics.p99ResponseTime = responseTimes[Math.floor(len * 0.99)];
  }

  // Get performance statistics
  getPerformanceStats() {
    const uptime = Date.now() - this.startTime;
    const requestsPerMinute = this.metrics.totalRequests / (uptime / (1000 * 60));
    
    return {
      totalRequests: this.metrics.totalRequests,
      requestsPerMinute: requestsPerMinute.toFixed(2),
      averageResponseTime: this.metrics.averageResponseTime.toFixed(2),
      p95ResponseTime: this.metrics.p95ResponseTime,
      p99ResponseTime: this.metrics.p99ResponseTime,
      slowRequests: this.slowRequests.length,
      requestsByEndpoint: this.metrics.requestsByEndpoint,
      requestsByMethod: this.metrics.requestsByMethod,
      requestsByHour: this.metrics.requestsByHour,
      uptime: uptime,
      slowestEndpoint: this.getSlowestEndpoint(),
      fastestEndpoint: this.getFastestEndpoint()
    };
  }

  // Get slowest endpoint
  getSlowestEndpoint() {
    const endpointTimes = {};
    
    this.requests.forEach(req => {
      if (!endpointTimes[req.endpoint]) {
        endpointTimes[req.endpoint] = [];
      }
      endpointTimes[req.endpoint].push(req.responseTime);
    });

    let slowest = { endpoint: '', avgTime: 0 };
    
    Object.keys(endpointTimes).forEach(endpoint => {
      const times = endpointTimes[endpoint];
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      if (avgTime > slowest.avgTime) {
        slowest = { endpoint, avgTime };
      }
    });

    return slowest;
  }

  // Get fastest endpoint
  getFastestEndpoint() {
    const endpointTimes = {};
    
    this.requests.forEach(req => {
      if (!endpointTimes[req.endpoint]) {
        endpointTimes[req.endpoint] = [];
      }
      endpointTimes[req.endpoint].push(req.responseTime);
    });

    let fastest = { endpoint: '', avgTime: Infinity };
    
    Object.keys(endpointTimes).forEach(endpoint => {
      const times = endpointTimes[endpoint];
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      if (avgTime < fastest.avgTime && times.length > 1) {
        fastest = { endpoint, avgTime };
      }
    });

    return fastest.avgTime === Infinity ? { endpoint: '', avgTime: 0 } : fastest;
  }

  // Clear old requests
  clearOldRequests(olderThanHours = 24) {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    this.requests = this.requests.filter(request => 
      new Date(request.timestamp).getTime() > cutoffTime
    );
    
    logger.info('Cleared old requests', {
      cutoffHours: olderThanHours,
      remainingRequests: this.requests.length
    });
  }
}

// Business metrics collector
export class BusinessMetrics {
  constructor() {
    this.metrics = {
      jobSearches: 0,
      resumeTailors: 0,
      jobApplications: 0,
      successfulApplications: 0,
      failedApplications: 0,
      usersActive: 0,
      jobsFound: 0,
      averageMatchScore: 0,
      processingTimes: {
        jobSearch: [],
        resumeTailor: [],
        jobApplication: []
      }
    };
    this.startTime = Date.now();
  }

  // Record job search
  recordJobSearch(data) {
    this.metrics.jobSearches++;
    this.metrics.jobsFound += data.jobsFound || 0;
    
    if (data.averageMatchScore) {
      this.updateAverageMatchScore(data.averageMatchScore);
    }
    
    if (data.processingTime) {
      this.metrics.processingTimes.jobSearch.push(data.processingTime);
    }
  }

  // Record resume tailor
  recordResumeTailor(data) {
    this.metrics.resumeTailors++;
    
    if (data.processingTime) {
      this.metrics.processingTimes.resumeTailor.push(data.processingTime);
    }
  }

  // Record job application
  recordJobApplication(data) {
    this.metrics.jobApplications++;
    
    if (data.success) {
      this.metrics.successfulApplications++;
    } else {
      this.metrics.failedApplications++;
    }
    
    if (data.processingTime) {
      this.metrics.processingTimes.jobApplication.push(data.processingTime);
    }
  }

  // Update average match score
  updateAverageMatchScore(newScore) {
    const total = this.metrics.averageMatchScore * (this.metrics.jobSearches - 1) + newScore;
    this.metrics.averageMatchScore = total / this.metrics.jobSearches;
  }

  // Get business statistics
  getBusinessStats() {
    const uptime = Date.now() - this.startTime;
    
    return {
      ...this.metrics,
      uptime: uptime,
      applicationSuccessRate: this.metrics.jobApplications > 0 
        ? ((this.metrics.successfulApplications / this.metrics.jobApplications) * 100).toFixed(2) + '%'
        : '0%',
      averageProcessingTimes: {
        jobSearch: this.getAverageTime(this.metrics.processingTimes.jobSearch),
        resumeTailor: this.getAverageTime(this.metrics.processingTimes.resumeTailor),
        jobApplication: this.getAverageTime(this.metrics.processingTimes.jobApplication)
      }
    };
  }

  // Get average time from array
  getAverageTime(times) {
    if (times.length === 0) return 0;
    return (times.reduce((sum, time) => sum + time, 0) / times.length).toFixed(2);
  }
}

// Global monitoring instances
export const errorMonitor = new ErrorMonitor();
export const performanceMonitor = new PerformanceMonitor();
export const businessMetrics = new BusinessMetrics();

// Monitoring middleware
export function withMonitoring(handler) {
  return async (request, context) => {
    const startTime = Date.now();
    const correlationId = request.headers.get('x-correlation-id');
    
    try {
      const response = await handler(request, context);
      
      // Record successful request
      const duration = Date.now() - startTime;
      performanceMonitor.recordRequest({
        method: request.method,
        url: request.url,
        statusCode: response.status,
        duration,
        correlationId,
        userId: request.user?.id,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.ip
      });
      
      return response;
    } catch (error) {
      // Record error
      const duration = Date.now() - startTime;
      
      errorMonitor.recordError(error, {
        correlationId,
        userId: request.user?.id,
        endpoint: new URL(request.url).pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.ip,
        duration
      });
      
      performanceMonitor.recordRequest({
        method: request.method,
        url: request.url,
        statusCode: error.statusCode || 500,
        duration,
        correlationId,
        userId: request.user?.id,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.ip
      });
      
      throw error;
    }
  };
}

// Get comprehensive monitoring dashboard data
export function getMonitoringData() {
  return {
    timestamp: new Date().toISOString(),
    uptime: Date.now() - errorMonitor.startTime,
    errors: errorMonitor.getErrorStats(),
    performance: performanceMonitor.getPerformanceStats(),
    business: businessMetrics.getBusinessStats(),
    system: {
      memory: process.memoryUsage(),
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version
    }
  };
}
