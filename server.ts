import 'dotenv/config';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

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

  io.on('connection', (socket) => {
    console.log('[Socket] User connected');
    
    socket.on('disconnect', () => {
      console.log('[Socket] User disconnected');
    });
  });

  // Start server immediately - no background workers for production stability
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Server listening on http://localhost:${PORT}`);
    console.log('> Server ready for production');
  });
});
