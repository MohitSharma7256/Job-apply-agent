"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.POST = POST;
exports.GET = GET;
const server_1 = require("next/server");
const dbService_1 = require("../../../services/dbService");
const matchEngine_1 = require("../../../lib/ai/matchEngine");
const companyResearch_1 = require("../../../lib/ai/companyResearch");
exports.runtime = 'nodejs';
async function POST(request) {
    try {
        const body = await request.json();
        const { keywords, locations, platforms, experience, filters } = body;
        const jobs = [];
        for (const platform of platforms) {
            let searchUrl = '';
            let query = encodeURIComponent(keywords.join(' '));
            switch (platform) {
                case 'linkedin':
                    searchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobsTabFromSearch?keywords=${query}&location=${encodeURIComponent(locations[0])}`;
                    break;
                case 'indeed':
                    searchUrl = `https://www.indeed.com/jobs?q=${query}&l=${encodeURIComponent(locations[0])}`;
                    break;
                case 'naukri':
                    searchUrl = `https://www.naukri.com/jobs-search?keyword=${query}&location=${encodeURIComponent(locations[0])}`;
                    break;
                case 'internshala':
                    searchUrl = `https://internshala.com/internships/${query}-internship`;
                    break;
                default:
                    continue;
            }
            try {
                const response = await fetch(searchUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const html = await response.text();
                const jobMatches = extractJobs(html, platform);
                jobs.push(...jobMatches);
            }
            catch (e) {
                console.error(`${platform} search failed:`, e);
            }
        }
        const { data: { user } } = await dbService_1.supabase.auth.getUser();
        const userId = user?.id;
        const insertJobs = await Promise.all(jobs.map(async (job) => {
            let matchScore = 50;
            let companyProfile = null;
            if (userId && body.profile) {
                try {
                    const matchResult = await matchEngine_1.matchEngine.scoreJob(job, body.profile);
                    matchScore = matchResult.score;
                    if (job.companyDomain) {
                        companyProfile = await companyResearch_1.companyResearchService.getCompanyProfile(job.company);
                    }
                }
                catch (e) {
                    console.error('Match scoring failed:', e);
                }
            }
            return {
                externalJobId: job.id,
                title: job.title,
                company: job.company,
                location: job.location,
                salaryMin: job.salary?.min,
                salaryMax: job.salary?.max,
                description: job.description,
                requirements: job.requirements,
                url: job.url,
                platform: job.platform,
                matchScore,
                status: 'new',
            };
        }));
        if (insertJobs.length > 0) {
            const { data: inserted } = await dbService_1.supabase
                .from('jobs')
                .upsert(insertJobs, { onConflict: 'externalJobId,platform' })
                .select();
        }
        return server_1.NextResponse.json({
            success: true,
            found: jobs.length,
            platforms: [...new Set(jobs.map(j => j.platform))],
        });
    }
    catch (error) {
        console.error('Search error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
function extractJobs(html, platform) {
    const jobs = [];
    const patterns = {
        linkedin: /"jobTitle":"([^"]+)","jobId":(\d+).*?"companyName":"([^"]+)".*?"formattedLocation":"([^"]+)"/g,
        indeed: /<a[^>]*job=(\d+)[^>]*>.*?<li[^>]*>.*?<([^<]+)<.*?<li[^>]*>.*?<([^<]+)<.*?salary.*?([^<]+)/g,
        naukri: /title:"([^"]+)".*?company:"([^"]+)".*?location:"([^"]+)"/g,
    };
    const pattern = patterns[platform];
    if (!pattern)
        return [];
    let match;
    while ((match = pattern.exec(html)) !== null) {
        if (platform === 'linkedin') {
            jobs.push({
                id: match[2],
                title: match[1],
                company: match[3],
                location: match[4],
                platform,
                url: `https://www.linkedin.com/jobs/view/${match[2]}`,
            });
        }
        else if (platform === 'indeed') {
            jobs.push({
                id: match[1],
                title: match[2],
                company: match[3],
                location: match[4],
                salary: match[5],
                platform,
                url: `https://www.indeed.com/viewjob?jk=${match[1]}`,
            });
        }
    }
    return jobs.slice(0, 20);
}
async function GET(request) {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const { data: jobs, error } = await dbService_1.supabase
        .from('jobs')
        .select('*')
        .eq('platform', platform || 'linkedin')
        .order('matchScore', { ascending: false })
        .limit(50);
    return server_1.NextResponse.json({
        success: !error,
        jobs: jobs || [],
        count: jobs?.length || 0,
    });
}
