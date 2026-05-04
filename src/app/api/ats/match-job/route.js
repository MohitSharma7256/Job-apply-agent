import { NextResponse } from 'next/server';
import { atsOptimizerService } from '@/services/atsOptimizerService';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { resume, jobDescription } = await request.json();

    if (!resume || !jobDescription) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume and job description are required' 
      }, { status: 400 });
    }

    // Match resume with job
    const jobMatch = await atsOptimizerService.matchJob(resume, jobDescription);

    return NextResponse.json({
      success: true,
      jobMatch,
      matchPercentage: jobMatch.matchPercentage,
      missingKeywords: jobMatch.missingKeywords,
      strengths: jobMatch.strengths,
      improvements: jobMatch.improvements,
      recommendation: jobMatch.recommendation
    });

  } catch (error) {
    console.error('Job matching error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
