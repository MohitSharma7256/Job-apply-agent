import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '../../../../services/aiService';
import { Job, UserProfile } from '../../../../types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job, profile, jobDescription } = body as {
      job: Job;
      profile: UserProfile;
      jobDescription?: string;
    };

    if (!job || !profile) {
      return NextResponse.json(
        { error: 'Job and profile are required' },
        { status: 400 }
      );
    }

    const description = jobDescription || job.description || '';
    const tailored = await aiService.tailorResume(job, profile, description);

    return NextResponse.json({
      success: true,
      tailoredResume: tailored.tailoredContent,
      matchedSkills: tailored.matchedSkills,
      missingSkills: tailored.missingSkills,
      summary: tailored.summary,
    });

  } catch (error: any) {
    console.error('Resume tailoring error:', error);
    return NextResponse.json(
      { error: 'Resume tailoring failed', message: error.message },
      { status: 500 }
    );
  }
}
