import dotenv from 'dotenv';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { cronService } from './src/services/cronService.js';
import { redis } from './src/shared/redis.js';
import { createSocketServer, setupEventListeners } from './src/shared/socket.js';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// STEP 1: PORT FIX - Use process.env.PORT directly as Render injects it
const PORT = process.env.PORT || 5000;

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    
    // Convert URL object to the format Next.js expects
    const legacyParsedUrl = {
      pathname: parsedUrl.pathname,
      query: Object.fromEntries(parsedUrl.searchParams),
    };
    // STEP 8: HEALTH CHECK ENDPOINT
    if (parsedUrl.pathname === '/health') {
      redis.ping()
        .then(() => {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('✅ OK - Redis Connected');
        })
        .catch((err) => {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('❌ Redis Down: ' + err.message);
        });
      return;
    }

    handle(req, res, legacyParsedUrl);
  });

  // Create authenticated Socket.IO server
  const io = createSocketServer(httpServer);
  global.socketIO = io;

  // Initialize event listeners
  setupEventListeners();

  // Start automation crons
  cronService.startAll();

  httpServer.listen(PORT, () => {
    console.log(`🚀 Production Server listening on PORT: ${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log('📡 Real-time Socket.IO initialized');
    console.log('⚙️ Cron jobs started');
  });
});
