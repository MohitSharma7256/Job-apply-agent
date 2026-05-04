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

    // Optimize resume for job
    const optimization = await atsOptimizerService.optimizeResumeForJob(resume, jobDescription);

    return NextResponse.json({
      success: true,
      optimization,
      beforeScore: optimization.beforeScore,
      afterScore: optimization.afterScore,
      improvement: optimization.improvement,
      recommendations: optimization.optimization.improvements
    });

  } catch (error) {
    console.error('Resume optimization error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
