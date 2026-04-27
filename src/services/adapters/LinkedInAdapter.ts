import axios from 'axios';
import { Job, JobSearchParams } from '@/types';
import { JobSearchAdapter } from './JobSearchAdapter';

export class LinkedInAdapter extends JobSearchAdapter {
  platformName = 'linkedin';

  async search(params: JobSearchParams): Promise<Job[]> {
    return this.executeSearch(async () => {
      const jobs: Job[] = [];
      const keyword = params.keywords.join('%20');

      const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobsTabFromSearch?keywords=${encodeURIComponent(keyword)}&location=India&geoId=102713980`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      const data = response.data;
      
      if (Array.isArray(data)) {
        data.slice(0, params.maxResults || 20).forEach((item: any) => {
          const title = item.title || item.jobTitle || '';
          const company = item.companyName || 'Unknown Company';
          const location = item.formattedLocation || item.location || 'India';
          
          const partialJob = { title, company, location };
          
          jobs.push({
            id: this.generateJobHash(partialJob),
            title,
            company,
            location,
            salary: item.salary || item.formattedSalary || 'Not Disclosed',
            description: item.snippet || item.description || '',
            requirements: [],
            url: item.jobViewHref || item.link || '',
            platform: 'linkedin',
            postedDate: item.postedAt || new Date().toISOString(),
            jobType: 'full-time',
            experienceLevel: 'any',
            skills: this.extractSkills(title + ' ' + (item.snippet || '')),
            applied: false,
            status: 'new'
          });
        });
      }
      return jobs;
    });
  }
}
