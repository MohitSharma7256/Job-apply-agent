import 'dotenv/config';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { supabase } from './src/services/supabaseService';
import { emailService } from './src/services/emailService';
import { startBrowserWorker } from './src/workers/browserWorker';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Auth Middleware for Sockets
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: Token missing'));

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return next(new Error('Authentication error: Invalid token'));

    socket.data.userId = user.id;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] User connected: ${userId}`);
    
    // Join private room
    socket.join(`user:${userId}`);

    socket.on('queue:pause', () => {
      console.log(`[Socket] Queue pause requested by ${userId}`);
      // Logic to pause BullMQ worker for this user
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId}`);
    });
  });

  // Start Background Workers
  const worker = startBrowserWorker(io);

  // Background Inbox Scanning (Every 1 hour)
  setInterval(async () => {
    console.log('[Cron] Running background inbox scan...');
    // In production, loop through all active users
    await emailService.scanInbox('default-user');
  }, 60 * 60 * 1000);

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Server listening on http://localhost:${PORT}`);
  });
});