const { chromium } = require('playwright');
const { loginManager } = require('./sessionManager');

class AutomationService {
  async runAutomation(job, profile, autoReferral = true) {
    console.log(`🚀 Starting automation for ${job.title} at ${job.company}`);
    
    const session = await loginManager.getSession(profile.email, job.platform);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });

    if (session) {
      await context.addCookies(session.cookies);
    }

    const page = await context.newPage();
    
    try {
      if (job.platform === 'linkedin') {
        await this.applyLinkedIn(page, job, profile);
      } else if (job.platform === 'naukri') {
        await this.applyNaukri(page, job, profile);
      } else if (job.platform === 'glassdoor') {
        await this.applyGlassdoor(page, job, profile);
      }

      if (autoReferral) {
        await this.huntReferral(page, job);
      }

      return { success: true };
    } catch (error) {
      console.error('Automation failed:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  async applyLinkedIn(page, job, profile) {
    await page.goto(job.url);
    console.log('Applying on LinkedIn...');
  }

  async applyNaukri(page, job, profile) {
    await page.goto(job.url);
    console.log('Applying on Naukri...');
  }

  async applyGlassdoor(page, job, profile) {
    await page.goto(job.url);
    console.log('Applying on Glassdoor...');
    // Glassdoor specific automation
    // 1. Click "Apply Now"
    // 2. Handle the "Easy Apply" modal if exists
    // 3. Upload resume
  }

  async huntReferral(page, job) {
    console.log(`🔍 Hunting for referrals at ${job.company}...`);
    const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=Recruiter%20at%20${encodeURIComponent(job.company)}`;
    await page.goto(searchUrl);
  }
}

module.exports = { automationService: new AutomationService() };
