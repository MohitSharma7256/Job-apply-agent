"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobSearchAdapter = void 0;
const crypto_1 = __importDefault(require("crypto"));
class JobSearchAdapter {
    /**
     * Helper to execute search with retries and timeout
     */
    async executeSearch(searchFn, maxRetries = 2, timeoutMs = 15000) {
        let lastError;
        for (let i = 0; i <= maxRetries; i++) {
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs));
                const result = await Promise.race([searchFn(), timeoutPromise]);
                return result;
            }
            catch (error) {
                lastError = error;
                console.warn(`[${this.platformName}] Attempt ${i + 1} failed: ${error.message}`);
                if (i < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
                }
            }
        }
        console.error(`[${this.platformName}] All ${maxRetries + 1} attempts failed.`);
        return [];
    }
    /**
     * Generate a unique hash for deduplication
     */
    generateJobHash(job) {
        const raw = `${job.title}-${job.company}-${job.location}`.toLowerCase().replace(/\s+/g, '');
        return crypto_1.default.createHash('md5').update(raw).digest('hex');
    }
    parseExperienceLevel(exp) {
        if (!exp)
            return 'any';
        const lower = exp.toLowerCase();
        if (lower.includes('fresher') || lower.includes('0') || lower.includes('entry'))
            return 'fresher';
        if (lower.includes('senior') || lower.includes('lead') || lower.includes('manager'))
            return 'senior';
        if (lower.includes('mid') || lower.includes('2-5'))
            return 'mid';
        return 'any';
    }
    extractSkills(text) {
        const skillKeywords = [
            'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
            'node', 'express', 'django', 'flask', 'spring', 'aws', 'azure', 'gcp',
            'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql', 'redis',
            'git', 'linux', 'machine learning', 'data science', 'tensorflow', 'pytorch',
            'html', 'css', 'sass', 'tailwind', 'next', 'nuxt', 'graphql', 'rest',
        ];
        const found = [];
        const lower = text.toLowerCase();
        skillKeywords.forEach(skill => {
            if (lower.includes(skill)) {
                found.push(skill);
            }
        });
        return [...new Set(found)];
    }
}
exports.JobSearchAdapter = JobSearchAdapter;
