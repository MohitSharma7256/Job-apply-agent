import { Queue, Worker, Job as BullJob } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST
  ? `redis:/${process.env.REDIS_HOST}:${process.env.REDIS_PORT || '6379'}`
  : '';

const connection = redisUrl
  ? new IORedis(redisUrl, { maxRetriesPerRequest: null })
  : null as any;

export const jobQueue = redisUrl
  ? new Queue('job-applications', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      },
    })
  : null as any;

export { connection };
