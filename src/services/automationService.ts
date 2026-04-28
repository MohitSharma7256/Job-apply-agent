import { chromium, Browser, Page } from 'playwright';
import { Job, UserProfile } from '../types';
import { loginManager } from './sessionManager';
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

  async applyToJob(job: Job, profile: UserProfile, userId: string): Promise<AutomationResult> {
    const browser = await this.init();
    const context = await browser.newContext({
      userAgent: await this.getRandomUserAgent(),
      viewport: { width: 1280, height: 720 }
    });

    // INJECT COOKIES
    const session = await loginManager.getSession(userId, job.platform);
    if (session && session.cookies) {
      await context.addCookies(session.cookies);
    }

    const page = await context.newPage();
    let resumePath: string | null = null;

    try {
      await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.humanDelay(2000, 4000);

      const isBlocked = await this.detectBlockers(page);
      if (isBlocked) return { success: false, status: 'failed', reason: 'captcha', message: 'Blocked by CAPTCHA' };

      switch (job.platform) {
        case 'naukri': return await this.applyNaukri(page, job, profile, resumePath);
        case 'linkedin': return await this.applyLinkedIn(page, job, profile);
        default: return { success: false, status: 'failed', message: 'Platform not supported' };
      }
    } catch (error: any) {
      return { success: false, status: 'failed', message: error.message };
    } finally {
      await context.close();
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

  async close() { if (this.browser) { await this.browser.close(); this.browser = null; } }
}

export const automationService = new AutomationService();
