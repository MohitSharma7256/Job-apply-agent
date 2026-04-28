"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxDuration = exports.runtime = void 0;
exports.POST = POST;
const server_1 = require("next/server");
const applyService_1 = require("../../../../services/applyService");
const sheetService_1 = require("../../../../services/sheetService");
const automation_1 = require("../../../../services/automation");
const uuid_1 = require("uuid");
exports.runtime = 'nodejs';
exports.maxDuration = 300;
async function POST(request) {
    const startTime = Date.now();
    try {
        const body = await request.json();
        const { jobs, profile, resumeText, rateLimit } = body;
        if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
            return server_1.NextResponse.json({ error: 'Jobs array is required' }, { status: 400 });
        }
        const results = [];
        let appliedCount = 0;
        const hourlyLimit = rateLimit?.maxPerHour || 10;
        let appliedThisEndpoint = 0;
        for (const job of jobs) {
            if (appliedThisEndpoint >= hourlyLimit) {
                results.push({ jobId: job.id, success: false, message: 'Hourly limit reached' });
                continue;
            }
            const canApply = await applyService_1.applyService.canApply();
            if (!canApply) {
                results.push({ jobId: job.id, success: false, message: 'Daily limit reached' });
                continue;
            }
            const result = await applyService_1.applyService.applyToJob(job, resumeText);
            const duration = Date.now() - startTime;
            if (result.success) {
                appliedCount++;
                appliedThisEndpoint++;
                automation_1.platformHealthService.trackSuccess(job.platform, duration);
                const record = {
                    id: (0, uuid_1.v4)(),
                    jobId: job.id,
                    jobTitle: job.title,
                    company: job.company,
                    location: job.location,
                    salary: job.salary,
                    platform: job.platform,
                    appliedAt: new Date().toISOString(),
                    status: 'applied',
                };
                try {
                    await sheetService_1.sheetService.addApplication(record);
                }
                catch (e) { }
                results.push({ jobId: job.id, success: true, message: result.message });
            }
            else {
                automation_1.platformHealthService.trackFailure(job.platform, duration);
                results.push({ jobId: job.id, success: false, message: result.message });
            }
            await new Promise(r => setTimeout(r, 2000));
        }
        return server_1.NextResponse.json({
            success: true,
            appliedCount,
            totalJobs: jobs.length,
            results,
            remainingToday: applyService_1.applyService.getRemainingApplications(),
        });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
