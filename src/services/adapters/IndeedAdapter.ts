import axios from 'axios';
import * as cheerio from 'cheerio';
import { Job, JobSearchParams } from '@/types';
import { JobSearchAdapter } from './JobSearchAdapter';

export class IndeedAdapter extends JobSearchAdapter {
  platformName = 'indeed';

  async search(params: JobSearchParams): Promise<Job[]> {
    return this.executeSearch(async () => {
      const jobs: Job[] = [];
      const keyword = params.keywords.join(' ');
      const location = params.locations[0] || 'India';

      const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}&sort=date`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      const $ = cheerio.load(response.data);
      const jobCards = $('.jobsearch-ResultsList > li, .job_seen_beacon');

      jobCards.slice(0, params.maxResults || 20).each((_, el) => {
        const titleEl = $(el).find('.jobTitle, h2 a').first();
        const company = $(el).find('.companyName, [data-testid="company-name"]').first().text().trim();
        const location = $(el).find('.companyLocation, [data-testid="text-location"]').first().text().trim();
        const salary = $(el).find('.salary-snippet-container, .estimated-salary').first().text().trim();
        const summary = $(el).find('.job-snippet').text().trim();
        const jobUrl = $(el).find('a').first().attr('href') || '';
        const date = $(el).find('.date').first().text().trim();

        const title = titleEl.text().trim();

        if (title) {
          const partialJob = { title, company, location };
          jobs.push({
            id: this.generateJobHash(partialJob),
            title,
            company: company || 'Company Not Disclosed',
            location: location || 'Remote',
            salary: salary || 'Not Disclosed',
            description: summary,
            requirements: [],
            url: jobUrl.startsWith('http') ? jobUrl : `https://www.indeed.com${jobUrl}`,
            platform: 'indeed',
            postedDate: date || new Date().toISOString(),
            jobType: 'full-time',
            experienceLevel: 'any',
            skills: this.extractSkills(title + ' ' + summary),
            applied: false,
            status: 'new'
          });
        }
      });

      return jobs;
    });
  }
}
