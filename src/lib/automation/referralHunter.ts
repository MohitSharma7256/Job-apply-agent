import { Page } from 'playwright';
import OpenAI from 'openai';
import { Job, UserProfile } from '../../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class ReferralHunter {
  async huntAndConnect(page: Page, job: Job, profile: UserProfile) {
    console.log(`[Referral Hunter] Searching for employees at ${job.company}...`);

    try {
      / 1. Search for employees (Engineering Manager or HR)
      const searchQuery = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(job.company + ' Hiring Manager')}`;
      await page.goto(searchQuery, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 3000));

      / 2. Find the first "Connect" button
      const connectBtn = page.locator('button:has-text("Connect")').first();
      if (await connectBtn.isVisible()) {
        await connectBtn.click();
        await new Promise(r => setTimeout(r, 1000));

        / 3. Add a personalized note
        const addNoteBtn = page.locator('button:has-text("Add a note")');
        if (await addNoteBtn.isVisible()) {
          await addNoteBtn.click();

          const message = await this.generateReferralMessage(profile, job);
          await page.fill('#custom-message', message);
          
          console.log(`[Referral Hunter] Sending personalized request: ${message.substring(0, 50)}...`);
          
          / In production, we'd click 'Send' - for now, just log
          / await page.click('button:has-text("Send")');
        }
      } else {
        console.log(`[Referral Hunter] No direct connect button found for ${job.company}`);
      }
    } catch (error) {
      console.error('[Referral Hunter] Failed:', error);
    }
  }

  private async generateReferralMessage(profile: UserProfile, job: Job): Promise<string> {
    const prompt = `
      Write a short, professional LinkedIn connection request (max 280 chars).
      Candidate: ${profile.name}, Skills: ${profile.skills.slice(0,3).join(', ')}
      Job: ${job.title} at ${job.company}.
      Goal: Ask for a referral or a quick chat about the role.
      Tone: Respectful but confident.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
      });
      return response.choices[0].message.content || 'Hi, I saw your post for the role and would love to connect.';
    } catch {
      return `Hi, I just applied for the ${job.title} role at your company. Would love to connect!`;
    }
  }
}

export const referralHunter = new ReferralHunter();
