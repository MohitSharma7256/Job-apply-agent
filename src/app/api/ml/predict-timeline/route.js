import { NextResponse } from 'next/server';
import { mlPredictionService } from '@/services/mlPredictionService';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { userProfile, jobDetails, marketData } = await request.json();

    if (!userProfile || !jobDetails) {
      return NextResponse.json({ 
        success: false, 
        error: 'User profile and job details are required' 
      }, { status: 400 });
    }

    // Predict application timeline using ML
    const prediction = await mlPredictionService.predictApplicationTimeline(
      userProfile, 
      jobDetails, 
      marketData || {}
    );

    return NextResponse.json({
      success: true,
      prediction: prediction.prediction,
      estimatedDays: prediction.prediction.estimatedDays,
      confidence: prediction.prediction.confidence,
      breakdown: prediction.prediction.breakdown,
      riskFactors: prediction.prediction.riskFactors,
      recommendations: prediction.prediction.recommendations,
      benchmarkComparison: prediction.prediction.benchmarkComparison
    });

  } catch (error) {
    console.error('Timeline prediction error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
