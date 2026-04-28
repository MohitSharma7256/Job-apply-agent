import { chromium, Browser, BrowserContext, Page } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';

chromium.use(stealth());

const REDIS_URL = process.env.REDIS_URL || '';
const createNoopRedis = () => {
  const noop = () => noop;
  const handler: ProxyHandler<any> = {
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
  ? new Redis(REDIS_URL, { maxRetriesPerRequest: null })
  : createNoopRedis();

export interface JobApplication {
  jobId: string;
  title: string;
  company: string;
  platform: string;
  url: string;
  resumeUrl?: string;
  coverLetter?: string;
  userData: Record<string, string>;
}

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

export class BrowserWorker {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private queue: Queue;
  private isWorking: boolean = false;

  constructor() {
    this.queue = new Queue('job-applications', { connection: redis });
  }

  async initialize() {
    if (this.browser) return;
    this.browser = await chromium.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async processJob(application: JobApplication): Promise<{ success: boolean; error?: string; applicationId?: string }> {
    await this.initialize();

    const startTime = Date.now();
    const platform = application.platform as keyof typeof RATE_LIMITS;
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

      const context = await this.browser!.newContext({
        userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        viewport: { width: 1920, height: 1080 },
      });

      const page = await context.newPage();

      try {
        await this.platformLogin(page, platform);
        
        await page.goto(application.url, { timeout: 30000 });
        await this.humanDelay();

        await this.fillForm(page, application);

        await page.click('button[type="submit"], input[type="submit"], .submit-button', { timeout: 5000 }).catch(() => {});

        await this.humanDelay();

        await this.verifySubmission(page);

        this.incrementRateLimit(platform);

        return {
          success: true,
          applicationId: `app_${application.jobId}_${Date.now()}`,
        };
      } finally {
        await context.close();
      }
    } catch (error: any) {
      if (error.message?.includes('captcha')) {
        return { success: false, error: 'CAPTCHA detected - needs manual intervention' };
      }
      return { success: false, error: error.message };
    }
  }

  private async platformLogin(page: Page, platform: string): Promise<void> {
    const loginUrls: Record<string, string> = {
      linkedin: 'https://www.linkedin.com/login',
      indeed: 'https://secure.indeed.com/auth',
      naukri: 'https://www.naukri.com/nlogin/login',
      apna: 'https://www.apna.co/auth/login',
      internshala: 'https://internshala.com/student/resume',
    };

    const url = loginUrls[platform];
    if (!url) return;

    await page.goto(url, { timeout: 15000 });
    await this.humanDelay();

    console.log(`Navigated to ${platform} login page`);
  }

  private async fillForm(page: Page, application: JobApplication): Promise<void> {
    const userData = application.userData || {};

    for (const [field, value] of Object.entries(userData)) {
      await page.fill(`input[name="${field}"], input[id="${field}"], textarea[name="${field}"], textarea[id="${field}"]`, value);
      await this.humanDelay(200);
    }

    if (application.resumeUrl) {
      await page.setInputFiles('input[type="file"]', application.resumeUrl).catch(() => {});
    }

    if (application.coverLetter) {
      const coverField = await page.$('textarea[name="cover_letter"], textarea[name="coverLetter"], textarea[id="cover_letter"]');
      if (coverField) {
        await coverField.fill(application.coverLetter);
      }
    }
  }

  private async verifySubmission(page: Page): Promise<boolean> {
    const successSelectors = [
      '.application-submitted',
      '[data-testid="success-message"]',
      '.thank-you',
      'text=Application submitted',
      'text=Successfully applied',
    ];

    for (const selector of successSelectors) {
      const element = await page.$(selector);
      if (element) return true;
    }

    return false;
  }

  private async humanDelay(min?: number, max?: number): Promise<void> {
    const delay = min !== undefined ? (max ? min + Math.random() * (max - min) : min) : 800 + Math.random() * 2200;
    await new Promise(r => setTimeout(r, delay));
  }

  private async checkRateLimit(platform: string, limits: typeof RATE_LIMITS.linkedin): Promise<{ canApply: boolean; retryAfter?: number }> {
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

  private async incrementRateLimit(platform: string): Promise<void> {
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

export class RateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(REDIS_URL);
  }

  async checkAndIncrement(
    platform: string,
    maxPerDay: number,
    minGapSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
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

  async getRemaining(platform: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const key = `ratelimit:${platform}:${today}`;
    const count = await this.redis.get(key);
    return Math.max(0, RATE_LIMITS[platform as keyof typeof RATE_LIMITS].maxPerDay - parseInt(count || '0'));
  }
}

export const browserWorker = new BrowserWorker();
export const rateLimiter = new RateLimiter();
