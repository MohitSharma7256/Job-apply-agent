import { withRequestContext, validateRequest } from '@/shared/context.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { matchScoringEngine } from '@/intelligence/match-scoring/scoring-engine.js';
import { UserProfileSchema, JobPostingSchema } from '@/intelligence/match-scoring/scoring-engine.js';

export const POST = withRequestContext(async (request) => {
  try {
    const body = await request.json();
    const { userProfile, jobPosting, weights } = body;

    // Validate inputs
    const validatedProfile = UserProfileSchema.parse(userProfile);
    const validatedJob = JobPostingSchema.parse(jobPosting);

    // Calculate match score
    const result = await matchScoringEngine.calculateMatchScore(
      validatedProfile,
      validatedJob,
      weights
    );

    return successResponse({
      match: {
        score: result.overallScore,
        confidence: result.confidence,
        riskFlags: result.riskFlags,
        disqualified: result.disqualified,
        disqualifiedReason: result.disqualifiedReason
      },
      factors: result.factorScores,
      explanations: result.explanations,
      metadata: result.metadata
    }, {
      message: result.disqualified ? 'Job disqualified due to hard filters' : 'Match score calculated successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to calculate match score: ${error.message}`);
  }
});

export const GET = withRequestContext(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      throw new ValidationError('userId parameter is required');
    }

    // Get user's current profile (would fetch from database)
    // For now, return current scoring weights
    const weights = matchScoringEngine.getWeights();

    return successResponse({
      userId,
      scoringWeights: weights,
      confidenceThresholds: matchScoringEngine.confidenceThresholds
    }, {
      message: 'Scoring configuration retrieved successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to get scoring configuration: ${error.message}`);
  }
});

export const PUT = withRequestContext(async (request) => {
  try {
    const body = await request.json();
    const { weights } = body;

    // Update scoring weights
    matchScoringEngine.updateWeights(weights);

    return successResponse({
      weights: matchScoringEngine.getWeights()
    }, {
      message: 'Scoring weights updated successfully'
    });

  } catch (error) {
    throw new Error(`Failed to update scoring weights: ${error.message}`);
  }
});
