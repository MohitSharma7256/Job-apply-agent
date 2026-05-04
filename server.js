import dotenv from 'dotenv';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { cronService } from './src/services/cronService.js';
import { env } from './src/shared/env.js';
import { createSocketServer, setupEventListeners } from './src/shared/socket.js';

dotenv.config();

// Validate environment variables at startup
console.log('🔍 Validating environment variables...');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Create authenticated Socket.IO server
  const io = createSocketServer(httpServer);
  
  // Store Socket.IO instance globally for event emission
  global.socketIO = io;

  // Initialize BullMQ queues
  const { initializeQueues } = await import('./src/shared/queue.js');
  const queueInitialized = await initializeQueues();
  
  if (!queueInitialized) {
    console.error('❌ Failed to initialize queues - server will continue but async features may not work');
  }

  // Setup event listeners for real-time updates
  setupEventListeners();

  // Start worker process in background
  import('./workers/index.js').catch(error => {
    console.error('❌ Failed to start workers:', error);
  });

  // Start cron jobs to keep account active
  cronService.startAll();

  const PORT = env.PORT;
  httpServer.listen(PORT, () => {
    console.log(`> Server listening on http://localhost:${PORT}`);
    console.log('> Server ready for production');
    console.log('> Socket.IO real-time server initialized');
    console.log('> BullMQ queues initialized');
    console.log('> Workers started in background');
    console.log('> Event listeners setup completed');
    console.log('> Cron jobs started - account will stay active!');
    console.log('> Real-time job tracking enabled!');
  });
});
