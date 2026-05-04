import { logger } from '../../shared/logger.js';
import { contextualEventEmitter } from '../../shared/context.js';

// Circuit Breaker States
export const CircuitBreakerState = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open'
};

// SLA Configuration Schema
export const SLASchema = {
  maxDuration: 300000, // 5 minutes
  maxErrorRate: 0.05, // 5%
  minSuccessRate: 0.95, // 95%
  maxRetries: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000, // 1 minute
  fallbackTimeout: 30000 // 30 seconds
};

// Circuit Breaker Implementation
export class CircuitBreaker {
  constructor(name, config = {}) {
    this.name = name;
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      recoveryTimeout: config.recoveryTimeout || 60000,
      monitoringPeriod: config.monitoringPeriod || 10000,
      ...config
    };
  }

  async execute(operation, context = {}) {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        logger.info(`Circuit breaker ${this.name} transitioning to HALF_OPEN`, {
          name: this.name,
          failureCount: this.failureCount
        });
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN - operation blocked`);
      }
    }

    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      this.onSuccess();
      
      contextualEventEmitter.emitByType('circuit_breaker.success', {
        name: this.name,
        state: this.state,
        duration: Date.now() - startTime
      }, context.userId);
      
      return result;
    } catch (error) {
      this.onFailure();
      
      contextualEventEmitter.emitByType('circuit_breaker.failure', {
        name: this.name,
        state: this.state,
        error: error.message,
        duration: Date.now() - startTime
      }, context.userId);
      
      throw error;
    }
  }

  onSuccess() {
    this.successCount++;
    this.lastSuccessTime = Date.now();
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.CLOSED;
      this.failureCount = 0;
      logger.info(`Circuit breaker ${this.name} reset to CLOSED`, {
        name: this.name,
        successCount: this.successCount
      });
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      logger.warn(`Circuit breaker ${this.name} opened`, {
        name: this.name,
        failureCount: this.failureCount,
        threshold: this.config.failureThreshold
      });
    }
  }

  shouldAttemptReset() {
    return Date.now() - this.lastFailureTime > this.config.recoveryTimeout;
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime
    };
  }

  reset() {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    
    logger.info(`Circuit breaker ${this.name} manually reset`, {
      name: this.name
    });
  }
}

// SLA Monitor
export class SLAMonitor {
  constructor(name, slaConfig = {}) {
    this.name = name;
    this.sla = { ...SLASchema, ...slaConfig };
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalDuration: 0,
      violations: {
        duration: 0,
        errorRate: 0,
        successRate: 0
      }
    };
    this.startTime = Date.now();
  }

  recordRequest(duration, success = true, error = null) {
    this.metrics.totalRequests++;
    this.metrics.totalDuration += duration;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      this.metrics.violations.errorRate++;
    }

    // Check duration violation
    if (duration > this.sla.maxDuration) {
      this.metrics.violations.duration++;
    }

    // Check success rate violation
    const currentSuccessRate = this.getSuccessRate();
    if (currentSuccessRate < this.sla.minSuccessRate) {
      this.metrics.violations.successRate++;
    }

    // Emit SLA metrics
    contextualEventEmitter.emitByType('sla.metrics', {
      name: this.name,
      duration,
      success,
      error: error?.message,
      successRate: currentSuccessRate,
      errorRate: this.getErrorRate(),
      violations: this.metrics.violations
    });
  }

  getSuccessRate() {
    if (this.metrics.totalRequests === 0) return 1.0;
    return this.metrics.successfulRequests / this.metrics.totalRequests;
  }

  getErrorRate() {
    if (this.metrics.totalRequests === 0) return 0.0;
    return this.metrics.failedRequests / this.metrics.totalRequests;
  }

  getAverageDuration() {
    if (this.metrics.totalRequests === 0) return 0;
    return this.metrics.totalDuration / this.metrics.totalRequests;
  }

  isCompliant() {
    return (
      this.getAverageDuration() <= this.sla.maxDuration &&
      this.getErrorRate() <= this.sla.maxErrorRate &&
      this.getSuccessRate() >= this.sla.minSuccessRate
    );
  }

  getMetrics() {
    return {
      name: this.name,
      sla: this.sla,
      metrics: { ...this.metrics },
      calculated: {
        successRate: this.getSuccessRate(),
        errorRate: this.getErrorRate(),
        averageDuration: this.getAverageDuration(),
        compliant: this.isCompliant(),
        uptime: Date.now() - this.startTime
      }
    };
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalDuration: 0,
      violations: {
        duration: 0,
        errorRate: 0,
        successRate: 0
      }
    };
    this.startTime = Date.now();
  }
}

// Retry Manager with SLA Awareness
export class RetryManager {
  constructor(config = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      ...config
    };
  }

  async executeWithRetry(operation, context = {}, slaMonitor = null) {
    let lastError;
    let attempt = 0;
    const maxAttempts = this.config.maxRetries + 1;

    while (attempt < maxAttempts) {
      const startTime = Date.now();
      
      try {
        const result = await operation();
        
        // Record success
        if (slaMonitor) {
          slaMonitor.recordRequest(Date.now() - startTime, true);
        }
        
        if (attempt > 0) {
          logger.info(`Operation succeeded after ${attempt} retries`, {
            operation: context.operation,
            attempt,
            totalDuration: Date.now() - startTime
          });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        attempt++;
        
        // Record failure
        if (slaMonitor) {
          slaMonitor.recordRequest(Date.now() - startTime, false, error);
        }

        // Check if we should retry
        if (attempt >= maxAttempts || !this.shouldRetry(error, attempt)) {
          logger.error(`Operation failed after ${attempt - 1} retries`, {
            operation: context.operation,
            attempts: attempt - 1,
            error: error.message
          });
          throw error;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt);
        
        logger.warn(`Operation failed, retrying in ${delay}ms`, {
          operation: context.operation,
          attempt,
          error: error.message,
          nextRetryIn: delay
        });

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  shouldRetry(error, attempt) {
    // Don't retry on certain error types
    const nonRetryableErrors = [
      'ValidationError',
      'AuthenticationError',
      'AuthorizationError',
      'NotFoundError'
    ];

    if (nonRetryableErrors.includes(error.name)) {
      return false;
    }

    // Don't retry on HTTP status codes that indicate client errors
    if (error.statusCode && (error.statusCode >= 400 && error.statusCode < 500)) {
      return false;
    }

    return true;
  }

  calculateDelay(attempt) {
    let delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, this.config.maxDelay);

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }
}

// Fallback Manager
export class FallbackManager {
  constructor() {
    this.fallbackChains = new Map();
    this.fallbackMetrics = new Map();
  }

  registerFallback(primaryName, fallbacks) {
    this.fallbackChains.set(primaryName, fallbacks);
    
    // Initialize metrics
    if (!this.fallbackMetrics.has(primaryName)) {
      this.fallbackMetrics.set(primaryName, {
        primary: { attempts: 0, successes: 0, failures: 0 },
        fallbacks: fallbacks.map(() => ({ attempts: 0, successes: 0, failures: 0 }))
      });
    }
    
    logger.info(`Fallback chain registered for ${primaryName}`, {
      primary: primaryName,
      fallbacks: fallbacks.length
    });
  }

  async executeWithFallback(primaryName, operation, context = {}) {
    const fallbacks = this.fallbackChains.get(primaryName) || [];
    const metrics = this.fallbackMetrics.get(primaryName);
    
    let lastError;
    let executedProvider = primaryName;

    // Try primary provider
    try {
      metrics.primary.attempts++;
      const result = await operation();
      metrics.primary.successes++;
      
      contextualEventEmitter.emitByType('fallback.primary_success', {
        primary: primaryName,
        operation: context.operation
      }, context.userId);
      
      return result;
    } catch (error) {
      lastError = error;
      metrics.primary.failures++;
      
      logger.warn(`Primary provider ${primaryName} failed, trying fallbacks`, {
        primary: primaryName,
        error: error.message,
        fallbackCount: fallbacks.length
      });
    }

    // Try fallback providers
    for (let i = 0; i < fallbacks.length; i++) {
      const fallbackProvider = fallbacks[i];
      executedProvider = fallbackProvider;
      
      try {
        metrics.fallbacks[i].attempts++;
        
        // Get fallback operation
        const fallbackOperation = await this.getFallbackOperation(fallbackProvider, context);
        
        const result = await fallbackOperation();
        metrics.fallbacks[i].successes++;
        
        contextualEventEmitter.emitByType('fallback.success', {
          primary: primaryName,
          fallback: fallbackProvider,
          fallbackIndex: i,
          operation: context.operation
        }, context.userId);
        
        logger.info(`Fallback provider ${fallbackProvider} succeeded`, {
          primary: primaryName,
          fallback: fallbackProvider,
          fallbackIndex: i
        });
        
        return result;
      } catch (error) {
        lastError = error;
        metrics.fallbacks[i].failures++;
        
        logger.warn(`Fallback provider ${fallbackProvider} failed`, {
          primary: primaryName,
          fallback: fallbackProvider,
          fallbackIndex: i,
          error: error.message
        });
      }
    }

    // All providers failed
    contextualEventEmitter.emitByType('fallback.all_failed', {
      primary: primaryName,
      operation: context.operation,
      error: lastError.message
    }, context.userId);

    throw new Error(`All providers failed for ${primaryName}. Last error: ${lastError.message}`);
  }

  async getFallbackOperation(fallbackProvider, context) {
    // This would be implemented based on the specific fallback provider
    // For now, return a placeholder operation
    return async () => {
      throw new Error(`Fallback operation not implemented for ${fallbackProvider}`);
    };
  }

  getMetrics(primaryName) {
    return this.fallbackMetrics.get(primaryName);
  }

  getAllMetrics() {
    const allMetrics = {};
    for (const [primaryName, metrics] of this.fallbackMetrics) {
      allMetrics[primaryName] = metrics;
    }
    return allMetrics;
  }
}

// Resilience Manager - Combines all resilience patterns
export class ResilienceManager {
  constructor() {
    this.circuitBreakers = new Map();
    this.slaMonitors = new Map();
    this.retryManager = new RetryManager();
    this.fallbackManager = new FallbackManager();
  }

  createCircuitBreaker(name, config) {
    const circuitBreaker = new CircuitBreaker(name, config);
    this.circuitBreakers.set(name, circuitBreaker);
    return circuitBreaker;
  }

  createSLAMonitor(name, slaConfig) {
    const slaMonitor = new SLAMonitor(name, slaConfig);
    this.slaMonitors.set(name, slaMonitor);
    return slaMonitor;
  }

  registerFallback(primaryName, fallbacks) {
    this.fallbackManager.registerFallback(primaryName, fallbacks);
  }

  async executeResilientOperation(name, operation, context = {}, options = {}) {
    const circuitBreaker = this.circuitBreakers.get(name);
    const slaMonitor = this.slaMonitors.get(name);
    const useFallback = options.useFallback !== false;
    const useRetry = options.useRetry !== false;

    const executeOperation = async () => {
      if (circuitBreaker) {
        return await circuitBreaker.execute(operation, context);
      }
      return await operation();
    };

    const executeWithRetry = async () => {
      if (useRetry) {
        return await this.retryManager.executeWithRetry(executeOperation, context, slaMonitor);
      }
      return await executeOperation();
    };

    if (useFallback && this.fallbackManager.fallbackChains.has(name)) {
      return await this.fallbackManager.executeWithFallback(name, executeWithRetry, context);
    }

    return await executeWithRetry();
  }

  getCircuitBreakerState(name) {
    const circuitBreaker = this.circuitBreakers.get(name);
    return circuitBreaker ? circuitBreaker.getState() : null;
  }

  getSLAMetrics(name) {
    const slaMonitor = this.slaMonitors.get(name);
    return slaMonitor ? slaMonitor.getMetrics() : null;
  }

  getAllCircuitBreakerStates() {
    const states = {};
    for (const [name, circuitBreaker] of this.circuitBreakers) {
      states[name] = circuitBreaker.getState();
    }
    return states;
  }

  getAllSLAMetrics() {
    const metrics = {};
    for (const [name, slaMonitor] of this.slaMonitors) {
      metrics[name] = slaMonitor.getMetrics();
    }
    return metrics;
  }

  getFallbackMetrics() {
    return this.fallbackManager.getAllMetrics();
  }

  resetAll() {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
    for (const slaMonitor of this.slaMonitors.values()) {
      slaMonitor.reset();
    }
  }
}

// Global resilience manager instance
export const resilienceManager = new ResilienceManager();

// Initialize default circuit breakers and SLA monitors
export function initializeResilience() {
  // Create circuit breakers for major platforms
  resilienceManager.createCircuitBreaker('linkedin', {
    failureThreshold: 5,
    recoveryTimeout: 60000,
    monitoringPeriod: 10000
  });

  resilienceManager.createCircuitBreaker('naukri', {
    failureThreshold: 4,
    recoveryTimeout: 90000,
    monitoringPeriod: 15000
  });

  resilienceManager.createCircuitBreaker('indeed', {
    failureThreshold: 6,
    recoveryTimeout: 45000,
    monitoringPeriod: 8000
  });

  resilienceManager.createCircuitBreaker('ai_service', {
    failureThreshold: 3,
    recoveryTimeout: 120000,
    monitoringPeriod: 20000
  });

  // Create SLA monitors
  resilienceManager.createSLAMonitor('linkedin_operations', {
    maxDuration: 300000, // 5 minutes
    maxErrorRate: 0.05,
    minSuccessRate: 0.95,
    maxRetries: 3
  });

  resilienceManager.createSLAMonitor('naukri_operations', {
    maxDuration: 240000, // 4 minutes
    maxErrorRate: 0.08,
    minSuccessRate: 0.90,
    maxRetries: 2
  });

  resilienceManager.createSLAMonitor('indeed_operations', {
    maxDuration: 180000, // 3 minutes
    maxErrorRate: 0.06,
    minSuccessRate: 0.92,
    maxRetries: 3
  });

  resilienceManager.createSLAMonitor('ai_operations', {
    maxDuration: 60000, // 1 minute
    maxErrorRate: 0.02,
    minSuccessRate: 0.98,
    maxRetries: 2
  });

  // Register fallback chains
  resilienceManager.registerFallback('linkedin', ['naukri', 'indeed']);
  resilienceManager.registerFallback('naukri', ['linkedin', 'indeed']);
  resilienceManager.registerFallback('indeed', ['linkedin', 'naukri']);
  resilienceManager.registerFallback('ai_service', ['fallback_ai', 'mock_ai']);

  logger.info('Resilience infrastructure initialized', {
    circuitBreakers: resilienceManager.circuitBreakers.size,
    slaMonitors: resilienceManager.slaMonitors.size,
    fallbackChains: resilienceManager.fallbackManager.fallbackChains.size
  });
}
