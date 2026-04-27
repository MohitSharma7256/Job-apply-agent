import axios from 'axios';
import * as cheerio from 'cheerio';
import { Job, JobSearchParams } from '@/types';
import { JobSearchAdapter } from './JobSearchAdapter';

export class NaukriAdapter extends JobSearchAdapter {
  platformName = 'naukri';

  async search(params: JobSearchParams): Promise<Job[]> {
    return this.executeSearch(async () => {
      const jobs: Job[] = [];
      const keyword = params.keywords.join(' OR ');

      for (const location of params.locations.slice(0, 2)) {
        const url = `https://www.naukri.com/jobs-search?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });

        const $ = cheerio.load(response.data);
        const jobCards = $('.job-card');

        jobCards.slice(0, params.maxResults || 20).each((_, el) => {
          const title = $(el).find('.title').text().trim();
          const company = $(el).find('.company').text().trim();
          const location = $(el).find('.location').text().trim();
          const salary = $(el).find('.salary').text().trim();
          const experience = $(el).find('.experience').text().trim();
          const url = $(el).find('a').attr('href') || '';
          const postedDate = $(el).find('.date').text().trim();

          if (title && company) {
            const partialJob = { title, company, location };
            jobs.push({
              id: this.generateJobHash(partialJob),
              title,
              company,
              location,
              salary: salary || 'Not Disclosed',
              description: '',
              requirements: [],
              url: url.startsWith('http') ? url : `https://www.naukri.com${url}`,
              platform: 'naukri',
              postedDate: postedDate || new Date().toISOString(),
              jobType: 'full-time',
              experienceLevel: this.parseExperienceLevel(experience),
              skills: this.extractSkills(title + ' ' + company),
              applied: false,
              status: 'new'
            });
          }
        });
      }
      return jobs;
    });
  }
}
