import { NextRequest, NextResponse } from 'next/server';
import { jobSearchService } from '@/services/jobSearchService';
import { aiService } from '@/services/aiService';
import { supabaseService } from '@/services/supabaseService';
import { jobCacheService } from '@/services/jobCacheService';
import { Job, JobSearchParams, UserProfile } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords, locations, platforms, jobTypes, experienceLevel, salaryMin, maxResults, profile } = body as {
      keywords: string[];
      locations: string[];
      platforms: string[];
      jobTypes?: string[];
      experienceLevel?: string;
      salaryMin?: number;
      maxResults?: number;
      profile: UserProfile;
    };

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'At least one keyword is required' },
        { status: 400 }
      );
    }

    const searchParams: JobSearchParams = {
      keywords,
      locations: locations || ['India', 'Remote'],
      platforms: (platforms || ['naukri', 'linkedin', 'greenhouse']).filter(p => 
        ['naukri', 'linkedin', 'greenhouse', 'apna', 'indeed', 'internshala', 'shine'].includes(p)
      ) as any[],
      jobTypes,
      experienceLevel,
      salaryMin,
      maxResults: maxResults || 50,
    };

    console.log('Initiating parallel job search with params:', JSON.stringify(searchParams));

    const cacheKey = jobCacheService.generateKey({ keywords, locations, platforms });
    const cachedJobs = jobCacheService.get(cacheKey);

    let jobs: Job[] = [];
    if (cachedJobs) {
      console.log('[Cache] Returning cached results');
      jobs = cachedJobs;
    } else {
      // Try platform scrapers first, fall back to AI if they fail
      const scraperJobs = await jobSearchService.searchAllPlatforms(searchParams);
      
      if (scraperJobs.length > 0) {
        jobs = scraperJobs;
      } else {
        // AI-powered search as guaranteed fallback
        console.log('[Search] Scrapers blocked, using AI-powered job search...');
        jobs = await aiService.searchJobsWithAI(searchParams);
      }
      
      if (jobs.length > 0) {
        jobCacheService.set(cacheKey, jobs);
      }
    }

    let enrichedJobs = jobs;
    if (profile && profile.skills && profile.skills.length > 0) {
      // Enrich with AI analysis in parallel (limited to top 15 to avoid API rate limits)
      const topJobs = jobs.slice(0, 15);
      const remainingJobs = jobs.slice(15);

      const enrichedTopJobs = await Promise.all(
        topJobs.map(async (job) => {
          try {
            const scoring = await aiService.scoreJobMatch(job, profile);
            return {
              ...job,
              matchScore: scoring.matchScore,
              aiAnalysis: {
                reasoning: scoring.reasoning,
                tailoringNotes: scoring.tailoredNotes,
                skillGapAnalysis: scoring.skillGapAnalysis,
                coverLetter: scoring.coverLetter
              },
              skills: [...new Set([...job.skills, ...scoring.matchedSkills])],
            };
          } catch (error) {
            console.error(`AI scoring failed for ${job.title}:`, error);
            return { ...job, matchScore: 5 };
          }
        })
      );

      enrichedJobs = [...enrichedTopJobs, ...remainingJobs];
      
      // Save to Supabase (Production DB)
      try {
        await supabaseService.saveJobs(enrichedJobs);
      } catch (e) {
        console.error('Supabase save error:', e);
      }

      enrichedJobs = enrichedJobs
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    return NextResponse.json({
      success: true,
      totalFound: jobs.length,
      matchedCount: enrichedJobs.filter(j => (j.matchScore || 0) >= 6).length,
      jobs: enrichedJobs,
    });

  } catch (error: any) {
    console.error('Job search error:', error);
    return NextResponse.json(
      { error: 'Job search failed', message: error.message },
      { status: 500 }
    );
  }
}