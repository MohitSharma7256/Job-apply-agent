import { Job, Platform } from '../types';
import { PLATFORMS, DAILY_APPLICATION_LIMIT } from '../config/platforms';

interface BrowserConfig {
  wsEndpoint?: string;
  headless?: boolean;
}

export class ApplyService {
  private dailyCount: number = 0;
  private lastResetDate: string = new Date().toDateString();

  async canApply(): Promise<boolean> {
    this.checkDailyReset();
    return this.dailyCount < DAILY_APPLICATION_LIMIT;
  }

  private checkDailyReset(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyCount = 0;
      this.lastResetDate = today;
    }
  }

  async applyToJob(job: Job, tailoredResume?: string): Promise<{ success: boolean; message: string }> {
    if (!await this.canApply()) {
      return { success: false, message: `Daily limit of ${DAILY_APPLICATION_LIMIT} reached` };
    }

    try {
      let result: { success: boolean; message: string };

      switch (job.platform) {
        case 'naukri':
          result = await this.applyNaukri(job);
          break;
        case 'apna':
          result = await this.applyApna(job);
          break;
        case 'linkedin':
          result = await this.applyLinkedIn(job);
          break;
        case 'indeed':
          result = await this.applyIndeed(job);
          break;
        case 'internshala':
          result = await this.applyInternshala(job);
          break;
        case 'greenhouse':
          result = await this.applyGreenhouse(job);
          break;
        default:
          result = { success: false, message: `Platform ${job.platform} not supported` };
      }

      if (result.success) {
        this.dailyCount++;
      }

      return result;
    } catch (error: any) {
      return { success: false, message: `Application failed: ${error.message}` };
    }
  }

  private async applyNaukri(job: Job): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Applied to ${job.title} at ${job.company} on Naukri.com`,
    };
  }

  private async applyApna(job: Job): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Applied to ${job.title} at ${job.company} on Apna`,
    };
  }

  private async applyLinkedIn(job: Job): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Applied to ${job.title} at ${job.company} on LinkedIn`,
    };
  }

  private async applyIndeed(job: Job): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Applied to ${job.title} at ${job.company} on Indeed`,
    };
  }

  private async applyInternshala(job: Job): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Applied to ${job.title} at ${job.company} on Internshala`,
    };
  }

  private async applyGreenhouse(job: Job): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Applied to ${job.title} at ${job.company} via Greenhouse`,
    };
  }

  getDailyCount(): number {
    this.checkDailyReset();
    return this.dailyCount;
  }

  getRemainingApplications(): number {
    this.checkDailyReset();
    return DAILY_APPLICATION_LIMIT - this.dailyCount;
  }
}

export const applyService = new ApplyService();
