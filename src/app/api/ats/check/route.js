import { NextResponse } from 'next/server';
import { atsOptimizerService } from '@/services/atsOptimizerService';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { resume } = await request.json();

    if (!resume) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume data is required' 
      }, { status: 400 });
    }

    // Check ATS compatibility
    const atsCheck = await atsOptimizerService.checkATSCompatibility(resume);

    return NextResponse.json({
      success: true,
      atsCheck,
      recommendations: atsCheck.recommendations,
      passed: atsCheck.passed,
      score: atsCheck.score
    });

  } catch (error) {
    console.error('ATS check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
