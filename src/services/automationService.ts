import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { Job, UserProfile } from '@/types';
import { loginManager } from './sessionManager';
import { resumeTailor } from '@/lib/ai/resumeTailor';
import { referralHunter } from '@/lib/automation/referralHunter';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
        headless: process.env.NODE_ENV === 'production',
        args: ['--disable-blink-features=AutomationControlled', '--start-maximized']
      });
    }
    return this.browser;
  }

  private async getRandomUserAgent() {
    const USER_AGENTS = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    ];
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

    // INJECT COOKIES
    const session = await loginManager.getSession('default-user', job.platform);
    if (session && session.cookies) {
      await context.addCookies(session.cookies);
    }

    // RESUME TAILORING
    let resumePath: string | null = null;
    try {
      const { pdfBuffer } = await resumeTailor.tailorResume(profile, job);
      resumePath = path.join(os.tmpdir(), `tailored_resume_${Date.now()}.pdf`);
      fs.writeFileSync(resumePath, new Uint8Array(pdfBuffer));
    } catch (e) {
      if (profile.resumeUrl?.startsWith('http')) {
        const res = await fetch(profile.resumeUrl);
        resumePath = path.join(os.tmpdir(), `default_resume_${Date.now()}.pdf`);
        fs.writeFileSync(resumePath, new Uint8Array(await res.arrayBuffer()));
      }
    }

    const page = await context.newPage();

    try {
      if (job.platform === 'linkedin') {
        await referralHunter.huntAndConnect(page, job, profile).catch(() => {});
      }

      await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.humanDelay(2000, 4000);

      const isBlocked = await this.detectBlockers(page);
      if (isBlocked) return { success: false, status: 'failed', reason: 'captcha', message: 'Blocked by CAPTCHA' };

      switch (job.platform) {
        case 'naukri': return await this.applyNaukri(page, job, profile, resumePath);
        case 'linkedin': return await this.applyLinkedIn(page, job, profile);
        case 'greenhouse': return await this.applyGreenhouse(page, job, profile, resumePath);
        case 'indeed': return await this.applyIndeed(page, job, profile, resumePath);
        default: return { success: false, status: 'failed', message: 'Platform not supported' };
      }
    } catch (error: any) {
      return { success: false, status: 'failed', message: error.message };
    } finally {
      await context.close();
      if (resumePath && fs.existsSync(resumePath)) fs.unlinkSync(resumePath);
    }
  }

  private async detectBlockers(page: Page): Promise<boolean> {
    const blockers = ['iframe[src*="captcha"]', '#challenge-running', '.g-recaptcha'];
    for (const s of blockers) { if (await page.locator(s).isVisible().catch(() => false)) return true; }
    return false;
  }

  private async applyNaukri(page: Page, job: Job, profile: UserProfile, resumePath: string | null): Promise<AutomationResult> {
    const loginBtn = page.locator('text=Login').first();
    if (await loginBtn.isVisible().catch(() => false)) return { success: false, status: 'failed', reason: 'login_required', message: 'Login required' };
    const applyBtn = page.locator('.apply-button, #apply-button, [class*="apply"]').first();
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      if (resumePath) {
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible().catch(() => false)) await fileInput.setInputFiles(resumePath);
      }
      return { success: true, status: 'success', message: 'Applied' };
    }
    return { success: false, status: 'failed', message: 'Button not found' };
  }

  private async applyLinkedIn(page: Page, job: Job, profile: UserProfile): Promise<AutomationResult> {
    const easyApply = page.locator('.jobs-apply-button').first();
    if (await easyApply.isVisible().catch(() => false)) {
      await easyApply.click();
      return { success: true, status: 'success', message: 'Applied via Easy Apply' };
    }
    return { success: false, status: 'failed', message: 'Easy Apply not found' };
  }

  private async applyGreenhouse(page: Page, job: Job, profile: UserProfile, resumePath: string | null): Promise<AutomationResult> {
    const form = page.locator('#application_form').first();
    if (await form.isVisible().catch(() => false)) {
      await page.fill('#first_name', profile.name.split(' ')[0] || '');
      if (resumePath) await page.locator('input[type="file"]').first().setInputFiles(resumePath);
      return { success: true, status: 'success', message: 'Form filled' };
    }
    return { success: false, status: 'failed', message: 'Form not found' };
  }

  private async applyIndeed(page: Page, job: Job, profile: UserProfile, resumePath: string | null): Promise<AutomationResult> {
    const applyBtn = page.locator('#indeedApplyButton, .indeed-apply-button').first();
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      if (resumePath) await page.locator('input[type="file"]').first().setInputFiles(resumePath);
      return { success: true, status: 'success', message: 'Applied' };
    }
    return { success: false, status: 'failed', message: 'Apply button not found' };
  }

  async close() { if (this.browser) { await this.browser.close(); this.browser = null; } }
}

export const automationService = new AutomationService();
