"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedInAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
const JobSearchAdapter_1 = require("./JobSearchAdapter");
class LinkedInAdapter extends JobSearchAdapter_1.JobSearchAdapter {
    constructor() {
        super(...arguments);
        this.platformName = 'linkedin';
    }
    async search(params) {
        return this.executeSearch(async () => {
            const jobs = [];
            const keyword = params.keywords.join('%20');
            const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobsTabFromSearch?keywords=${encodeURIComponent(keyword)}&location=India&geoId=102713980`;
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                },
            });
            const data = response.data;
            if (Array.isArray(data)) {
                data.slice(0, params.maxResults || 20).forEach((item) => {
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
exports.LinkedInAdapter = LinkedInAdapter;
