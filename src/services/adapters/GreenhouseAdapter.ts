import axios from 'axios';
import { Job, JobSearchParams } from '@/types';
import { JobSearchAdapter } from './JobSearchAdapter';
import { GREENHOUSE_COMPANIES } from '@/config/platforms';

export class GreenhouseAdapter extends JobSearchAdapter {
  platformName = 'greenhouse';

  async search(params: JobSearchParams): Promise<Job[]> {
    return this.executeSearch(async () => {
      const jobs: Job[] = [];
      const keyword = params.keywords.join(' ').toLowerCase();

      const companyPromises = GREENHOUSE_COMPANIES.slice(0, 15).map(async (company) => {
        try {
          const url = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`;
          const response = await axios.get(url, { timeout: 5000 });

          if (response.data?.jobs) {
            return response.data.jobs
              .filter((job: any) => !keyword || job.title?.toLowerCase().includes(keyword))
              .map((job: any) => {
                const title = job.title;
                const companyName = job.company_name || company;
                const location = job.location?.name || 'Remote';
                
                return {
                  id: this.generateJobHash({ title, company: companyName, location }),
                  title,
                  company: companyName,
                  location,
                  salary: 'Not Disclosed',
                  description: job.content || '',
                  requirements: [],
                  url: job.absolute_url,
                  platform: 'greenhouse' as const,
                  postedDate: job.updated_at || new Date().toISOString(),
                  jobType: 'full-time' as const,
                  experienceLevel: 'any' as const,
                  skills: this.extractSkills(job.content || ''),
                  applied: false,
                  status: 'new' as const
                };
              });
          }
        } catch (e) {
          // Skip company if failed
        }
        return [];
      });

      const results = await Promise.allSettled(companyPromises);
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          jobs.push(...result.value);
        }
      });

      return jobs;
    });
  }
}
