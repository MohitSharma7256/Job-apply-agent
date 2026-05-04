import { Server } from 'socket.io';
import { verifyToken } from './auth.js';
import { eventEmitter, EVENT_TYPES, EVENT_SEVERITY } from './events.js';
import { getJobInfo } from './queue.js';

// Socket.IO server setup
export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.CORS_ALLOWLIST?.split(',') || [process.env.NEXT_PUBLIC_APP_URL]
        : ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const user = verifyToken(token);
      socket.user = user;
      socket.userId = user.id;
      
      console.log(`[Socket] User ${user.id} authenticated`);
      next();
    } catch (error) {
      console.error('[Socket] Authentication failed:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`[Socket] User ${userId} connected (${socket.id})`);

    // Join user to their personal room
    socket.join(`user:${userId}`);
    
    // Join user to role-based rooms
    if (socket.user.role === 'admin') {
      socket.join('role:admin');
    }
    
    // Emit user connected event
    eventEmitter.emitByType(EVENT_TYPES.USER_CONNECTED, {
      socketId: socket.id,
      connectedAt: new Date().toISOString()
    }, userId, EVENT_SEVERITY.INFO);

    // Send initial state to user
    sendInitialState(socket, userId);

    // Handle job status requests
    socket.on('job:status', async (data) => {
      try {
        const { jobId } = data;
        
        if (!jobId) {
          socket.emit('error', { message: 'Job ID is required' });
          return;
        }

        const jobInfo = await getJobInfo(jobId);
        
        if (!jobInfo) {
          socket.emit('error', { message: 'Job not found' });
          return;
        }

        // Verify user can access this job
        if (jobInfo.input?.userId !== userId) {
          socket.emit('error', { message: 'Access denied to this job' });
          return;
        }

        socket.emit('job:status:update', jobInfo);
      } catch (error) {
        console.error('[Socket] Job status error:', error);
        socket.emit('error', { message: 'Failed to get job status' });
      }
    });

    // Handle job cancellation
    socket.on('job:cancel', async (data) => {
      try {
        const { jobId } = data;
        
        if (!jobId) {
          socket.emit('error', { message: 'Job ID is required' });
          return;
        }

        const jobInfo = await getJobInfo(jobId);
        
        if (!jobInfo) {
          socket.emit('error', { message: 'Job not found' });
          return;
        }

        // Verify user can access this job
        if (jobInfo.input?.userId !== userId) {
          socket.emit('error', { message: 'Access denied to this job' });
          return;
        }

        // Cancel job (implementation in queue module)
        const { cancelJob } = await import('./queue.js');
        await cancelJob(jobId);

        socket.emit('job:cancelled', { jobId });
      } catch (error) {
        console.error('[Socket] Job cancel error:', error);
        socket.emit('error', { message: 'Failed to cancel job' });
      }
    });

    // Handle job retry
    socket.on('job:retry', async (data) => {
      try {
        const { jobId } = data;
        
        if (!jobId) {
          socket.emit('error', { message: 'Job ID is required' });
          return;
        }

        const jobInfo = await getJobInfo(jobId);
        
        if (!jobInfo) {
          socket.emit('error', { message: 'Job not found' });
          return;
        }

        // Verify user can access this job
        if (jobInfo.input?.userId !== userId) {
          socket.emit('error', { message: 'Access denied to this job' });
          return;
        }

        // Retry job (implementation in queue module)
        const { retryJob } = await import('./queue.js');
        await retryJob(jobId);

        socket.emit('job:retried', { jobId });
      } catch (error) {
        console.error('[Socket] Job retry error:', error);
        socket.emit('error', { message: 'Failed to retry job' });
      }
    });

    // Handle subscription to job updates
    socket.on('job:subscribe', (data) => {
      const { jobId } = data;
      
      if (!jobId) {
        socket.emit('error', { message: 'Job ID is required' });
        return;
      }

      // Join job-specific room
      socket.join(`job:${jobId}`);
      console.log(`[Socket] User ${userId} subscribed to job ${jobId}`);
    });

    // Handle unsubscription from job updates
    socket.on('job:unsubscribe', (data) => {
      const { jobId } = data;
      
      if (jobId) {
        socket.leave(`job:${jobId}`);
        console.log(`[Socket] User ${userId} unsubscribed from job ${jobId}`);
      }
    });

    // Handle ping for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User ${userId} disconnected (${socket.id}) - Reason: ${reason}`);
      
      // Emit user disconnected event
      eventEmitter.emitByType(EVENT_TYPES.USER_DISCONNECTED, {
        socketId: socket.id,
        disconnectedAt: new Date().toISOString(),
        reason
      }, userId, EVENT_SEVERITY.INFO);
    });
  });

  return io;
}

