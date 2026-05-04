import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env.js';
import { dbService } from '../services/dbService.js';

// Redis connection configuration
const getRedisConnection = () => {
  const url = env.REDIS_URL || process.env.REDIS_URL;
  
  if (url) {
    console.log('📡 Using Redis URL from environment');
    return url;
  }
  
  console.warn('⚠️ REDIS_URL not found, falling back to localhost:6379');
  return {
    host: 'localhost',
    port: 6379,
  };
};

export const redisConnection = getRedisConnection();

// Connection options
const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Create connection function
export const createConnection = () => {
  if (typeof redisConnection === 'string') {
    return new Redis(redisConnection, redisOptions);
  }
  return new Redis({ ...redisConnection, ...redisOptions });
};

// Queue configuration
const queueConfig = {
  connection: createConnection(),
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,           // Default retry attempts
    backoff: {
      type: 'exponential',
      delay: 2000,        // Start with 2 seconds
    },
  },
};

// Define queue names
export const QUEUES = {
  JOB_SEARCH: 'job-search',
  RESUME_TAILOR: 'resume-tailor',
  JOB_APPLY: 'job-apply',
  AI_PROCESSING: 'ai-processing',
  WEB_AUTOMATION: 'web-automation',
  DEAD_LETTER: 'dead-letter',
};

// Create queues (each gets its own connection to avoid issues)
export const queues = {
  [QUEUES.JOB_SEARCH]: new Queue(QUEUES.JOB_SEARCH, { ...queueConfig, connection: createConnection() }),
  [QUEUES.RESUME_TAILOR]: new Queue(QUEUES.RESUME_TAILOR, { ...queueConfig, connection: createConnection() }),
  [QUEUES.JOB_APPLY]: new Queue(QUEUES.JOB_APPLY, { ...queueConfig, connection: createConnection() }),
  [QUEUES.AI_PROCESSING]: new Queue(QUEUES.AI_PROCESSING, { ...queueConfig, connection: createConnection() }),
  [QUEUES.WEB_AUTOMATION]: new Queue(QUEUES.WEB_AUTOMATION, { ...queueConfig, connection: createConnection() }),
  [QUEUES.DEAD_LETTER]: new Queue(QUEUES.DEAD_LETTER, { ...queueConfig, connection: createConnection() }),
};

// Create queue events for monitoring
export const queueEvents = {
  [QUEUES.JOB_SEARCH]: new QueueEvents(QUEUES.JOB_SEARCH, { connection: createConnection() }),
  [QUEUES.RESUME_TAILOR]: new QueueEvents(QUEUES.RESUME_TAILOR, { connection: createConnection() }),
  [QUEUES.JOB_APPLY]: new QueueEvents(QUEUES.JOB_APPLY, { connection: createConnection() }),
  [QUEUES.AI_PROCESSING]: new QueueEvents(QUEUES.AI_PROCESSING, { connection: createConnection() }),
  [QUEUES.WEB_AUTOMATION]: new QueueEvents(QUEUES.WEB_AUTOMATION, { connection: createConnection() }),
};

// Job status tracking
export class JobTracker {
  static async createJobRecord(jobData) {
    try {
      const { data } = await dbService.createAIActivity({
        user_id: jobData.userId,
        activity_type: jobData.type,
        input_data: jobData,
        status: 'queued',
        created_at: new Date().toISOString(),
      });
      
      return data.id;
    } catch (error) {
      console.error('Failed to create job record:', error);
      return null;
    }
  }

  static async updateJobStatus(jobId, status, result = null, error = null) {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (result) {
        updates.output_data = result;
      }

      if (error) {
        updates.error_message = error.message || String(error);
      }

      await dbService.supabase
        .from('ai_activities')
        .update(updates)
        .eq('id', jobId);
    } catch (err) {
      console.error('Failed to update job status:', err);
    }
  }

  static async getJobStatus(jobId) {
    try {
      const { data } = await dbService.supabase
        .from('ai_activities')
        .select('*')
        .eq('id', jobId)
        .single();
      
      return data;
    } catch (error) {
      console.error('Failed to get job status:', error);
      return null;
    }
  }
}

// Idempotency management
export class IdempotencyManager {
  static async checkIdempotency(idempotencyKey, userId) {
    try {
      const { data } = await dbService.supabase
        .from('ai_activities')
        .select('*')
        .eq('input_data->>idempotencyKey', idempotencyKey)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .single();
      
      return data;
    } catch (error) {
      return null;
    }
  }

