import { withRequestContext } from '@/shared/context.js';
import { validateRequest } from '@/shared/schemas.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { matchScoringEngine } from '@/intelligence/match-scoring/scoring-engine.js';
import { UserProfileSchema, JobPostingSchema } from '@/intelligence/match-scoring/scoring-engine.js';

export const POST = withRequestContext(async (request) => {
  try {
    const body = await request.json();
    const { userProfile, jobPostings, weights } = body;

    // Validate inputs
    const validatedProfile = UserProfileSchema.parse(userProfile);
    const validatedJobs = jobPostings.map(job => JobPostingSchema.parse(job));

    // Validate job limit
    if (validatedJobs.length > 100) {
      throw new ValidationError('Maximum 100 jobs allowed per batch');
    }

    // Calculate batch scores
    const results = await matchScoringEngine.batchScoreJobs(
      validatedProfile,
      validatedJobs,
      weights
    );

    // Separate qualified and disqualified jobs
    const qualifiedJobs = results.filter(r => !r.disqualified);
    const disqualifiedJobs = results.filter(r => r.disqualified);

    return successResponse({
      summary: {
        totalJobs: results.length,
        qualifiedJobs: qualifiedJobs.length,
        disqualifiedJobs: disqualifiedJobs.length,
        averageScore: qualifiedJobs.length > 0 
          ? (qualifiedJobs.reduce((sum, job) => sum + job.score, 0) / qualifiedJobs.length).toFixed(2)
          : 0
      },
      jobs: results,
      qualifiedJobs: qualifiedJobs.map(job => ({
        jobId: job.jobId,
        score: job.score,
        confidence: job.confidence,
        riskFlags: job.riskFlags
      })),
      disqualifiedJobs: disqualifiedJobs.map(job => ({
        jobId: job.jobId,
        reason: job.error || 'Disqualified by hard filters'
      }))
    }, {
      message: `Batch scoring completed for ${results.length} jobs`
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to calculate batch scores: ${error.message}`);
  }
});
