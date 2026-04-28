"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST
    ? `redis:/${process.env.REDIS_HOST}:${process.env.REDIS_PORT || '6379'}`
    : '';
const createNoopRedis = () => {
    const noop = () => noop;
    const handler = {
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
    ? new ioredis_1.default(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
    })
    : createNoopRedis();
function getRedis() {
    return redis;
}
