import axios from 'axios';
import * as cheerio from 'cheerio';
import { Job, JobSearchParams } from '@/types';
import { JobSearchAdapter } from './JobSearchAdapter';

export class ShineAdapter extends JobSearchAdapter {
  platformName = 'shine';

  async search(params: JobSearchParams): Promise<Job[]> {
    return this.executeSearch(async () => {
      const jobs: Job[] = [];
      const keyword = params.keywords.join(' ');
      const location = params.locations[0] || 'India';

      const url = `https://www.shine.com/job-search/${encodeURIComponent(keyword)}-jobs-in-${encodeURIComponent(location)}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      const $ = cheerio.load(response.data);
      const jobCards = $('.jobCard, [class*="jobCard"]');

      jobCards.slice(0, params.maxResults || 20).each((_, el) => {
        const title = $(el).find('h2, [class*="jobTitle"]').first().text().trim();
        const company = $(el).find('[class*="compName"], .companyName').first().text().trim();
        const location = $(el).find('[class*="loc"]').first().text().trim();
        const experience = $(el).find('[class*="exp"]').first().text().trim();
        const jobUrl = $(el).find('a').first().attr('href') || '';

        if (title && company) {
          const partialJob = { title, company, location };
          jobs.push({
            id: this.generateJobHash(partialJob),
            title,
            company,
            location: location || 'India',
            salary: 'Not Disclosed',
            description: '',
            requirements: [],
            url: jobUrl.startsWith('http') ? jobUrl : `https://www.shine.com${jobUrl}`,
            platform: 'shine',
            postedDate: new Date().toISOString(),
            jobType: 'full-time',
            experienceLevel: this.parseExperienceLevel(experience),
            skills: this.extractSkills(title + ' ' + company),
            applied: false,
            status: 'new'
          });
        }
      });

      return jobs;
    });
  }
}
