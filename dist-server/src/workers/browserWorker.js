"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBrowserWorker = void 0;
const bullmq_1 = require("bullmq");
const dbService_1 = require("../services/dbService");
const automationService_1 = require("../services/automationService");
const startBrowserWorker = (io) => {
    // Only start worker if Redis is configured
    if (!process.env.REDIS_HOST && process.env.NODE_ENV === 'production') {
        console.warn('[Worker] Redis not configured, skipping worker initialization');
        return null;
    }
    try {
        const worker = new bullmq_1.Worker('browser-queue', async (job) => {
            const { userId, jobId, jobData, profile } = job.data;
            console.log(`[Worker] Processing job ${jobId} for user ${userId}`);
            try {
                // Inject cookies, emit "Applying" event via Socket.io
                io.to(`user:${userId}`).emit('job:status', {
                    jobId,
                    status: 'applying',
                    message: `Applying to ${jobData.company}...`
                });
                // 2. Execute Playwright Automation
                const result = await automationService_1.automationService.applyToJob(jobData, profile, userId);
                if (result.success) {
                    // 3. Update DB
                    await dbService_1.supabase
                        .from('applications')
                        .update({ status: 'applied', appliedAt: new Date().toISOString() })
                        .eq('jobId', jobId)
                        .eq('userId', userId);
                    // 4. Emit success
                    io.to(`user:${userId}`).emit('job:status', {
                        jobId,
                        status: 'applied',
                        message: `Successfully applied to ${jobData.company}!`
                    });
                }
                else {
                    throw new Error(result.message);
                }
            }
            catch (error) {
                console.error(`[Worker] Job ${jobId} failed:`, error.message);
                io.to(`user:${userId}`).emit('job:status', {
                    jobId,
                    status: 'failed',
                    message: `Failed: ${error.message}`
                });
                throw error; // Let BullMQ handle retry
            }
        }, {
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                maxRetriesPerRequest: 3,
                retryDelayOnFailover: 100,
            },
            concurrency: 1, // Limit concurrent jobs to reduce memory usage
        });
        worker.on('error', (err) => {
            console.error('[Worker] Worker error:', err);
        });
        console.log('[Worker] Browser worker initialized successfully');
        return worker;
    }
    catch (error) {
        console.error('[Worker] Failed to initialize browser worker:', error);
        return null;
    }
};
exports.startBrowserWorker = startBrowserWorker;
