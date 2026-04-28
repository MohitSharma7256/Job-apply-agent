"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.POST = POST;
const server_1 = require("next/server");
const aiService_1 = require("../../../../services/aiService");
exports.runtime = 'nodejs';
async function POST(request) {
    try {
        const body = await request.json();
        const { job, profile, jobDescription } = body;
        if (!job || !profile) {
            return server_1.NextResponse.json({ error: 'Job and profile are required' }, { status: 400 });
        }
        const description = jobDescription || job.description || '';
        const tailored = await aiService_1.aiService.tailorResume(job, profile, description);
        return server_1.NextResponse.json({
            success: true,
            tailoredResume: tailored.tailoredContent,
            matchedSkills: tailored.matchedSkills,
            missingSkills: tailored.missingSkills,
            summary: tailored.summary,
        });
    }
    catch (error) {
        console.error('Resume tailoring error:', error);
        return server_1.NextResponse.json({ error: 'Resume tailoring failed', message: error.message }, { status: 500 });
    }
}
