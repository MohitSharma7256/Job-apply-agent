import { NextRequest, NextResponse } from 'next/server';
import { jobCacheService } from '@/services/jobCacheService';
import { supabaseService } from '@/services/supabaseService';
import { Job, UserProfile } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function searchJobsWithGemini(keywords: string[], locations: string[], platforms: string[]): Promise<Job[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || '';
  if (!apiKey) {
    console.warn('GOOGLE_AI_API_KEY not set - skipping AI search');
    return [];
  }

  const prompt = `You are a job search engine with knowledge of current job markets in India and globally.

Find 8-12 realistic, currently available job listings matching these criteria:
- Keywords/Roles: ${keywords.join(', ')}
- Locations: ${locations.join(', ')}
- Platforms: ${platforms.join(', ')}

For each job, provide realistic details that match what you'd find on these platforms today.
Make sure jobs are DIVERSE - different companies, locations, salary ranges.

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "title": "Senior React Developer",
    "company": "Infosys",
    "location": "Bangalore, Karnataka",
    "salary": "₹12-18 LPA",
    "platform": "naukri",
    "url": "https://www.naukri.com/job-listings-senior-react-developer-infosys-bangalore",
    "description": "Looking for experienced React developer with 4+ years experience...",
    "skills": ["React", "TypeScript", "Node.js", "AWS"],
    "jobType": "full-time",
    "experienceLevel": "senior"
  }
]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${err.substring(0, 300)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  // Extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No valid JSON in AI response');

  const rawJobs = JSON.parse(jsonMatch[0]);
  return rawJobs.map((j: any, i: number) => ({
    id: `ai-${Date.now()}-${i}`,
    title: j.title || 'Unknown Role',
    company: j.company || 'Company',
    location: j.location || locations[0] || 'India',
    salary: j.salary || 'Not Disclosed',
    url: j.url || `https://www.naukri.com/jobs-search?keyword=${encodeURIComponent(j.title || '')}`,
    description: j.description || '',
    skills: Array.isArray(j.skills) ? j.skills : [],
    platform: j.platform || 'naukri',
    postedDate: new Date().toISOString(),
    jobType: j.jobType || 'full-time',
    experienceLevel: j.experienceLevel || 'mid',
    matchScore: 7,
    applied: false,
    status: 'new'
  }));
}

async function scoreJobWithAI(job: Job, profile: UserProfile, apiKey: string): Promise<number> {
  try {
    const prompt = `Rate how well this job matches the candidate profile. Return ONLY a number 1-10.

Candidate Skills: ${profile.skills.join(', ')}
Candidate Experience: ${profile.experience} years
Target Roles: ${profile.targetRoles?.join(', ') || 'any'}

Job Title: ${job.title}
Job Skills: ${job.skills.join(', ')}
Job Description: ${job.description?.substring(0, 300) || ''}

Return only a single number between 1-10:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
        })
      }
    );

    if (!response.ok) return 7;
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '7';
    const score = parseFloat(text.match(/\d+(\.\d+)?/)?.[0] || '7');
    return Math.min(10, Math.max(1, score));
  } catch {
    return 7;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords, locations, platforms, profile } = body as {
      keywords: string[];
      locations: string[];
      platforms: string[];
      profile: UserProfile;
    };

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ error: 'At least one keyword is required' }, { status: 400 });
    }

    const cacheKey = jobCacheService.generateKey({ keywords, locations, platforms });
    const cachedJobs = jobCacheService.get(cacheKey);

    let jobs: Job[];

    if (cachedJobs && cachedJobs.length > 0) {
      console.log('[Cache] Returning cached results:', cachedJobs.length);
      jobs = cachedJobs;
    } else {
      console.log('[AI Search] Searching with Gemini AI...');
      try {
        jobs = await searchJobsWithGemini(
          keywords,
          locations || ['India'],
          platforms || ['naukri', 'linkedin', 'indeed']
        );
      } catch (e: any) {
        console.error('[AI Search] Failed:', e.message);
        jobs = [];
      }
      console.log(`[AI Search] Found ${jobs.length} jobs`);
    }

    // Score jobs with AI if profile has skills
    const apiKey = process.env.GOOGLE_AI_API_KEY || '';
    if (profile?.skills?.length > 0 && jobs.length > 0 && apiKey) {
      console.log('[AI Scoring] Scoring jobs...');
      const scoringPromises = jobs.slice(0, 10).map(job => 
        scoreJobWithAI(job, profile, apiKey).then(score => ({ ...job, matchScore: score }))
      );
      const scoredJobs = await Promise.all(scoringPromises);
      const remainingJobs = jobs.slice(10);
      jobs = [...scoredJobs, ...remainingJobs].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    // Cache results
    if (jobs.length > 0) {
      jobCacheService.set(cacheKey, jobs);
    }

    // Save to Supabase (non-blocking)
    supabaseService.saveJobs(jobs).catch(e => console.log('Supabase save skipped:', e.message));

    return NextResponse.json({
      success: true,
      totalFound: jobs.length,
      matchedCount: jobs.filter(j => (j.matchScore || 0) >= 6).length,
      jobs,
    });

  } catch (error: any) {
    console.error('Job search error:', error);
    return NextResponse.json(
      { error: 'Job search failed', message: error.message },
      { status: 500 }
    );
  }
}