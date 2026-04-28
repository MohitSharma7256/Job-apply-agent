import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { supabase } from '../../../services/supabaseService';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change';
const SOCKET_PORT = process.env.SOCKET_PORT || 3001;

const io = new SocketIOServer({
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

async function verifyToken(token: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; sub: string };
    return decoded.userId || decoded.sub;
  } catch {
    return null;
  }
}

io.use(async (socket: AuthenticatedSocket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new Error('Authentication required'));
  }

  const userId = await verifyToken(token);
  if (!userId) {
    return next(new Error('Invalid token'));
  }

  socket.userId = userId;
  next();
});

io.on('connection', async (socket: AuthenticatedSocket) => {
  const userId = socket.userId;
  console.log(`User ${userId} connected`);

  const room = `user:${userId}`;
  await socket.join(room);

  socket.emit('connected', { userId, timestamp: new Date().toISOString() });

  try {
    const { data: queueStatus } = await supabase
      .from('job_queue')
      .select('status')
      .eq('userId', userId);
    
    const stats = {
      total: queueStatus?.length || 0,
      pending: queueStatus?.filter(q => q.status === 'queued').length || 0,
      processing: queueStatus?.filter(q => q.status === 'processing').length || 0,
      done: queueStatus?.filter(q => q.status === 'completed').length || 0,
      failed: queueStatus?.filter(q => q.status === 'failed').length || 0,
    };
    
    socket.emit('queue:status', stats);
  } catch (e) {
    console.error('Queue status fetch failed:', e);
  }

  socket.on('queue:pause', async () => {
    console.log(`User ${userId} paused queue`);
    io.to(room).emit('queue:paused', { userId });
  });

  socket.on('queue:resume', async () => {
    console.log(`User ${userId} resumed queue`);
    io.to(room).emit('queue:resumed', { userId });
  });

  socket.on('apply:cancel', async (data: { jobId: string }) => {
    console.log(`User ${userId} cancelled job ${data.jobId}`);
    await supabase
      .from('job_queue')
      .update({ status: 'cancelled' })
      .eq('jobId', data.jobId)
      .eq('userId', userId);
    
    io.to(room).emit('job:cancelled', { jobId: data.jobId });
  });

  socket.on('session:refresh', async (data: { platform: string }) => {
    console.log(`User ${userId} refreshed session for ${data.platform}`);
    io.to(room).emit('session:refreshing', { platform: data.platform });
  });

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

export function emitToUser(userId: string, event: string, data: any) {
  const room = `user:${userId}`;
  io.to(room).emit(event, data);
}

export function emitJobFound(userId: string, job: { id: string; title: string; company: string; score: number; platform: string }) {
  emitToUser(userId, 'job:found', job);
}

export function emitJobApplying(userId: string, job: { id: string; step: string }) {
  emitToUser(userId, 'job:applying', job);
}

export function emitJobApplied(userId: string, application: { id: string; jobId: string; timestamp: string }) {
  emitToUser(userId, 'job:applied', application);
}

export function emitJobFailed(userId: string, job: { id: string; reason: string; willRetry: boolean }) {
  emitToUser(userId, 'job:failed', job);
}

export function emitJobSkipped(userId: string, job: { id: string; reason: string }) {
  emitToUser(userId, 'job:skipped', job);
}

export function emitQueueStatus(userId: string, status: { total: number; pending: number; processing: number; done: number; failed: number }) {
  emitToUser(userId, 'queue:status', status);
}

export function emitPlatformHealth(userId: string, platform: string, health: { status: 'ok' | 'degraded' | 'down'; latency: number }) {
  emitToUser(userId, 'platform:health', { platform, ...health });
}

export function emitSessionExpired(userId: string, platform: string) {
  emitToUser(userId, 'session:expired', { platform, requiresRelogin: true });
}

export function emitCaptchaDetected(userId: string, data: { jobId: string; platform: string; screenshotUrl: string }) {
  emitToUser(userId, 'captcha:detected', data);
}

export function startSocketServer(httpServer: HTTPServer) {
  io.attach(httpServer);
  console.log(`Socket.io server running on port ${SOCKET_PORT}`);
  
  setInterval(async () => {
    const platforms = ['linkedin', 'indeed', 'naukri', 'apna', 'internshala', 'shine'];
    
    for (const platform of platforms) {
      const status = Math.random() > 0.1 ? 'ok' : Math.random() > 0.5 ? 'degraded' : 'down';
      const latency = status === 'ok' ? 200 + Math.random() * 300 : status === 'degraded' ? 800 + Math.random() * 500 : 2000;
      
      io.emit('platform:health', { platform, status, latency, timestamp: new Date().toISOString() });
    }
  }, 30000);
}

export { io };
