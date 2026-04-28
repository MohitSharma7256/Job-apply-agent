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
        const { jobs, profile } = body;
        if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
            return server_1.NextResponse.json({ error: 'Jobs array is required' }, { status: 400 });
        }
        if (!profile || !profile.skills || profile.skills.length === 0) {
            return server_1.NextResponse.json({ error: 'Profile with skills is required for scoring' }, { status: 400 });
        }
        const scoredJobs = await Promise.all(jobs.map(async (job) => {
            try {
                const scoring = await aiService_1.aiService.scoreJobMatch(job, profile);
                return {
                    ...job,
                    matchScore: scoring.matchScore,
                    matchedSkills: scoring.matchedSkills,
                    missingSkills: scoring.missingSkills,
                    scoringReasoning: scoring.reasoning,
                };
            }
            catch (error) {
                return { ...job, matchScore: 5 };
            }
        }));
        scoredJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        return server_1.NextResponse.json({
            success: true,
            count: scoredJobs.length,
            scoredJobs,
        });
    }
    catch (error) {
        console.error('Batch scoring error:', error);
        return server_1.NextResponse.json({ error: 'Batch scoring failed', message: error.message }, { status: 500 });
    }
}
