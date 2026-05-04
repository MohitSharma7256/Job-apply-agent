import { v4 as uuidv4 } from 'uuid';

// Domain event types
export const EVENT_TYPES = {
  // Job lifecycle events
  JOB_FOUND: 'job_found',
  JOB_SAVED: 'job_saved',
  JOB_APPLIED: 'job_applied',
  APPLICATION_STARTED: 'application_started',
  APPLICATION_SUCCEEDED: 'application_succeeded',
  APPLICATION_FAILED: 'application_failed',
  
  // AI processing events
  RESUME_TAILORED: 'resume_tailored',
  COVER_LETTER_GENERATED: 'cover_letter_generated',
  PROFILE_OPTIMIZED: 'profile_optimized',
  JOB_MATCH_PREDICTED: 'job_match_predicted',
  
  // System events
  JOB_QUEUED: 'job_queued',
  JOB_STARTED: 'job_started',
  JOB_COMPLETED: 'job_completed',
  JOB_FAILED: 'job_failed',
  JOB_CANCELLED: 'job_cancelled',
  JOB_PROGRESS: 'job_progress',
  
  // User events
  USER_CONNECTED: 'user_connected',
  USER_DISCONNECTED: 'user_disconnected',
  NOTIFICATION_SENT: 'notification_sent'
};

// Event severity levels
export const EVENT_SEVERITY = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Domain event class
export class DomainEvent {
  constructor(type, data, userId, severity = EVENT_SEVERITY.INFO, metadata = {}) {
    this.id = uuidv4();
    this.type = type;
    this.data = data;
    this.userId = userId;
    this.severity = severity;
    this.timestamp = new Date().toISOString();
    this.metadata = {
      correlationId: metadata.correlationId || null,
      source: metadata.source || 'system',
      version: metadata.version || '1.0',
      ...metadata
    };
  }

  // Serialize for transport
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      data: this.data,
      userId: this.userId,
      severity: this.severity,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }

  // Create from JSON
  static fromJSON(json) {
    const event = new DomainEvent(
      json.type,
      json.data,
      json.userId,
      json.severity,
      json.metadata
    );
    event.id = json.id;
    event.timestamp = json.timestamp;
    return event;
  }
}

// Event emitter for domain events
export class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  // Subscribe to events
  on(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(listener);
    
    // Return unsubscribe function
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

  // Subscribe to events once
  once(eventType, listener) {
    const unsubscribe = this.on(eventType, (...args) => {
      listener(...args);
      unsubscribe();
    });
    return unsubscribe;
  }

  // Emit event
  emit(event) {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
    }
  }

  // Emit event by type and data
  emitByType(type, data, userId, severity = EVENT_SEVERITY.INFO, metadata = {}) {
    const event = new DomainEvent(type, data, userId, severity, metadata);
    this.emit(event);
    return event;
  }

  // Get all event types with listeners
  getEventTypes() {
    return Array.from(this.listeners.keys());
  }

  // Get listener count for event type
  getListenerCount(eventType) {
    return this.listeners.get(eventType)?.size || 0;
  }

  // Clear all listeners
  clear() {
    this.listeners.clear();
  }

  // Clear listeners for specific event type
  clearEventType(eventType) {
    this.listeners.delete(eventType);
  }
}

// Global event emitter instance
export const eventEmitter = new EventEmitter();

// Convenience functions for common events
export const emitJobEvent = (eventType, jobData, userId, severity = EVENT_SEVERITY.INFO) => {
  return eventEmitter.emitByType(eventType, jobData, userId, severity, {
    source: 'job_processor',
    category: 'job_lifecycle'
  });
};

export const emitAIEvent = (eventType, aiData, userId, severity = EVENT_SEVERITY.INFO) => {
  return eventEmitter.emitByType(eventType, aiData, userId, severity, {
    source: 'ai_processor',
    category: 'ai_processing'
  });
};

export const emitSystemEvent = (eventType, systemData, userId, severity = EVENT_SEVERITY.INFO) => {
  return eventEmitter.emitByType(eventType, systemData, userId, severity, {
    source: 'system',
    category: 'system_event'
  });
};

export const emitUserEvent = (eventType, userData, userId, severity = EVENT_SEVERITY.INFO) => {
  return eventEmitter.emitByType(eventType, userData, userId, severity, {
    source: 'user_system',
    category: 'user_interaction'
  });
};

// Event validation
export const validateEvent = (event) => {
  const required = ['id', 'type', 'data', 'userId', 'timestamp', 'severity'];
  const missing = required.filter(field => !event[field]);
  
  if (missing.length > 0) {
    throw new Error(`Event validation failed. Missing fields: ${missing.join(', ')}`);
  }
  
  if (!Object.values(EVENT_TYPES).includes(event.type)) {
    throw new Error(`Invalid event type: ${event.type}`);
  }
  
  if (!Object.values(EVENT_SEVERITY).includes(event.severity)) {
    throw new Error(`Invalid event severity: ${event.severity}`);
  }
  
  return true;
};

// Event aggregation for analytics
export class EventAggregator {
  constructor() {
    this.events = [];
    this.maxSize = 1000; // Keep last 1000 events
  }

  // Add event to aggregation
  addEvent(event) {
    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.maxSize) {
      this.events = this.events.slice(-this.maxSize);
    }
  }

  // Get events by type
  getEventsByType(type, limit = 100) {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit);
  }

  // Get events by user
  getEventsByUser(userId, limit = 100) {
    return this.events
      .filter(event => event.userId === userId)
      .slice(-limit);
  }

  // Get events by time range
  getEventsByTimeRange(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return this.events.filter(event => {
      const eventTime = new Date(event.timestamp);
      return eventTime >= start && eventTime <= end;
    });
  }

  // Get event statistics
  getStatistics() {
    const stats = {
      total: this.events.length,
      byType: {},
      bySeverity: {},
      byUser: {},
      recent: this.events.slice(-10)
    };

    this.events.forEach(event => {
      // Count by type
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
      
      // Count by user
      stats.byUser[event.userId] = (stats.byUser[event.userId] || 0) + 1;
    });

    return stats;
  }

  // Clear old events
  clear() {
    this.events = [];
  }
}

// Global event aggregator
export const eventAggregator = new EventAggregator();
