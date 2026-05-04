import { NextResponse } from 'next/server';
import { mlPredictionService } from '@/services/mlPredictionService';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { userProfile, careerGoals, marketTrends } = await request.json();

    if (!userProfile || !careerGoals) {
      return NextResponse.json({ 
        success: false, 
        error: 'User profile and career goals are required' 
      }, { status: 400 });
    }

    // Predict career trajectory using ML
    const prediction = await mlPredictionService.predictCareerTrajectory(
      userProfile, 
      careerGoals, 
      marketTrends || {}
    );

    return NextResponse.json({
      success: true,
      prediction: prediction.prediction,
      currentTrajectory: prediction.prediction.currentTrajectory,
      potentialPaths: prediction.prediction.potentialPaths,
      skillGaps: prediction.prediction.skillGaps,
      timeline: prediction.prediction.timeline,
      confidence: prediction.prediction.confidence,
      benchmarkComparison: prediction.prediction.benchmarkComparison
    });

  } catch (error) {
    console.error('Career prediction error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
