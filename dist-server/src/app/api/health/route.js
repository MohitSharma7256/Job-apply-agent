"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const dbService_1 = require("../../../services/dbService");
exports.runtime = 'nodejs';
async function GET(request) {
    try {
        const checks = {};
        let allHealthy = true;
        const dbStart = Date.now();
        try {
            await dbService_1.supabase.from('users').select('id').limit(1);
            checks.database = {
                status: 'healthy',
                latency: Date.now() - dbStart,
            };
        }
        catch (error) {
            checks.database = {
                status: 'unhealthy',
                error: 'Connection failed',
            };
            allHealthy = false;
        }
        // Skip Redis check during build time
        if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
            checks.redis = {
                status: 'skipped',
                error: 'Redis check skipped during build',
            };
        }
        else {
            const redisStart = Date.now();
            try {
                const redis = (await Promise.resolve().then(() => __importStar(require('../../../lib/redis')))).getRedis();
                await redis.ping();
                checks.redis = {
                    status: 'healthy',
                    latency: Date.now() - redisStart,
                };
            }
            catch (error) {
                checks.redis = {
                    status: 'unhealthy',
                    error: error.message,
                };
                allHealthy = false;
            }
        }
        // Skip queue check during build time
        if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
            checks.queue = {
                status: 'skipped',
                error: 'Queue check skipped during build',
            };
        }
        else {
            try {
                const { Queue } = await Promise.resolve().then(() => __importStar(require('bullmq')));
                const connection = {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                };
                const queue = new Queue('job-apply', { connection });
                const counts = await queue.getJobCounts();
                checks.queue = {
                    status: 'healthy',
                    waiting: counts.waiting,
                    active: counts.active,
                    completed: counts.completed,
                    failed: counts.failed,
                };
            }
            catch (error) {
                checks.queue = {
                    status: 'degraded',
                    error: error.message,
                };
            }
        }
        const platforms = [];
        const platformList = ['linkedin', 'indeed', 'naukri', 'glassdoor'];
        for (const platform of platformList) {
            const sessionStart = Date.now();
            try {
                const { data: session } = await dbService_1.supabase
                    .from('platform_sessions')
                    .select('expiresAt, status, createdAt')
                    .eq('platform', platform)
                    .order('createdAt', { ascending: false })
                    .limit(1)
                    .single();
                const sessionExpired = session ? new Date(session.expiresAt) < new Date() : true;
                platforms.push({
                    name: platform,
                    status: session && !sessionExpired ? 'online' : 'offline',
                    latency: Date.now() - sessionStart,
                    lastCheck: session?.createdAt || 'Never',
                    sessionStatus: sessionExpired ? 'expired' : session ? 'active' : 'not_configured',
                });
            }
            catch {
                platforms.push({
                    name: platform,
                    status: 'offline',
                    latency: Date.now() - sessionStart,
                    lastCheck: 'Never',
                    sessionStatus: 'not_configured',
                });
            }
        }
        checks.platforms = platforms;
        const memoryUsage = process.memoryUsage();
        checks.system = {
            uptime: process.uptime(),
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            },
            cpu: process.cpuUsage(),
        };
        return server_1.NextResponse.json({
            status: allHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            checks,
        });
    }
    catch (error) {
        console.error('Health check error:', error);
        return server_1.NextResponse.json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
