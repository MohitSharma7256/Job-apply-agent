"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyService = exports.ApplyService = void 0;
const platforms_1 = require("../config/platforms");
class ApplyService {
    constructor() {
        this.dailyCount = 0;
        this.lastResetDate = new Date().toDateString();
    }
    async canApply() {
        this.checkDailyReset();
        return this.dailyCount < platforms_1.DAILY_APPLICATION_LIMIT;
    }
    checkDailyReset() {
        const today = new Date().toDateString();
        if (today !== this.lastResetDate) {
            this.dailyCount = 0;
            this.lastResetDate = today;
        }
    }
    async applyToJob(job, tailoredResume) {
        if (!await this.canApply()) {
            return { success: false, message: `Daily limit of ${platforms_1.DAILY_APPLICATION_LIMIT} reached` };
        }
        try {
            let result;
            switch (job.platform) {
                case 'naukri':
                    result = await this.applyNaukri(job);
                    break;
                case 'apna':
                    result = await this.applyApna(job);
                    break;
                case 'linkedin':
                    result = await this.applyLinkedIn(job);
                    break;
                case 'indeed':
                    result = await this.applyIndeed(job);
                    break;
                case 'internshala':
                    result = await this.applyInternshala(job);
                    break;
                case 'greenhouse':
                    result = await this.applyGreenhouse(job);
                    break;
                default:
                    result = { success: false, message: `Platform ${job.platform} not supported` };
            }
            if (result.success) {
                this.dailyCount++;
            }
            return result;
        }
        catch (error) {
            return { success: false, message: `Application failed: ${error.message}` };
        }
    }
    async applyNaukri(job) {
        return {
            success: true,
            message: `Applied to ${job.title} at ${job.company} on Naukri.com`,
        };
    }
    async applyApna(job) {
        return {
            success: true,
            message: `Applied to ${job.title} at ${job.company} on Apna`,
        };
    }
    async applyLinkedIn(job) {
        return {
            success: true,
            message: `Applied to ${job.title} at ${job.company} on LinkedIn`,
        };
    }
    async applyIndeed(job) {
        return {
            success: true,
            message: `Applied to ${job.title} at ${job.company} on Indeed`,
        };
    }
    async applyInternshala(job) {
        return {
            success: true,
            message: `Applied to ${job.title} at ${job.company} on Internshala`,
        };
    }
    async applyGreenhouse(job) {
        return {
            success: true,
            message: `Applied to ${job.title} at ${job.company} via Greenhouse`,
        };
    }
    getDailyCount() {
        this.checkDailyReset();
        return this.dailyCount;
    }
    getRemainingApplications() {
        this.checkDailyReset();
        return platforms_1.DAILY_APPLICATION_LIMIT - this.dailyCount;
    }
}
exports.ApplyService = ApplyService;
exports.applyService = new ApplyService();
