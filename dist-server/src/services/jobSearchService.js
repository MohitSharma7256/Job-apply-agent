"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobSearchService = exports.JobSearchService = void 0;
const NaukriAdapter_1 = require("./adapters/NaukriAdapter");
const LinkedInAdapter_1 = require("./adapters/LinkedInAdapter");
const GreenhouseAdapter_1 = require("./adapters/GreenhouseAdapter");
const IndeedAdapter_1 = require("./adapters/IndeedAdapter");
const ShineAdapter_1 = require("./adapters/ShineAdapter");
const ApnaAdapter_1 = require("./adapters/ApnaAdapter");
class JobSearchService {
    constructor() {
        this.adapters = new Map();
        this.adapters.set('naukri', new NaukriAdapter_1.NaukriAdapter());
        this.adapters.set('linkedin', new LinkedInAdapter_1.LinkedInAdapter());
        this.adapters.set('greenhouse', new GreenhouseAdapter_1.GreenhouseAdapter());
        this.adapters.set('indeed', new IndeedAdapter_1.IndeedAdapter());
        this.adapters.set('shine', new ShineAdapter_1.ShineAdapter());
        this.adapters.set('apna', new ApnaAdapter_1.ApnaAdapter());
    }
    async searchAllPlatforms(params) {
        const activePlatforms = params.platforms;
        const promises = activePlatforms.map(platform => {
            const adapter = this.adapters.get(platform);
            if (adapter) {
                return adapter.search(params);
            }
            return Promise.resolve([]);
        });
        try {
            const results = await Promise.allSettled(promises);
            const allJobs = [];
            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    allJobs.push(...result.value);
                }
            });
            // Emergency Fallback: If no jobs found, try a generic web search
            if (allJobs.length === 0) {
                console.log('No jobs found via adapters, triggering Emergency Google Fallback...');
                const fallbackJobs = await this.triggerGoogleFallback(params);
                allJobs.push(...fallbackJobs);
            }
            return this.deduplicateJobs(allJobs);
        }
        catch (error) {
            console.error('Unified search error:', error);
            return [];
        }
    }
    async triggerGoogleFallback(params) {
        try {
            const { aiService } = await Promise.resolve().then(() => __importStar(require('./aiService')));
            return await aiService.searchJobsWithAI(params);
        }
        catch (e) {
            console.error('Fallback failed:', e);
            return [];
        }
    }
    deduplicateJobs(jobs) {
        const seen = new Set();
        return jobs.filter((job) => {
            if (seen.has(job.id))
                return false;
            seen.add(job.id);
            return true;
        });
    }
}
exports.JobSearchService = JobSearchService;
exports.jobSearchService = new JobSearchService();
