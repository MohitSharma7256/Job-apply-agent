import { v4 as uuidv4 } from 'uuid';

// Standardized error response format
export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

// Request correlation ID middleware
export function withCorrelationId(handler) {
  return async (request, context) => {
    // Get correlation ID from header or generate new one
    const correlationId = request.headers.get('x-correlation-id') || uuidv4();
    
    // Add correlation ID to request context
    request.correlationId = correlationId;
    
    try {
      const response = await handler(request, context);
      
      // Add correlation ID to response headers
      response.headers.set('x-correlation-id', correlationId);
      return response;
    } catch (error) {
      return handleApiError(error, correlationId);
    }
  };
}

// Centralized error handler
export function handleApiError(error, correlationId = null) {
  console.error(`[${correlationId || 'NO-ID'}] API Error:`, {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    details: error.details,
    stack: error.stack
  });

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = process.env.NODE_ENV === 'production' 
    ? getProductionErrorMessage(error)
    : error.message;

  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(correlationId && { correlationId }),
      ...(process.env.NODE_ENV !== 'production' && error.details && { details: error.details })
    },
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...(correlationId && { 'x-correlation-id': correlationId })
    }
  });
}

// Production-safe error messages
function getProductionErrorMessage(error) {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return 'Invalid request data';
    case 'AUTHENTICATION_ERROR':
      return 'Authentication required';
    case 'AUTHORIZATION_ERROR':
      return 'Insufficient permissions';
    case 'NOT_FOUND':
      return 'Resource not found';
    default:
      return 'An unexpected error occurred';
  }
}

// Success response helper
export function successResponse(data, meta = {}) {
  return Response.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
}