  static async markProcessing(idempotencyKey, userId, jobId) {
    try {
      await dbService.supabase
        .from('ai_activities')
        .update({
          'input_data->>idempotencyKey': idempotencyKey,
          'input_data->>processingJobId': jobId,
        })
        .eq('id', jobId);
    } catch (error) {
      console.error('Failed to mark idempotency:', error);
    }
  }
}

// Queue job helper functions
export async function addJob(queueName, jobData, options = {}) {
  const queue = queues[queueName];
  
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  // Create job record for tracking
  const jobRecordId = await JobTracker.createJobRecord(jobData);

  // Add job to queue
  const job = await queue.add(
    jobData.type || 'default',
    {
      ...jobData,
      jobRecordId,
    },
    {
      ...options,
      jobId: jobRecordId, // Use job record ID as BullMQ job ID
    }
  );

  return {
    jobId: jobRecordId,
    bullJobId: job.id,
    queue: queueName,
    status: 'queued',
  };
}

// Get job information
export async function getJobInfo(jobId) {
  const jobStatus = await JobTracker.getJobStatus(jobId);
  
  if (!jobStatus) {
    return null;
  }

  return {
    id: jobStatus.id,
    type: jobStatus.activity_type,
    status: jobStatus.status,
    input: jobStatus.input_data,
    output: jobStatus.output_data,
    error: jobStatus.error_message,
    createdAt: jobStatus.created_at,
    updatedAt: jobStatus.updated_at,
    processingTimeMs: jobStatus.processing_time_ms,
    tokensUsed: jobStatus.tokens_used,
    costCents: jobStatus.cost_cents,
  };
}

// Retry failed jobs
export async function retryJob(jobId) {
  const jobStatus = await JobTracker.getJobStatus(jobId);
  
  if (!jobStatus) {
    throw new Error('Job not found');
  }

  if (jobStatus.status !== 'failed') {
    throw new Error('Only failed jobs can be retried');
  }

  const jobData = jobStatus.input_data;
  const queueName = jobData.queue || QUEUES.AI_PROCESSING;

  // Reset job status
  await JobTracker.updateJobStatus(jobId, 'queued');

  // Add job back to queue
  return addJob(queueName, jobData);
}

// Cancel job
export async function cancelJob(jobId) {
  const jobStatus = await JobTracker.getJobStatus(jobId);
  
  if (!jobStatus) {
    throw new Error('Job not found');
  }

  if (jobStatus.status === 'completed') {
    throw new Error('Cannot cancel completed job');
  }

  // Update status
  await JobTracker.updateJobStatus(jobId, 'cancelled');

  // Try to cancel in BullMQ
  try {
    const queue = queues[jobStatus.input_data.queue || QUEUES.AI_PROCESSING];
    await queue.getJob(jobId)?.remove();
  } catch (error) {
    console.warn('Failed to cancel BullMQ job:', error);
  }

  return true;
}

// Queue statistics
export async function getQueueStats(queueName) {
  const queue = queues[queueName];
  
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getDelayed(),
  ]);

  return {
    queue: queueName,
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
    total: waiting.length + active.length + completed.length + failed.length + delayed.length,
  };
}

// Initialize all queues
export async function initializeQueues() {
  console.log('🔄 Initializing BullMQ queues...');
  
  try {
    // Test Redis connection
    await queues[QUEUES.JOB_SEARCH].waitUntilReady();
    console.log('✅ Redis connection established');
    
    // Set up queue event listeners
    Object.entries(queueEvents).forEach(([queueName, events]) => {
      events.on('completed', ({ jobId, returnvalue }) => {
        console.log(`✅ [${queueName}] Job ${jobId} completed`);
      });

      events.on('failed', ({ jobId, failedReason }) => {
        console.error(`❌ [${queueName}] Job ${jobId} failed:`, failedReason);
      });

      events.on('progress', ({ jobId, data }) => {
        console.log(`📊 [${queueName}] Job ${jobId} progress:`, data);
      });
    });

    console.log('✅ BullMQ queues initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize BullMQ queues:', error);
    return false;
  }
}

// Graceful shutdown
export async function shutdownQueues() {
  console.log('🔄 Shutting down BullMQ queues...');
  
  try {
    // Close all queues
    await Promise.all(Object.values(queues).map(queue => queue.close()));
    
    // Close all queue events
    await Promise.all(Object.values(queueEvents).map(events => events.close()));
    
    console.log('✅ BullMQ queues shut down successfully');
  } catch (error) {
    console.error('❌ Error shutting down queues:', error);
  }
}
