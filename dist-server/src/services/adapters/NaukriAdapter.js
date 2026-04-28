"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NaukriAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const JobSearchAdapter_1 = require("./JobSearchAdapter");
class NaukriAdapter extends JobSearchAdapter_1.JobSearchAdapter {
    constructor() {
        super(...arguments);
        this.platformName = 'naukri';
    }
    async search(params) {
        return this.executeSearch(async () => {
            const jobs = [];
            const keyword = params.keywords.join(' OR ');
            for (const location of params.locations.slice(0, 2)) {
                const url = `https://www.naukri.com/jobs-search?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
                const response = await axios_1.default.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Referer': 'https://www.google.com/',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    timeout: 10000
                });
                const $ = cheerio.load(response.data);
                const jobCards = $('.jobTuple, .srp-jobtuple, .job-card');
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
exports.NaukriAdapter = NaukriAdapter;
