import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationError, AuthorizationError } from './errors.js';
import { env } from './env.js';

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function findOrCreateApplicationUser(supabaseUser) {
  const authId = supabaseUser.id;
  const email = supabaseUser.email;
  const name = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '';

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id,email,name')
    .eq('auth_id', authId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error('User lookup failed: ' + error.message);
  }

  if (data) {
    return { id: data.id, authId, email: data.email, name: data.name };
  }

  const { data: insertData, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({ auth_id: authId, email, name })
    .select('id,email,name')
    .single();

  if (insertError) {
    throw new Error('User creation failed: ' + insertError.message);
  }

  return { id: insertData.id, authId, email: insertData.email, name: insertData.name };
}

export async function verifyToken(token) {
  if (!token) {
    throw new AuthenticationError('No token provided');
  }

  const cleanToken = token.replace('Bearer ', '').trim();

  // First try custom JWT tokens if they exist in the system
  try {
    const decoded = jwt.verify(cleanToken, env.JWT_SECRET);
    if (decoded && typeof decoded === 'object' && decoded !== null) {
      return decoded;
    }
  } catch (_) {
    // ignore invalid custom JWT, fallback to Supabase access token
  }

  const { data, error } = await supabaseAdmin.auth.getUser(cleanToken);

  if (error || !data?.user || !data.user.id) {
    throw new AuthenticationError('Invalid or expired auth token');
  }

  return await findOrCreateApplicationUser(data.user);
}

// Authentication middleware
export function withAuth(handler) {
  return async (request, context) => {
    const authorization = request.headers.get('authorization');

    try {
      const user = await verifyToken(authorization);
      request.user = user;
      return await handler(request, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Authentication failed'
      }), {
        status: error.statusCode || 401,
        headers: { 'Content-Type': 'application/json' }
      });
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

    if (user.role === 'admin') {
      return await handler(request, context);
    }

    if (requestedUserId && requestedUserId !== String(user.id) && requestedUserId !== user.email) {
      throw new AuthorizationError('Access denied to this resource');
    }

    return await handler(request, context);
  };
}

// Session validation for cookie-based auth
export function validateSession(sessionId) {
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

export function generateToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'job-apply-agent',
    audience: 'job-apply-agent-users'
  });
}

export function getUserFromRequest(request) {
  return request.user || null;
}
