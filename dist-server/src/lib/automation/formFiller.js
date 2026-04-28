"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = exports.browserWorker = exports.RateLimiter = exports.BrowserWorker = void 0;
const playwright_extra_1 = require("playwright-extra");
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
playwright_extra_1.chromium.use((0, puppeteer_extra_plugin_stealth_1.default)());
const REDIS_URL = process.env.REDIS_URL || '';
const createNoopRedis = () => {
    const noop = () => noop;
    const handler = {
        get(target, prop) {
            if (prop === 'on' || prop === 'once' || prop === 'quit' || prop === 'disconnect' || prop === 'ping') {
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
const redis = REDIS_URL
    ? new ioredis_1.default(REDIS_URL, { maxRetriesPerRequest: null })
    : createNoopRedis();
const RATE_LIMITS = {
    linkedin: { maxPerDay: 80, minGapSeconds: 45 },
    indeed: { maxPerDay: 50, minGapSeconds: 30 },
    naukri: { maxPerDay: 40, minGapSeconds: 60 },
    apna: { maxPerDay: 30, minGapSeconds: 45 },
    internshala: { maxPerDay: 30, minGapSeconds: 45 },
    shine: { maxPerDay: 25, minGapSeconds: 60 },
};
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];
class BrowserWorker {
    constructor() {
        this.browser = null;
        this.context = null;
        this.isWorking = false;
        this.queue = new bullmq_1.Queue('job-applications', { connection: redis });
    }
    async initialize() {
        if (this.browser)
            return;
        this.browser = await playwright_extra_1.chromium.launch({
            headless: process.env.NODE_ENV === 'production',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    }
    async processJob(application) {
        await this.initialize();
        const startTime = Date.now();
        const platform = application.platform;
        const limits = RATE_LIMITS[platform];
        try {
            if (!limits) {
                throw new Error(`Unknown platform: ${platform}`);
            }
            const canApply = await this.checkRateLimit(platform, limits);
            if (!canApply.canApply) {
                await this.queue.add('retry', application, { delay: canApply.retryAfter || 60000 });
                return { success: false, error: 'Rate limit hit, will retry' };
            }
            const context = await this.browser.newContext({
                userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
                viewport: { width: 1920, height: 1080 },
            });
            const page = await context.newPage();
            try {
                await this.platformLogin(page, platform);
                await page.goto(application.url, { timeout: 30000 });
                await this.humanDelay();
                await this.fillForm(page, application);
                await page.click('button[type="submit"], input[type="submit"], .submit-button', { timeout: 5000 }).catch(() => { });
                await this.humanDelay();
                await this.verifySubmission(page);
                this.incrementRateLimit(platform);
                return {
                    success: true,
                    applicationId: `app_${application.jobId}_${Date.now()}`,
                };
            }
            finally {
                await context.close();
            }
        }
        catch (error) {
            if (error.message?.includes('captcha')) {
                return { success: false, error: 'CAPTCHA detected - needs manual intervention' };
            }
            return { success: false, error: error.message };
        }
    }
    async platformLogin(page, platform) {
        const loginUrls = {
            linkedin: 'https://www.linkedin.com/login',
            indeed: 'https://secure.indeed.com/auth',
            naukri: 'https://www.naukri.com/nlogin/login',
            apna: 'https://www.apna.co/auth/login',
            internshala: 'https://internshala.com/student/resume',
        };
        const url = loginUrls[platform];
        if (!url)
            return;
        await page.goto(url, { timeout: 15000 });
        await this.humanDelay();
        console.log(`Navigated to ${platform} login page`);
    }
    async fillForm(page, application) {
        const userData = application.userData || {};
        for (const [field, value] of Object.entries(userData)) {
            await page.fill(`input[name="${field}"], input[id="${field}"], textarea[name="${field}"], textarea[id="${field}"]`, value);
            await this.humanDelay(200);
        }
        if (application.resumeUrl) {
            await page.setInputFiles('input[type="file"]', application.resumeUrl).catch(() => { });
        }
        if (application.coverLetter) {
            const coverField = await page.$('textarea[name="cover_letter"], textarea[name="coverLetter"], textarea[id="cover_letter"]');
            if (coverField) {
                await coverField.fill(application.coverLetter);
            }
        }
    }
    async verifySubmission(page) {
        const successSelectors = [
            '.application-submitted',
            '[data-testid="success-message"]',
            '.thank-you',
            'text=Application submitted',
            'text=Successfully applied',
        ];
        for (const selector of successSelectors) {
            const element = await page.$(selector);
            if (element)
                return true;
        }
        return false;
    }
    async humanDelay(min, max) {
        const delay = min !== undefined ? (max ? min + Math.random() * (max - min) : min) : 800 + Math.random() * 2200;
        await new Promise(r => setTimeout(r, delay));
    }
    async checkRateLimit(platform, limits) {
        const today = new Date().toISOString().split('T')[0];
        const key = `${platform}:${today}`;
        const count = parseInt(await redis.get(key) || '0');
        if (count >= limits.maxPerDay) {
            return { canApply: false };
        }
        const lastKey = `${platform}:last`;
        const lastTime = parseInt(await redis.get(lastKey) || '0');
        const gapMs = Date.now() - lastTime;
        const gapSeconds = gapMs / 1000;
        if (gapSeconds < limits.minGapSeconds) {
            return { canApply: false, retryAfter: (limits.minGapSeconds - gapSeconds) * 1000 };
        }
        return { canApply: true };
    }
    async incrementRateLimit(platform) {
        const today = new Date().toISOString().split('T')[0];
        const key = `${platform}:${today}`;
        await redis.incr(key);
        await redis.expire(key, 48 * 60 * 60);
        await redis.set(`${platform}:last`, Date.now().toString());
    }
    async cleanup() {
        if (this.context) {
            await this.context.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
    }
}
exports.BrowserWorker = BrowserWorker;
class RateLimiter {
    constructor() {
        this.redis = new ioredis_1.default(REDIS_URL);
    }
    async checkAndIncrement(platform, maxPerDay, minGapSeconds) {
        const today = new Date().toISOString().split('T')[0];
        const dailyKey = `ratelimit:${platform}:${today}`;
        const gapKey = `ratelimit:${platform}:gap`;
        const currentCount = parseInt(await this.redis.get(dailyKey) || '0');
        if (currentCount >= maxPerDay) {
            return { allowed: false, remaining: 0 };
        }
        const lastTime = parseInt(await this.redis.get(gapKey) || '0');
        const gapMs = Date.now() - lastTime;
        const gapSeconds = gapMs / 1000;
        if (gapSeconds < minGapSeconds) {
            return { allowed: false, remaining: maxPerDay - currentCount, retryAfter: (minGapSeconds - gapSeconds) * 1000 };
        }
        await this.redis.incr(dailyKey);
        await this.redis.expire(dailyKey, 48 * 60 * 60);
        await this.redis.set(gapKey, Date.now().toString());
        return { allowed: true, remaining: maxPerDay - currentCount - 1 };
    }
    async getRemaining(platform) {
        const today = new Date().toISOString().split('T')[0];
        const key = `ratelimit:${platform}:${today}`;
        const count = await this.redis.get(key);
        return Math.max(0, RATE_LIMITS[platform].maxPerDay - parseInt(count || '0'));
    }
}
exports.RateLimiter = RateLimiter;
exports.browserWorker = new BrowserWorker();
exports.rateLimiter = new RateLimiter();
