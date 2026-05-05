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
  concurrency: 2, // Step 7: Low concurrency for Render stability
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 100 },
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
    console.log(`🔄 [${name}] Processing job ${job.id}`);
    try {
      if (job.data.jobRecordId) {
        await JobTracker.updateJobStatus(job.data.jobRecordId, 'processing');
      }
      
      const result = await processor(job.data);
      
      if (job.data.jobRecordId) {
        await JobTracker.updateJobStatus(job.data.jobRecordId, 'completed', result);
      }
      
      console.log(`✅ [${name}] Job ${job.id} completed`);
      return result;
    } catch (error) {
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
