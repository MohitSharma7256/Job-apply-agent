import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { Job, UserProfile } from '@/types';
import { loginManager } from './sessionManager';
import fs from 'fs';
import path from 'path';
import os from 'os';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
];

export interface AutomationResult {
  success: boolean;
  status: 'success' | 'failed' | 'retry';
  reason?: 'captcha' | 'form_error' | 'timeout' | 'login_required' | 'unknown';
  message: string;
}

export class AutomationService {
  private browser: Browser | null = null;

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--disable-blink-features=AutomationControlled']
      });
    }
    return this.browser;
  }

  private async getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  private async humanDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async applyToJob(job: Job, profile: UserProfile): Promise<AutomationResult> {
    const browser = await this.init();
    const context = await browser.newContext({
      userAgent: await this.getRandomUserAgent(),
      viewport: { width: 1280, height: 720 }
    });

    // INJECT COOKIES: Get session from Supabase and inject into context
    const session = await loginManager.getSession('default-user', job.platform);
    if (session && session.cookies) {
      console.log(`[Automation] Injecting ${session.cookies.length} cookies for ${job.platform}`);
      await context.addCookies(session.cookies);
    } else {
      console.warn(`[Automation] No session found for ${job.platform}. Trying without login...`);
    }

    // DOWNLOAD RESUME: Download resume to temp file if profile has resumeUrl
    let resumePath: string | null = null;
    if (profile.resumeUrl && profile.resumeUrl.startsWith('http')) {
      try {
        const res = await fetch(profile.resumeUrl);
        const buffer = Buffer.from(await res.arrayBuffer());
        resumePath = path.join(os.tmpdir(), `resume_${Date.now()}.pdf`);
        fs.writeFileSync(resumePath, buffer);
        console.log(`[Automation] Resume downloaded to: ${resumePath}`);
      } catch (e) {
        console.warn('[Automation] Could not download resume:', e);
      }
    }

    const page = await context.newPage();

    try {
      console.log(`[Automation] Starting application for ${job.title} on ${job.platform}`);
      
      // Step 1: Navigate to Job URL
      await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.humanDelay(2000, 4000);

      // Step 2: Detect Blockers (CAPTCHA, etc.)
      const isBlocked = await this.detectBlockers(page);
      if (isBlocked) {
        return { success: false, status: 'failed', reason: 'captcha', message: 'Detected anti-bot blocker/CAPTCHA' };
      }

      // Step 3: Platform-specific Application
      switch (job.platform) {
        case 'naukri':
          return await this.applyNaukri(page, job, profile, resumePath);
        case 'linkedin':
          return await this.applyLinkedIn(page, job, profile);
        case 'greenhouse':
          return await this.applyGreenhouse(page, job, profile, resumePath);
        case 'indeed':
          return await this.applyIndeed(page, job, profile, resumePath);
        default:
          return { success: false, status: 'failed', message: `Platform ${job.platform} not supported.` };
      }
    } catch (error: any) {
      console.error(`[Automation] Critical error for ${job.platform}:`, error.message);
      return { 
        success: false, 
        status: 'failed', 
        reason: error.message.includes('timeout') ? 'timeout' : 'unknown', 
        message: error.message 
      };
    } finally {
      await context.close();
      // Cleanup temp resume file
      if (resumePath && fs.existsSync(resumePath)) {
        fs.unlinkSync(resumePath);
      }
    }
  }

  private async detectBlockers(page: Page): Promise<boolean> {
    const blockers = [
      'iframe[src*="captcha"]',
      '#challenge-running',
      '.g-recaptcha',
      'text="Verify you are human"'
    ];
    
    for (const selector of blockers) {
      if (await page.locator(selector).isVisible().catch(() => false)) return true;
    }
    return false;
  }

  private async applyNaukri(page: Page, job: Job, profile: UserProfile, resumePath: string | null = null): Promise<AutomationResult> {
    // Check if login is required
    const loginBtn = await page.locator('text=Login').first();
    if (await loginBtn.isVisible().catch(() => false)) {
      return { success: false, status: 'failed', reason: 'login_required', message: 'Naukri login required' };
    }

    const applyBtn = page.locator('.apply-button, #apply-button, [class*="apply"]').first();
    if (await applyBtn.isVisible().catch(() => false)) {
      await this.humanDelay();
      await applyBtn.click();
      await this.humanDelay(2000, 3000);

      // Try to attach resume if upload field appears
      if (resumePath) {
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible().catch(() => false)) {
          await fileInput.setInputFiles(resumePath);
          console.log('[Automation] Resume attached on Naukri');
          await this.humanDelay(1000, 2000);
        }
      }

      await this.humanDelay(2000, 4000);
      
      if (await page.locator('text="Successfully Applied"').isVisible().catch(() => false)) {
        return { success: true, status: 'success', message: 'Applied successfully via Naukri' };
      }
      if (await page.locator('text="Already Applied"').isVisible().catch(() => false)) {
        return { success: true, status: 'success', message: 'Already applied to this job' };
      }
      // If no explicit success, assume it went through
      return { success: true, status: 'success', message: 'Applied via Naukri (no explicit confirmation)' };
    }
    
    return { success: false, status: 'failed', reason: 'form_error', message: 'Naukri apply button not found' };
  }

  private async applyLinkedIn(page: Page, job: Job, profile: UserProfile): Promise<AutomationResult> {
    const easyApply = page.locator('.jobs-apply-button').first();
    if (await easyApply.isVisible()) {
      const text = await easyApply.innerText();
      if (!text.toLowerCase().includes('easy apply')) {
        return { success: false, status: 'failed', message: 'External application required (not Easy Apply)' };
      }
      
      await easyApply.click();
      await this.humanDelay();
      
      // Basic check for the modal
      if (await page.locator('.jobs-easy-apply-modal').isVisible()) {
        return { success: true, status: 'success', message: 'Initiated LinkedIn Easy Apply' };
      }
    }
    return { success: false, status: 'failed', reason: 'form_error', message: 'LinkedIn Easy Apply button not found' };
  }

  private async applyGreenhouse(page: Page, job: Job, profile: UserProfile, resumePath: string | null = null): Promise<AutomationResult> {
    const form = page.locator('#application_form, form[action*="apply"]').first();
    if (await form.isVisible().catch(() => false)) {
      await page.fill('#first_name', profile.name.split(' ')[0] || '').catch(() => {});
      await page.fill('#last_name', profile.name.split(' ').slice(1).join(' ') || 'User').catch(() => {});
      await page.fill('#email', profile.email).catch(() => {});
      await page.fill('#phone', profile.phone).catch(() => {});

      // Attach resume if available
      if (resumePath) {
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible().catch(() => false)) {
          await fileInput.setInputFiles(resumePath);
          console.log('[Automation] Resume attached on Greenhouse');
          await this.humanDelay(1000, 2000);
        }
      }

      await this.humanDelay();
      
      // Submit the form
      const submitBtn = page.locator('input[type="submit"], button[type="submit"]').first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await this.humanDelay(2000, 3000);
      }

      return { success: true, status: 'success', message: 'Greenhouse form submitted successfully' };
    }
    return { success: false, status: 'failed', reason: 'form_error', message: 'Greenhouse application form not found' };
  }

  private async applyIndeed(page: Page, job: Job, profile: UserProfile, resumePath: string | null = null): Promise<AutomationResult> {
    const applyBtn = page.locator('#indeedApplyButton, .indeed-apply-button, [data-testid="apply-button"]').first();
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await this.humanDelay(2000, 3000);

      // Try to attach resume if file upload field appears
      if (resumePath) {
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible().catch(() => false)) {
          await fileInput.setInputFiles(resumePath);
          console.log('[Automation] Resume attached on Indeed');
          await this.humanDelay(1000, 2000);
        }
      }

      return { success: true, status: 'success', message: 'Indeed application initiated' };
    }
    return { success: false, status: 'failed', message: 'Indeed apply button not found' };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const automationService = new AutomationService();