// Send initial state to newly connected user
async function sendInitialState(socket, userId) {
  try {
    // Send recent jobs (last 10)
    const { dbService } = await import('../services/dbService.js');
    const { data: recentJobs } = await dbService.getJobs(userId, 10, 0);
    
    socket.emit('initial:jobs', {
      jobs: recentJobs || [],
      timestamp: new Date().toISOString()
    });

    // Send recent applications (last 10)
    const { data: recentApplications } = await dbService.getApplications(userId, 10, 0);
    
    socket.emit('initial:applications', {
      applications: recentApplications || [],
      timestamp: new Date().toISOString()
    });

    // Send user profile
    const { data: profile } = await dbService.getProfile(userId);
    
    if (profile) {
      socket.emit('initial:profile', {
        profile,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[Socket] Initial state sent to user ${userId}`);
  } catch (error) {
    console.error('[Socket] Failed to send initial state:', error);
    socket.emit('error', { message: 'Failed to load initial data' });
  }
}

// Emit job events to appropriate rooms
export function emitJobEvent(eventType, jobData, jobId, userId) {
  const io = global.socketIO;
  
  if (!io) {
    console.warn('[Socket] Socket.IO not initialized');
    return;
  }

  const event = {
    type: eventType,
    data: jobData,
    jobId,
    userId,
    timestamp: new Date().toISOString()
  };

  // Emit to user's personal room
  io.to(`user:${userId}`).emit(`job:${eventType}`, event);

  // Emit to job-specific room (if anyone is subscribed)
  if (jobId) {
    io.to(`job:${jobId}`).emit(`job:${eventType}`, event);
  }

  // Emit to admin room for monitoring
  io.to('role:admin').emit(`admin:job:${eventType}`, event);

  console.log(`[Socket] Job event ${eventType} emitted for user ${userId}, job ${jobId}`);
}

// Emit system events
export function emitSystemEvent(eventType, data, targetRoom = null) {
  const io = global.socketIO;
  
  if (!io) {
    console.warn('[Socket] Socket.IO not initialized');
    return;
  }

  const event = {
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  };

  if (targetRoom) {
    io.to(targetRoom).emit(`system:${eventType}`, event);
  } else {
    io.emit(`system:${eventType}`, event);
  }

  console.log(`[Socket] System event ${eventType} emitted`);
}

// Emit notification to user
export function emitNotification(userId, notification) {
  const io = global.socketIO;
  
  if (!io) {
    console.warn('[Socket] Socket.IO not initialized');
    return;
  }

  const notificationEvent = {
    id: notification.id || Date.now().toString(),
    type: notification.type || 'info',
    title: notification.title,
    message: notification.message,
    data: notification.data || {},
    timestamp: new Date().toISOString(),
    read: false
  };

  io.to(`user:${userId}`).emit('notification', notificationEvent);

  // Emit notification sent event
  eventEmitter.emitByType(EVENT_TYPES.NOTIFICATION_SENT, {
    notificationId: notificationEvent.id,
    userId
  }, userId, EVENT_SEVERITY.INFO);

  console.log(`[Socket] Notification sent to user ${userId}: ${notification.title}`);
}

// Get connected users count
export function getConnectedUsersCount() {
  const io = global.socketIO;
  
  if (!io) {
    return 0;
  }

  const sockets = io.sockets.sockets;
  const connectedUsers = new Set();
  
  sockets.forEach(socket => {
    if (socket.userId) {
      connectedUsers.add(socket.userId);
    }
  });

  return connectedUsers.size;
}

// Get user connection status
export function isUserConnected(userId) {
  const io = global.socketIO;
  
  if (!io) {
    return false;
  }

  const sockets = io.sockets.sockets;
  
  for (const socket of sockets.values()) {
    if (socket.userId === userId) {
      return true;
    }
  }

  return false;
}

// Broadcast to all connected users
export function broadcast(eventType, data) {
  const io = global.socketIO;
  
  if (!io) {
    console.warn('[Socket] Socket.IO not initialized');
    return;
  }

  io.emit(eventType, {
    data,
    timestamp: new Date().toISOString()
  });
}

// Setup event listeners for real-time updates
export function setupEventListeners() {
  // Listen to domain events and emit to sockets
  eventEmitter.on(EVENT_TYPES.JOB_QUEUED, (event) => {
    emitJobEvent('queued', event.data, event.data.jobId, event.userId);
  });

  eventEmitter.on(EVENT_TYPES.JOB_STARTED, (event) => {
    emitJobEvent('started', event.data, event.data.jobId, event.userId);
  });

  eventEmitter.on(EVENT_TYPES.JOB_PROGRESS, (event) => {
    emitJobEvent('progress', event.data, event.data.jobId, event.userId);
  });

  eventEmitter.on(EVENT_TYPES.JOB_COMPLETED, (event) => {
    emitJobEvent('completed', event.data, event.data.jobId, event.userId);
    
    // Send success notification
    emitNotification(event.userId, {
      type: 'success',
      title: 'Job Completed',
      message: `${event.data.type} completed successfully`,
      data: { jobId: event.data.jobId }
    });
  });

  eventEmitter.on(EVENT_TYPES.JOB_FAILED, (event) => {
    emitJobEvent('failed', event.data, event.data.jobId, event.userId);
    
    // Send error notification
    emitNotification(event.userId, {
      type: 'error',
      title: 'Job Failed',
      message: `${event.data.type} failed: ${event.data.error}`,
      data: { jobId: event.data.jobId }
    });
  });

  eventEmitter.on(EVENT_TYPES.JOB_CANCELLED, (event) => {
    emitJobEvent('cancelled', event.data, event.data.jobId, event.userId);
  });

  console.log('[Socket] Event listeners setup completed');
}
