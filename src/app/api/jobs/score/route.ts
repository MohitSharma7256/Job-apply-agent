import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '../../../../services/aiService';
import { Job, UserProfile } from '../../../../types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobs, profile } = body as {
      jobs: Job[];
      profile: UserProfile;
    };

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { error: 'Jobs array is required' },
        { status: 400 }
      );
    }

    if (!profile || !profile.skills || profile.skills.length === 0) {
      return NextResponse.json(
        { error: 'Profile with skills is required for scoring' },
        { status: 400 }
      );
    }

    const scoredJobs = await Promise.all(
      jobs.map(async (job) => {
        try {
          const scoring = await aiService.scoreJobMatch(job, profile);
          return {
            ...job,
            matchScore: scoring.matchScore,
            matchedSkills: scoring.matchedSkills,
            missingSkills: scoring.missingSkills,
            scoringReasoning: scoring.reasoning,
          };
        } catch (error) {
          return { ...job, matchScore: 5 };
        }
      })
    );

    scoredJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return NextResponse.json({
      success: true,
      count: scoredJobs.length,
      scoredJobs,
    });

  } catch (error: any) {
    console.error('Batch scoring error:', error);
    return NextResponse.json(
      { error: 'Batch scoring failed', message: error.message },
      { status: 500 }
    );
  }
}
