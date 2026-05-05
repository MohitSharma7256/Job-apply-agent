import { Queue, QueueEvents } from 'bullmq';
import { redis } from './redis.js';
import { dbService } from '../services/dbService.js';

// Configuration for all queues using singleton redis
const queueConfig = {
  connection: redis,
  defaultJobOptions: {
    attempts: 5, // Improved retry strategy
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 50, // Strict retention for Upstash/Free Redis
    removeOnFail: 20, // Strict retention
  },
};

// Queue names
export const QUEUES = {
  JOB_SEARCH: 'job-search',
  RESUME_TAILOR: 'resume-tailor',
  JOB_APPLY: 'job-apply',
  AI_PROCESSING: 'ai-processing',
  WEB_AUTOMATION: 'web-automation',
  DEAD_LETTER: 'dead-letter',
};

// Create queues (all share the same connection)
export const queues = {
  [QUEUES.JOB_SEARCH]: new Queue(QUEUES.JOB_SEARCH, queueConfig),
  [QUEUES.RESUME_TAILOR]: new Queue(QUEUES.RESUME_TAILOR, queueConfig),
  [QUEUES.JOB_APPLY]: new Queue(QUEUES.JOB_APPLY, queueConfig),
  [QUEUES.AI_PROCESSING]: new Queue(QUEUES.AI_PROCESSING, queueConfig),
  [QUEUES.WEB_AUTOMATION]: new Queue(QUEUES.WEB_AUTOMATION, queueConfig),
  [QUEUES.DEAD_LETTER]: new Queue(QUEUES.DEAD_LETTER, queueConfig),
};

// Create queue events for monitoring (all share the same connection)
export const queueEvents = {
  [QUEUES.JOB_SEARCH]: new QueueEvents(QUEUES.JOB_SEARCH, { connection: redis }),
  [QUEUES.RESUME_TAILOR]: new QueueEvents(QUEUES.RESUME_TAILOR, { connection: redis }),
  [QUEUES.JOB_APPLY]: new QueueEvents(QUEUES.JOB_APPLY, { connection: redis }),
  [QUEUES.AI_PROCESSING]: new QueueEvents(QUEUES.AI_PROCESSING, { connection: redis }),
  [QUEUES.WEB_AUTOMATION]: new QueueEvents(QUEUES.WEB_AUTOMATION, { connection: redis }),
};

// Job status tracking
export class JobTracker {
  static async createJobRecord(jobData) {
    try {
      const { data, error } = await dbService.supabase
        .from('ai_activities')
        .insert({
          user_id: jobData.userId || '00000000-0000-0000-0000-000000000000',
          activity_type: jobData.type || 'unknown',
          input_data: jobData,
          status: 'queued',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to create job record:', error.message);
      return `local-${Date.now()}`;
    }
  }

  static async updateJobStatus(jobId, status, result = null, error = null) {
    if (String(jobId).startsWith('local-')) return; // Mock ID from failed insert
    
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (result) updates.output_data = result;
      if (error) updates.error_message = error.message || String(error);

      await dbService.supabase
        .from('ai_activities')
        .update(updates)
        .eq('id', jobId);
    } catch (err) {
      console.error('Failed to update job status:', err.message);
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
      console.error('Failed to get job status:', error.message);
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
      console.error('Failed to mark idempotency:', error.message);
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

export async function getJobInfo(jobId) {
  const jobStatus = await JobTracker.getJobStatus(jobId);
  
  if (!jobStatus) return null;

  return {
    id: jobStatus.id,
    type: jobStatus.activity_type,
    status: jobStatus.status,
    input: jobStatus.input_data,
    output: jobStatus.output_data,
    error: jobStatus.error_message,
    createdAt: jobStatus.created_at,
    updatedAt: jobStatus.updated_at,
  };
}

export async function retryJob(jobId) {
  const jobStatus = await JobTracker.getJobStatus(jobId);
  
  if (!jobStatus) throw new Error('Job not found');
  if (jobStatus.status !== 'failed') throw new Error('Only failed jobs can be retried');

  const jobData = jobStatus.input_data;
  const queueName = jobData.queue || QUEUES.AI_PROCESSING;

  await JobTracker.updateJobStatus(jobId, 'queued');
  return addJob(queueName, jobData);
}

export async function cancelJob(jobId) {
  const jobStatus = await JobTracker.getJobStatus(jobId);
  
  if (!jobStatus) throw new Error('Job not found');
  if (jobStatus.status === 'completed') throw new Error('Cannot cancel completed job');

  await JobTracker.updateJobStatus(jobId, 'cancelled');

  try {
    const queue = queues[jobStatus.input_data.queue || QUEUES.AI_PROCESSING];
    await queue.getJob(jobId)?.remove();
  } catch (error) {
    console.warn('Failed to cancel BullMQ job:', error.message);
  }

  return true;
}

export async function getQueueStats(queueName) {
  const queue = queues[queueName];
  if (!queue) throw new Error(`Queue ${queueName} not found`);

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    queue: queueName,
    waiting, active, completed, failed, delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

export async function initializeQueues() {
  console.log('🔄 Initializing BullMQ queues with shared Redis...');
  try {
    // BullMQ v5 removes waitUntilReady(), relying on events or just checking ping
    await redis.ping();
    console.log('✅ BullMQ queues initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize BullMQ queues:', error.message);
    return false;
  }
}

export async function shutdownQueues() {
  console.log('🔄 Shutting down BullMQ queues...');
  try {
    await Promise.all(Object.values(queues).map(queue => queue.close()));
    await Promise.all(Object.values(queueEvents).map(events => events.close()));
    console.log('✅ BullMQ queues shut down successfully');
  } catch (error) {
    console.error('❌ Error shutting down queues:', error.message);
  }
}
