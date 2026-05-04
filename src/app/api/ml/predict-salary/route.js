import { NextResponse } from 'next/server';
import { mlPredictionService } from '@/services/mlPredictionService';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { userProfile, jobDetails, locationData } = await request.json();

    if (!userProfile || !jobDetails) {
      return NextResponse.json({ 
        success: false, 
        error: 'User profile and job details are required' 
      }, { status: 400 });
    }

    // Predict salary range using ML
    const prediction = await mlPredictionService.predictSalary(
      userProfile, 
      jobDetails, 
      locationData || {}
    );

    return NextResponse.json({
      success: true,
      prediction: prediction.prediction,
      estimatedRange: prediction.prediction.estimatedRange,
      confidence: prediction.prediction.confidence,
      negotiationRange: prediction.prediction.negotiationRange,
      marketComparison: prediction.prediction.marketComparison,
      benchmarkComparison: prediction.prediction.benchmarkComparison
    });

  } catch (error) {
    console.error('Salary prediction error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
