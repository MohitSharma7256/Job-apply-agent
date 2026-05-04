import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage for request-scoped context
const contextStore = new AsyncLocalStorage();

// Request context interface
export class RequestContext {
  constructor(correlationId, userId = null, metadata = {}) {
    this.correlationId = correlationId;
    this.userId = userId;
    this.metadata = metadata;
    this.startTime = Date.now();
  }

  // Get duration since context creation
  getDuration() {
    return Date.now() - this.startTime;
  }

  // Add metadata
  addMetadata(key, value) {
    this.metadata[key] = value;
    return this;
  }

  // Get metadata
  getMetadata(key) {
    return this.metadata[key];
  }

  // Get all metadata
  getAllMetadata() {
    return { ...this.metadata };
  }

  // Serialize for logging
  toLogObject() {
    return {
      correlationId: this.correlationId,
      userId: this.userId,
      duration: this.getDuration(),
      ...this.metadata
    };
  }
}

// Context manager
export class ContextManager {
  static createRequestContext(correlationId, userId, metadata = {}) {
    return new RequestContext(correlationId, userId, metadata);
  }

  static getCurrentContext() {
    return contextStore.getStore();
  }

  static runWithContext(context, callback) {
    return contextStore.run(context, callback);
  }

  static getCorrelationId() {
    const context = this.getCurrentContext();
    return context?.correlationId;
  }

  static getUserId() {
    const context = this.getCurrentContext();
    return context?.userId;
  }

  static getMetadata(key) {
    const context = this.getCurrentContext();
    return context?.getMetadata(key);
  }

  static getAllMetadata() {
    const context = this.getCurrentContext();
    return context?.getAllMetadata() || {};
  }

  static addMetadata(key, value) {
    const context = this.getCurrentContext();
    if (context) {
      context.addMetadata(key, value);
    }
  }

  static getDuration() {
    const context = this.getCurrentContext();
    return context?.getDuration() || 0;
  }
}

// Middleware for setting up request context
export function withRequestContext(handler) {
  return async (request, context) => {
    // Generate correlation ID from header or create new one
    const correlationId = request.headers.get('x-correlation-id') || 
                         request.headers.get('x-request-id') ||
                         `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get user ID from request (set by auth middleware)
    const userId = request.user?.id;
    
    // Create request context
    const requestContext = ContextManager.createRequestContext(
      correlationId, 
      userId, 
      {
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.ip,
        timestamp: new Date().toISOString()
      }
    );

    // Run handler within context
    return ContextManager.runWithContext(requestContext, async () => {
      try {
        const response = await handler(request, context);
        
        // Add correlation ID to response headers
        response.headers.set('x-correlation-id', correlationId);
        
        return response;
      } catch (error) {
        // Error will be logged with context by the error handler
        throw error;
      }
    });
  };
}

// Context-aware logger wrapper
export function createContextualLogger(baseLogger) {
  return {
    info: (message, data = {}) => {
      const context = ContextManager.getCurrentContext();
      const logData = context ? context.toLogObject() : {};
      baseLogger.info(message, { ...logData, ...data });
    },
    
    warn: (message, data = {}) => {
      const context = ContextManager.getCurrentContext();
      const logData = context ? context.toLogObject() : {};
      baseLogger.warn(message, { ...logData, ...data });
    },
    
    error: (message, data = {}, error = null) => {
      const context = ContextManager.getCurrentContext();
      const logData = context ? context.toLogObject() : {};
      baseLogger.error(message, { ...logData, ...data }, error);
    },
    
    debug: (message, data = {}) => {
      const context = ContextManager.getCurrentContext();
      const logData = context ? context.toLogObject() : {};
      baseLogger.debug(message, { ...logData, ...data });
    },
    
    trace: (message, data = {}) => {
      const context = ContextManager.getCurrentContext();
      const logData = context ? context.toLogObject() : {};
      baseLogger.trace(message, { ...logData, ...data });
    }
  };
}

// Event emitter with context
export class ContextualEventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(listener);
    
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  emit(event) {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          // Run listener within current context
          ContextManager.runWithContext(ContextManager.getCurrentContext(), () => {
            listener(event);
          });
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
    }
  }

  emitByType(type, data, userId, severity = 'info', metadata = {}) {
    const context = ContextManager.getCurrentContext();
    const correlationId = context?.correlationId;
    const currentUserId = context?.userId || userId;
    
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      userId: currentUserId,
      correlationId,
      severity,
      timestamp: new Date().toISOString(),
      metadata: {
        ...context?.getAllMetadata(),
        ...metadata
      }
    };

    this.emit(event);
    return event;
  }
}

// Global contextual event emitter
export const contextualEventEmitter = new ContextualEventEmitter();

// Context-aware performance measurement
export function measureWithContext(operation, fn) {
  return async (...args) => {
    const startTime = Date.now();
    const context = ContextManager.getCurrentContext();
    const correlationId = context?.correlationId;
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      // Log performance with context
      const logger = createContextualLogger(require('./logger.js').logger);
      logger.logPerformance(operation, duration, {
        correlationId,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log performance with context
      const logger = createContextualLogger(require('./logger.js').logger);
      logger.logPerformance(operation, duration, {
        correlationId,
        success: false,
        error: error.message
      });
      
      throw error;
    }
  };
}

// Context-aware error monitoring
export function recordErrorWithContext(error, additionalContext = {}) {
  const context = ContextManager.getCurrentContext();
  const errorMonitor = require('./monitoring.js').errorMonitor;
  
  const contextData = {
    correlationId: context?.correlationId,
    userId: context?.userId,
    duration: context?.getDuration(),
    ...context?.getAllMetadata(),
    ...additionalContext
  };
  
  return errorMonitor.recordError(error, contextData);
}

// Context-aware performance monitoring
export function recordPerformanceWithContext(operation, data = {}) {
  const context = ContextManager.getCurrentContext();
  const performanceMonitor = require('./monitoring.js').performanceMonitor;
  
  const contextData = {
    correlationId: context?.correlationId,
    userId: context?.userId,
    duration: context?.getDuration(),
    ...context?.getAllMetadata(),
    ...data
  };
  
  return performanceMonitor.recordRequest(contextData);
}

// Export for testing
export function resetContextStore() {
  // This is only for testing purposes
  if (process.env.NODE_ENV === 'test') {
    contextStore.enterWith(new RequestContext('test-correlation-id'));
  }
}
