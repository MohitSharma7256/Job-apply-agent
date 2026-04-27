import { Job, JobSearchParams, Platform } from '@/types';
import { NaukriAdapter } from './adapters/NaukriAdapter';
import { LinkedInAdapter } from './adapters/LinkedInAdapter';
import { GreenhouseAdapter } from './adapters/GreenhouseAdapter';
import { IndeedAdapter } from './adapters/IndeedAdapter';
import { ShineAdapter } from './adapters/ShineAdapter';
import { ApnaAdapter } from './adapters/ApnaAdapter';
import { JobSearchAdapter } from './adapters/JobSearchAdapter';

export class JobSearchService {
  private adapters: Map<Platform, JobSearchAdapter> = new Map();

  constructor() {
    this.adapters.set('naukri', new NaukriAdapter());
    this.adapters.set('linkedin', new LinkedInAdapter());
    this.adapters.set('greenhouse', new GreenhouseAdapter());
    this.adapters.set('indeed', new IndeedAdapter());
    this.adapters.set('shine', new ShineAdapter());
    this.adapters.set('apna', new ApnaAdapter());
  }

  async searchAllPlatforms(params: JobSearchParams): Promise<Job[]> {
    const activePlatforms = params.platforms;
    const promises = activePlatforms.map(platform => {
      const adapter = this.adapters.get(platform);
      if (adapter) {
        return adapter.search(params);
      }
      return Promise.resolve([]);
    });

    try {
      const results = await Promise.allSettled(promises);
      const allJobs: Job[] = [];
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allJobs.push(...result.value);
        }
      });

      return this.deduplicateJobs(allJobs);
    } catch (error) {
      console.error('Unified search error:', error);
      return [];
    }
  }

  private deduplicateJobs(jobs: Job[]): Job[] {
    const seen = new Set<string>();
    return jobs.filter((job) => {
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });
  }
}

export const jobSearchService = new JobSearchService();