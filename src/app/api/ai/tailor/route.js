import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/services/aiService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { job, profile } = await request.json();

    if (!job || !profile) {
      return NextResponse.json({ error: 'Job and Profile required' }, { status: 400 });
    }

    const tailoredContent = await aiService.tailorResume(profile.resumeText, job.description);
    const coverLetter = await aiService.generateCoverLetter(profile.resumeText, job.description);

    return NextResponse.json({
      success: true,
      tailoredContent,
      coverLetter,
    });
  } catch (error: any) {
    console.error('AI Tailoring error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
