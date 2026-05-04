import { Worker } from 'bullmq';
import { redisConnection, createConnection, QUEUES } from '../src/shared/queue.js';
import { JobTracker } from '../src/shared/queue.js';
import { processJobSearch } from './processors/jobSearchProcessor.js';
import { processResumeTailor } from './processors/resumeTailorProcessor.js';
import { processJobApply } from './processors/jobApplyProcessor.js';
import { processAIRequest } from './processors/aiProcessor.js';
import { processWebAutomation } from './processors/webAutomationProcessor.js';

// Worker configuration
const workerConfig = {
  connection: redisConnection,
  concurrency: {
    [QUEUES.JOB_SEARCH]: 2,
    [QUEUES.RESUME_TAILOR]: 3,
    [QUEUES.JOB_APPLY]: 1,
    [QUEUES.AI_PROCESSING]: 5,
    [QUEUES.WEB_AUTOMATION]: 2,
  },
};

// Create workers
const workers = {};

// Job search worker
workers[QUEUES.JOB_SEARCH] = new Worker(
  QUEUES.JOB_SEARCH,
  async (job) => {
    const startTime = Date.now();
    console.log(`🔄 [${QUEUES.JOB_SEARCH}] Processing job ${job.id}`);
    
    try {
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'processing');
      
      const result = await processJobSearch(job.data);
      
      const processingTime = Date.now() - startTime;
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'completed', result, null);
      
      // Update processing metrics
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'completed', {
        ...result,
        processingTimeMs: processingTime,
      });
      
      console.log(`✅ [${QUEUES.JOB_SEARCH}] Job ${job.id} completed in ${processingTime}ms`);
      return result;
    } catch (error) {
      console.error(`❌ [${QUEUES.JOB_SEARCH}] Job ${job.id} failed:`, error);
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'failed', null, error);
      throw error;
    }
  },
  {
    connection: createConnection(),
    concurrency: workerConfig.concurrency[QUEUES.JOB_SEARCH],
  }
);

// Resume tailor worker
workers[QUEUES.RESUME_TAILOR] = new Worker(
  QUEUES.RESUME_TAILOR,
  async (job) => {
    const startTime = Date.now();
    console.log(`🔄 [${QUEUES.RESUME_TAILOR}] Processing job ${job.id}`);
    
    try {
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'processing');
      
      const result = await processResumeTailor(job.data);
      
      const processingTime = Date.now() - startTime;
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'completed', {
        ...result,
        processingTimeMs: processingTime,
      });
      
      console.log(`✅ [${QUEUES.RESUME_TAILOR}] Job ${job.id} completed in ${processingTime}ms`);
      return result;
    } catch (error) {
      console.error(`❌ [${QUEUES.RESUME_TAILOR}] Job ${job.id} failed:`, error);
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'failed', null, error);
      throw error;
    }
  },
  {
    connection: createConnection(),
    concurrency: workerConfig.concurrency[QUEUES.RESUME_TAILOR],
  }
);

// Job apply worker
workers[QUEUES.JOB_APPLY] = new Worker(
  QUEUES.JOB_APPLY,
  async (job) => {
    const startTime = Date.now();
    console.log(`🔄 [${QUEUES.JOB_APPLY}] Processing job ${job.id}`);
    
    try {
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'processing');
      
      const result = await processJobApply(job.data);
      
      const processingTime = Date.now() - startTime;
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'completed', {
        ...result,
        processingTimeMs: processingTime,
      });
      
      console.log(`✅ [${QUEUES.JOB_APPLY}] Job ${job.id} completed in ${processingTime}ms`);
      return result;
    } catch (error) {
      console.error(`❌ [${QUEUES.JOB_APPLY}] Job ${job.id} failed:`, error);
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'failed', null, error);
      throw error;
    }
  },
  {
    connection: createConnection(),
    concurrency: workerConfig.concurrency[QUEUES.JOB_APPLY],
  }
);

// AI processing worker
workers[QUEUES.AI_PROCESSING] = new Worker(
  QUEUES.AI_PROCESSING,
  async (job) => {
    const startTime = Date.now();
    console.log(`🔄 [${QUEUES.AI_PROCESSING}] Processing job ${job.id}`);
    
    try {
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'processing');
      
      const result = await processAIRequest(job.data);
      
      const processingTime = Date.now() - startTime;
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'completed', {
        ...result,
        processingTimeMs: processingTime,
      });
      
      console.log(`✅ [${QUEUES.AI_PROCESSING}] Job ${job.id} completed in ${processingTime}ms`);
      return result;
    } catch (error) {
      console.error(`❌ [${QUEUES.AI_PROCESSING}] Job ${job.id} failed:`, error);
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'failed', null, error);
      throw error;
    }
  },
  {
    connection: createConnection(),
    concurrency: workerConfig.concurrency[QUEUES.AI_PROCESSING],
  }
);

// Web automation worker
workers[QUEUES.WEB_AUTOMATION] = new Worker(
  QUEUES.WEB_AUTOMATION,
  async (job) => {
    const startTime = Date.now();
    console.log(`🔄 [${QUEUES.WEB_AUTOMATION}] Processing job ${job.id}`);
    
    try {
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'processing');
      
      const result = await processWebAutomation(job.data);
      
      const processingTime = Date.now() - startTime;
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'completed', {
        ...result,
        processingTimeMs: processingTime,
      });
      
      console.log(`✅ [${QUEUES.WEB_AUTOMATION}] Job ${job.id} completed in ${processingTime}ms`);
      return result;
    } catch (error) {
      console.error(`❌ [${QUEUES.WEB_AUTOMATION}] Job ${job.id} failed:`, error);
      await JobTracker.updateJobStatus(job.data.jobRecordId, 'failed', null, error);
      throw error;
    }
  },
  {
    connection: createConnection(),
    concurrency: workerConfig.concurrency[QUEUES.WEB_AUTOMATION],
  }
);

// Error handling for all workers
Object.values(workers).forEach(worker => {
  worker.on('error', (err) => {
    console.error('❌ Worker error:', err);
  });

  worker.on('stalled', (job) => {
    console.warn(`⚠️  Job ${job.id} stalled`);
  });

  worker.on('completed', (job) => {
    console.log(`✅ Worker completed job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Worker failed job ${job.id}:`, err);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down workers...');
  
  try {
    await Promise.all(Object.values(workers).map(worker => worker.close()));
    console.log('✅ All workers shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error shutting down workers:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down workers (SIGTERM)...');
  
  try {
    await Promise.all(Object.values(workers).map(worker => worker.close()));
    console.log('✅ All workers shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error shutting down workers:', error);
    process.exit(1);
  }
});

// Export workers for monitoring
export { workers };

// Start workers if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting BullMQ workers...');
  console.log(`📊 Worker concurrency:`, workerConfig.concurrency);
}
