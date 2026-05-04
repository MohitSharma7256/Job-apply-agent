import { NextResponse } from 'next/server';
import { atsOptimizerService } from '@/services/atsOptimizerService';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { resume, jobDescription } = await request.json();

    if (!resume) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume data is required' 
      }, { status: 400 });
    }

    // Get comprehensive quality score
    const qualityScore = await atsOptimizerService.getResumeQualityScore(resume, jobDescription);

    return NextResponse.json({
      success: true,
      qualityScore,
      grade: qualityScore.grade,
      breakdown: qualityScore.breakdown,
      strengths: qualityScore.strengths,
      improvements: qualityScore.improvements,
      atsCheck: qualityScore.atsCheck
    });

  } catch (error) {
    console.error('Quality score error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
