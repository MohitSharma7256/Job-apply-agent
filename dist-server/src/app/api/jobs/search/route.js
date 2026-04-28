"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const dbService_1 = require("../../../../services/dbService");
const matchEngine_1 = require("../../../../lib/ai/matchEngine");
exports.runtime = 'nodejs';
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const location = searchParams.get('location') || '';
        const platform = searchParams.get('platform') || '';
        const minScore = parseInt(searchParams.get('minScore') || '0');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        let dbQuery = dbService_1.supabase
            .from('jobs')
            .select('*')
            .order('createdAt', { ascending: false })
            .range(offset, offset + limit - 1);
        if (query) {
            dbQuery = dbQuery.or(`title.ilike.%${query}%,company.ilike.%${query}%,description.ilike.%${query}%`);
        }
        if (location) {
            dbQuery = dbQuery.ilike('location', `%${location}%`);
        }
        if (platform) {
            dbQuery = dbQuery.eq('platform', platform);
        }
        const { data: jobs, error } = await dbQuery;
        if (error) {
            console.error('DB error:', error);
            return server_1.NextResponse.json({ error: error.message }, { status: 500 });
        }
        const profile = {
            skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
            experience: 3,
            location: 'Bangalore',
            targetRoles: ['Software Engineer', 'Full Stack Developer'],
            targetSalary: 1500000,
        };
        const enrichedJobs = await Promise.all((jobs || []).map(async (job) => {
            try {
                const matchResult = await matchEngine_1.matchEngine.scoreJob(job, profile);
                return {
                    ...job,
                    matchScore: matchResult.score,
                    skillMatch: matchResult.matchedSkills || [],
                    missingSkills: matchResult.missingSkills || [],
                    experienceMatch: 'match',
                };
            }
            catch {
                return {
                    ...job,
                    matchScore: job.matchScore || 75,
                    skillMatch: { matched: [], missing: [] },
                    missingSkills: [],
                    experienceMatch: 'match',
                };
            }
        }));
        const filteredJobs = enrichedJobs.filter(job => job.matchScore >= minScore);
        return server_1.NextResponse.json({
            success: true,
            jobs: filteredJobs,
            total: filteredJobs.length,
            hasMore: (jobs || []).length === limit,
        });
    }
    catch (error) {
        console.error('Search error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const { jobs, userId } = body;
        if (!Array.isArray(jobs) || jobs.length === 0) {
            return server_1.NextResponse.json({ error: 'Jobs array required' }, { status: 400 });
        }
        const insertedJobs = await Promise.all(jobs.map(async (job) => {
            const { data, error } = await dbService_1.supabase
                .from('jobs')
                .upsert({
                externalId: job.externalId || job.id,
                platform: job.platform,
                title: job.title,
                company: job.company,
                location: job.location,
                description: job.description,
                url: job.url,
                salary: job.salary,
                matchScore: job.matchScore || 75,
                status: 'new',
                createdAt: new Date().toISOString(),
            }, { onConflict: 'externalId,platform' })
                .select()
                .single();
            if (error) {
                console.error('Insert error:', error);
                return null;
            }
            return data;
        }));
        const validJobs = insertedJobs.filter(Boolean);
        return server_1.NextResponse.json({
            success: true,
            inserted: validJobs.length,
            jobs: validJobs,
        });
    }
    catch (error) {
        console.error('Batch insert error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
