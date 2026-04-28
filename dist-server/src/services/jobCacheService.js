"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobCacheService = exports.JobCacheService = void 0;
class JobCacheService {
    constructor() {
        this.cache = new Map();
        this.TTL = 10 * 60 * 1000; // 10 minutes
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        const now = Date.now();
        if (now - entry.timestamp > this.TTL) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    generateKey(params) {
        return JSON.stringify(params);
    }
    clear() {
        this.cache.clear();
    }
}
exports.JobCacheService = JobCacheService;
exports.jobCacheService = new JobCacheService();
