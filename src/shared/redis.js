import Redis from 'ioredis';

// Use globalThis singleton pattern to prevent Next.js from creating multiple connections during re-imports
export const getRedisInstance = () => {
  if (globalThis.redisInstance) return globalThis.redisInstance;

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('⚠️ REDIS_URL not found, using localhost:6379');
  }

  const instance = new Redis(redisUrl || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Critical for BullMQ
    enableReadyCheck: false,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryStrategy(times) {
      // Exponential backoff with a cap at 2 seconds
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    reconnectOnError(err) {
      const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
      if (targetErrors.some(e => err.message.includes(e))) {
        console.log('🔄 Redis reconnecting due to specific error:', err.message);
        return true;
      }
      return false;
    }
  });

  instance.on('error', (err) => {
    console.error('❌ Global Redis Error:', err.message);
  });

  instance.on('connect', () => {
    console.log('✅ Global Redis Instance Connected');
  });

  globalThis.redisInstance = instance;
  return instance;
};

export const redis = getRedisInstance();
