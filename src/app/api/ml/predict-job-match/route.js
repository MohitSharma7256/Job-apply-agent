import { NextResponse } from 'next/server';
import { mlPredictionService } from '@/services/mlPredictionService';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { userProfile, jobDescription, historicalData } = await request.json();

    if (!userProfile || !jobDescription) {
      return NextResponse.json({ 
        success: false, 
        error: 'User profile and job description are required' 
      }, { status: 400 });
    }

    // Predict job match using ML
    const prediction = await mlPredictionService.predictJobMatch(
      userProfile, 
      jobDescription, 
      historicalData || []
    );

    return NextResponse.json({
      success: true,
      prediction: prediction.prediction,
      matchProbability: prediction.prediction.matchProbability,
      confidence: prediction.prediction.confidence,
      explanation: prediction.prediction.explanation,
      benchmarkComparison: prediction.prediction.benchmarkComparison
    });

  } catch (error) {
    console.error('Job match prediction error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
