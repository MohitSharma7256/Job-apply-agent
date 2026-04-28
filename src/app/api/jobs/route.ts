import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/services/dbService';
import { matchEngine } from '../../../lib/ai/matchEngine';
import { companyResearchService } from '../../../lib/ai/companyResearch';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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
      } catch (e) {
        console.error(`${platform} search failed:`, e);
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const insertJobs = await Promise.all(jobs.map(async (job: any) => {
      let matchScore = 50;
      let companyProfile = null;
      
      if (userId && body.profile) {
        try {
          const matchResult = await matchEngine.scoreJob(job, body.profile);
          matchScore = matchResult.score;
          
          if (job.companyDomain) {
            companyProfile = await companyResearchService.getCompanyProfile(job.company);
          }
        } catch (e) {
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
      const { data: inserted } = await supabase
        .from('jobs')
        .upsert(insertJobs, { onConflict: 'externalJobId,platform' })
        .select();
    }

    return NextResponse.json({
      success: true,
      found: jobs.length,
      platforms: [...new Set(jobs.map(j => j.platform))],
    });

  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function extractJobs(html: string, platform: string): any[] {
  const jobs = [];
  const patterns = {
    linkedin: /"jobTitle":"([^"]+)","jobId":(\d+).*?"companyName":"([^"]+)".*?"formattedLocation":"([^"]+)"/g,
    indeed: /<a[^>]*job=(\d+)[^>]*>.*?<li[^>]*>.*?<([^<]+)<.*?<li[^>]*>.*?<([^<]+)<.*?salary.*?([^<]+)/g,
    naukri: /title:"([^"]+)".*?company:"([^"]+)".*?location:"([^"]+)"/g,
  };

  const pattern = patterns[platform as keyof typeof patterns];
  if (!pattern) return [];

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
    } else if (platform === 'indeed') {
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('platform', platform || 'linkedin')
    .order('matchScore', { ascending: false })
    .limit(50);

  return NextResponse.json({
    success: !error,
    jobs: jobs || [],
    count: jobs?.length || 0,
  });
}
