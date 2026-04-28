"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = exports.jobQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST
    ? `redis:/${process.env.REDIS_HOST}:${process.env.REDIS_PORT || '6379'}`
    : '';
const connection = redisUrl
    ? new ioredis_1.default(redisUrl, { maxRetriesPerRequest: null })
    : null;
exports.connection = connection;
exports.jobQueue = redisUrl
    ? new bullmq_1.Queue('job-applications', {
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
    : null;
