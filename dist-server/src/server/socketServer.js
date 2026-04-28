"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
exports.emitToUser = emitToUser;
exports.emitJobFound = emitJobFound;
exports.emitJobApplying = emitJobApplying;
exports.emitJobApplied = emitJobApplied;
exports.emitJobFailed = emitJobFailed;
exports.emitJobSkipped = emitJobSkipped;
exports.emitQueueStatus = emitQueueStatus;
exports.emitPlatformHealth = emitPlatformHealth;
exports.emitSessionExpired = emitSessionExpired;
exports.emitCaptchaDetected = emitCaptchaDetected;
exports.startSocketServer = startSocketServer;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dbService_1 = require("../services/dbService");
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change';
const SOCKET_PORT = process.env.SOCKET_PORT || 3001;
const io = new socket_io_1.Server({
    cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || '*',
        methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});
exports.io = io;
async function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded.userId || decoded.sub;
    }
    catch {
        return null;
    }
}
io.use(async (socket, next) => {
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
io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`User ${userId} connected`);
    const room = `user:${userId}`;
    await socket.join(room);
    socket.emit('connected', { userId, timestamp: new Date().toISOString() });
    try {
        const { data: queueStatus } = await dbService_1.supabase
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
    }
    catch (e) {
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
    socket.on('apply:cancel', async (data) => {
        console.log(`User ${userId} cancelled job ${data.jobId}`);
        await dbService_1.supabase
            .from('job_queue')
            .update({ status: 'cancelled' })
            .eq('jobId', data.jobId)
            .eq('userId', userId);
        io.to(room).emit('job:cancelled', { jobId: data.jobId });
    });
    socket.on('session:refresh', async (data) => {
        console.log(`User ${userId} refreshed session for ${data.platform}`);
        io.to(room).emit('session:refreshing', { platform: data.platform });
    });
    socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected`);
    });
});
function emitToUser(userId, event, data) {
    const room = `user:${userId}`;
    io.to(room).emit(event, data);
}
function emitJobFound(userId, job) {
    emitToUser(userId, 'job:found', job);
}
function emitJobApplying(userId, job) {
    emitToUser(userId, 'job:applying', job);
}
function emitJobApplied(userId, application) {
    emitToUser(userId, 'job:applied', application);
}
function emitJobFailed(userId, job) {
    emitToUser(userId, 'job:failed', job);
}
function emitJobSkipped(userId, job) {
    emitToUser(userId, 'job:skipped', job);
}
function emitQueueStatus(userId, status) {
    emitToUser(userId, 'queue:status', status);
}
function emitPlatformHealth(userId, platform, health) {
    emitToUser(userId, 'platform:health', { platform, ...health });
}
function emitSessionExpired(userId, platform) {
    emitToUser(userId, 'session:expired', { platform, requiresRelogin: true });
}
function emitCaptchaDetected(userId, data) {
    emitToUser(userId, 'captcha:detected', data);
}
function startSocketServer(httpServer) {
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
