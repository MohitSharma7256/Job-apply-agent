"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const dbService_1 = require("../../../../services/dbService");
exports.runtime = 'nodejs';
async function GET() {
    try {
        const { data: jobs, error } = await dbService_1.supabase
            .from('jobs')
            .select('*')
            .eq('applied', false)
            .order('match_score', { ascending: false })
            .limit(50);
        if (error) {
            return server_1.NextResponse.json({ success: true, jobs: [] });
        }
        return server_1.NextResponse.json({
            success: true,
            jobs: (jobs || []).map(j => ({
                id: j.id,
                title: j.title,
                company: j.company,
                location: j.location,
                salary: j.salary,
                url: j.url,
                platform: j.platform,
                skills: j.skills || [],
                matchScore: j.match_score,
                applied: j.applied,
                status: j.status,
                postedDate: j.posted_at,
            }))
        });
    }
    catch (e) {
        return server_1.NextResponse.json({ success: true, jobs: [] });
    }
}
