"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationService = exports.AutomationService = void 0;
const playwright_1 = require("playwright");
const sessionManager_1 = require("./sessionManager");
class AutomationService {
    constructor() {
        this.browser = null;
    }
    async init() {
        if (!this.browser) {
            this.browser = await playwright_1.chromium.launch({
                headless: process.env.NODE_ENV === 'production',
                args: ['--disable-blink-features=AutomationControlled', '--start-maximized']
            });
        }
        return this.browser;
    }
    async getRandomUserAgent() {
        const USER_AGENTS = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        ];
        return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }
    async humanDelay(min = 1000, max = 3000) {
        const delay = Math.floor(Math.random() * (max - min + 1) + min);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    async applyToJob(job, profile, userId) {
        const browser = await this.init();
        const context = await browser.newContext({
            userAgent: await this.getRandomUserAgent(),
            viewport: { width: 1280, height: 720 }
        });
        // INJECT COOKIES
        const session = await sessionManager_1.loginManager.getSession(userId, job.platform);
        if (session && session.cookies) {
            await context.addCookies(session.cookies);
        }
        const page = await context.newPage();
        let resumePath = null;
        try {
            await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await this.humanDelay(2000, 4000);
            const isBlocked = await this.detectBlockers(page);
            if (isBlocked)
                return { success: false, status: 'failed', reason: 'captcha', message: 'Blocked by CAPTCHA' };
            switch (job.platform) {
                case 'naukri': return await this.applyNaukri(page, job, profile, resumePath);
                case 'linkedin': return await this.applyLinkedIn(page, job, profile);
                default: return { success: false, status: 'failed', message: 'Platform not supported' };
            }
        }
        catch (error) {
            return { success: false, status: 'failed', message: error.message };
        }
        finally {
            await context.close();
        }
    }
    async detectBlockers(page) {
        const blockers = ['iframe[src*="captcha"]', '#challenge-running', '.g-recaptcha'];
        for (const s of blockers) {
            if (await page.locator(s).isVisible().catch(() => false))
                return true;
        }
        return false;
    }
    async applyNaukri(page, job, profile, resumePath) {
        const loginBtn = page.locator('text=Login').first();
        if (await loginBtn.isVisible().catch(() => false))
            return { success: false, status: 'failed', reason: 'login_required', message: 'Login required' };
        const applyBtn = page.locator('.apply-button, #apply-button, [class*="apply"]').first();
        if (await applyBtn.isVisible().catch(() => false)) {
            await applyBtn.click();
            return { success: true, status: 'success', message: 'Applied' };
        }
        return { success: false, status: 'failed', message: 'Button not found' };
    }
    async applyLinkedIn(page, job, profile) {
        const easyApply = page.locator('.jobs-apply-button').first();
        if (await easyApply.isVisible().catch(() => false)) {
            await easyApply.click();
            return { success: true, status: 'success', message: 'Applied via Easy Apply' };
        }
        return { success: false, status: 'failed', message: 'Easy Apply not found' };
    }
    async close() { if (this.browser) {
        await this.browser.close();
        this.browser = null;
    } }
}
exports.AutomationService = AutomationService;
exports.automationService = new AutomationService();
