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
exports.ShineAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const JobSearchAdapter_1 = require("./JobSearchAdapter");
class ShineAdapter extends JobSearchAdapter_1.JobSearchAdapter {
    constructor() {
        super(...arguments);
        this.platformName = 'shine';
    }
    async search(params) {
        return this.executeSearch(async () => {
            const jobs = [];
            const keyword = params.keywords.join(' ');
            const location = params.locations[0] || 'India';
            const url = `https://www.shine.com/job-search/${encodeURIComponent(keyword)}-jobs-in-${encodeURIComponent(location)}`;
            const response = await axios_1.default.get(url, {
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
exports.ShineAdapter = ShineAdapter;
