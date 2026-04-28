import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST
  ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || '6379'}`
  : '';

const createNoopRedis = () => {
  const noop = () => noop;
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === 'ping') {
        return async () => 'PONG';
      }
      if (prop === 'on' || prop === 'once' || prop === 'removeListener' || prop === 'quit' || prop === 'disconnect') {
        return () => noop;
      }
      return noop;
    },
    apply(target, thisArg, args) {
      return noop;
    },
  };
  return new Proxy(noop, handler);
};

const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    })
  : createNoopRedis();

export function getRedis() {
  return redis;
}
