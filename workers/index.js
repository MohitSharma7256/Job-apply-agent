import { Worker } from 'bullmq';
import { redis } from '../src/shared/redis.js';
import { JobTracker } from '../src/shared/queue.js';
import { processJobSearch } from './processors/jobSearchProcessor.js';
import { processResumeTailor } from './processors/resumeTailorProcessor.js';
import { processJobApply } from './processors/jobApplyProcessor.js';
import { processAIRequest } from './processors/aiProcessor.js';
import { processWebAutomation } from './processors/webAutomationProcessor.js';

// Optimized Worker Configuration for Render
const WORKER_OPTIONS = {
  connection: redis,
  concurrency: 1, // Step 5: Absolute minimum concurrency for Puppeteer stability
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 100 },
  limiter: {
    max: 5,
    duration: 1000 // Rate limiting: Max 5 jobs per second
  },
  timeout: 120000 // Timeout: Fail job if it takes longer than 2 minutes
};

// Queue names
const QUEUES = {
  JOB_SEARCH: 'job-search',
  RESUME_TAILOR: 'resume-tailor',
  JOB_APPLY: 'job-apply',
  AI_PROCESSING: 'ai-processing',
  WEB_AUTOMATION: 'web-automation',
};

const createWorker = (name, processor) => {
  const worker = new Worker(name, async (job) => {
    // 📝 Testing Logs: Identify exact duration
    console.log("JOB START:", job.id, Date.now());
    console.log(`🔄 [${name}] Processing job ${job.id}`);
    try {
      if (job.data.jobRecordId) {
        await JobTracker.updateJobStatus(job.data.jobRecordId, 'processing');
      }
      
      // Pass the full job object to allow progress tracking (job.updateProgress)
      const result = await processor(job.data, job);
      
      if (job.data.jobRecordId) {
        await JobTracker.updateJobStatus(job.data.jobRecordId, 'completed', result);
      }
      
      console.log(`✅ [${name}] Job ${job.id} completed`);
      console.log("JOB END:", job.id, Date.now());
      return result;
    } catch (error) {
      console.log("JOB FAIL:", job.id, error.message);
      console.error(`❌ [${name}] Job ${job.id} failed:`, error.message);
      if (job.data.jobRecordId) {
        await JobTracker.updateJobStatus(job.data.jobRecordId, 'failed', null, error.message);
      }
      throw error;
    }
  }, WORKER_OPTIONS);

  worker.on('error', (err) => {
    console.error(`❌ [${name}] Worker Error:`, err.message);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`🚨 [${name}] Job ${job?.id} failed critically:`, err.message);
  });

  return worker;
};

// Initialize Workers using Single Redis Connection
const workers = {
  [QUEUES.JOB_SEARCH]: createWorker(QUEUES.JOB_SEARCH, processJobSearch),
  [QUEUES.RESUME_TAILOR]: createWorker(QUEUES.RESUME_TAILOR, processResumeTailor),
  [QUEUES.JOB_APPLY]: createWorker(QUEUES.JOB_APPLY, processJobApply),
  [QUEUES.AI_PROCESSING]: createWorker(QUEUES.AI_PROCESSING, processAIRequest),
  [QUEUES.WEB_AUTOMATION]: createWorker(QUEUES.WEB_AUTOMATION, processWebAutomation),
};

// Step 8: Dedicated Worker Health Check System
setInterval(async () => {
  try {
    await redis.ping();
  } catch (error) {
    console.error('🚨 Worker Health Check Failed! Redis connection lost:', error.message);
  }
}, 30000);

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`🔄 [${signal}] Shutting down workers...`);
  await Promise.all(Object.values(workers).map(worker => worker.close()));
  console.log('✅ Workers shut down successfully');
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export { workers };
console.log('🚀 Worker pool initialized with shared Redis connection and concurrency: 2');
