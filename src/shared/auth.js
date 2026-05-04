import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from './errors.js';
import { env } from './env.js';

// JWT token verification
export function verifyToken(token) {
  try {
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    // Remove "Bearer " prefix if present
    const cleanToken = token.replace('Bearer ', '');
    
    return jwt.verify(cleanToken, env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token expired');
    }
    throw error;
  }
}

// Authentication middleware
export function withAuth(handler) {
  return async (request, context) => {
    const authorization = request.headers.get('authorization');
    
    try {
      const user = verifyToken(authorization);
      request.user = user;
      return await handler(request, context);
    } catch (error) {
      throw error;
    }
  };
}

// Role-based authorization
export function requireRole(requiredRole) {
  return (handler) => {
    return async (request, context) => {
      const user = request.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      if (user.role !== requiredRole && user.role !== 'admin') {
        throw new AuthorizationError(`Requires ${requiredRole} role`);
      }

      return await handler(request, context);
    };
  };
}

// User authorization (users can only access their own data)
export function requireUserOwnership(handler) {
  return async (request, context) => {
    const user = request.user;
    const requestedUserId = context.params?.userId || request.nextUrl.searchParams.get('userId');

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    // Admin can access any user data
    if (user.role === 'admin') {
      return await handler(request, context);
    }

    // Users can only access their own data
    if (requestedUserId && requestedUserId !== user.id && requestedUserId !== user.email) {
      throw new AuthorizationError('Access denied to this resource');
    }

    return await handler(request, context);
  };
}

// Session validation for cookie-based auth
export function validateSession(sessionId) {
  // TODO: Implement session validation with database
  // This would check the sessions table in Supabase
  return { valid: true, userId: 'demo-user' };
}

// Cookie-based authentication middleware
export function withSessionAuth(handler) {
  return async (request, context) => {
    const sessionId = request.cookies.get('sessionId')?.value;

    try {
      const session = validateSession(sessionId);
      
      if (!session.valid) {
        throw new AuthenticationError('Invalid session');
      }

      request.user = { id: session.userId };
      return await handler(request, context);
    } catch (error) {
      throw error;
    }
  };
}

// Generate JWT token
export function generateToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'job-apply-agent',
    audience: 'job-apply-agent-users'
  });
}

// Extract user from request (for internal use)
export function getUserFromRequest(request) {
  return request.user || null;
}
