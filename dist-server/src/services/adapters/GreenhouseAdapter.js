"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreenhouseAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
const JobSearchAdapter_1 = require("./JobSearchAdapter");
const platforms_1 = require("../../../lib/automation/platforms");
class GreenhouseAdapter extends JobSearchAdapter_1.JobSearchAdapter {
    constructor() {
        super(...arguments);
        this.platformName = 'greenhouse';
    }
    async search(params) {
        return this.executeSearch(async () => {
            const jobs = [];
            const keyword = params.keywords.join(' ').toLowerCase();
            const companyPromises = platforms_1.GREENHOUSE_COMPANIES.slice(0, 15).map(async (company) => {
                try {
                    const url = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`;
                    const response = await axios_1.default.get(url, { timeout: 5000 });
                    if (response.data?.jobs) {
                        return response.data.jobs
                            .filter((job) => !keyword || job.title?.toLowerCase().includes(keyword))
                            .map((job) => {
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
                                platform: 'greenhouse',
                                postedDate: job.updated_at || new Date().toISOString(),
                                jobType: 'full-time',
                                experienceLevel: 'any',
                                skills: this.extractSkills(job.content || ''),
                                applied: false,
                                status: 'new'
                            };
                        });
                    }
                }
                catch (e) {
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
exports.GreenhouseAdapter = GreenhouseAdapter;
