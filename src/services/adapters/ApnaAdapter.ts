import axios from 'axios';
import * as cheerio from 'cheerio';
import { Job, JobSearchParams } from '../../types';
import { JobSearchAdapter } from './JobSearchAdapter';

export class ApnaAdapter extends JobSearchAdapter {
  platformName = 'apna';

  async search(params: JobSearchParams): Promise<Job[]> {
    return this.executeSearch(async () => {
      const jobs: Job[] = [];
      const keyword = params.keywords.join(' ');
      const location = params.locations[0] || 'India';

      const url = `https://www.apna.co/jobs?search=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      const $ = cheerio.load(response.data);
      const jobCards = $('[class*="JobCard"], .job-card-container');

      jobCards.slice(0, params.maxResults || 20).each((_, el) => {
        const title = $(el).find('[class*="Title"], h2').first().text().trim();
        const company = $(el).find('[class*="Company"], .company-name').first().text().trim();
        const location = $(el).find('[class*="Location"]').first().text().trim();
        const salary = $(el).find('[class*="Salary"]').first().text().trim();
        const jobUrl = $(el).find('a').first().attr('href') || '';

        if (title && company) {
          const partialJob = { title, company, location };
          jobs.push({
            id: this.generateJobHash(partialJob),
            title,
            company,
            location: location || 'India',
            salary: salary || 'Not Disclosed',
            description: '',
            requirements: [],
            url: jobUrl.startsWith('http') ? jobUrl : `https://www.apna.co${jobUrl}`,
            platform: 'apna',
            postedDate: new Date().toISOString(),
            jobType: 'full-time',
            experienceLevel: 'any',
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
