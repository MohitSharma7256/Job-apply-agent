import { withRequestContext } from '@/shared/context.js';
import { validateRequest } from '@/shared/schemas.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { resumeTailorEngine } from '@/intelligence/personalization/resume-tailor.js';
import { ResumeTailorRequestSchema } from '@/intelligence/personalization/resume-tailor.js';

export const POST = withRequestContext(async (request) => {
  try {
    // Check feature flag
    if (process.env.FF_RESUME_TAILOR_V2 !== 'true') {
      throw new ValidationError('Resume tailoring is currently disabled');
    }

    // Validate request
    const body = await request.json();
    const validatedRequest = ResumeTailorRequestSchema.parse(body);

    // Rate limiting check
    const userId = request.user?.id;
    if (userId) {
      // In production, implement proper rate limiting
      console.log(`Resume tailoring request from user: ${userId}`);
    }

    // Tailor resume
    const result = await resumeTailorEngine.tailorResume(validatedRequest);

    return successResponse({
      tailoredResume: result.tailoredResume,
      atsCompliance: result.atsCompliance,
      keywordAnalysis: result.keywordAnalysis,
      truthGuardReport: result.truthGuardReport,
      diffMetadata: result.diffMetadata,
      safetyChecks: result.safetyChecks,
      warnings: result.warnings,
      confidence: result.confidence
    }, {
      message: 'Resume tailored successfully',
      meta: {
        correlationId: result.metadata.correlationId,
        processingTime: result.metadata.processingTime
      }
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Resume tailoring failed: ${error.message}`);
  }
});

export const GET = withRequestContext(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      throw new ValidationError('userId parameter is required');
    }

    // Return resume tailoring configuration
    return successResponse({
      supportedTones: ['professional', 'technical', 'leadership', 'startup', 'concise'],
      supportedIntensities: ['low', 'medium', 'high'],
      defaultSettings: {
        tone: 'professional',
        intensity: 'medium',
        preserveMetrics: true
      },
      featureFlags: {
        resumeTailorV2: process.env.FF_RESUME_TAILOR_V2 === 'true'
      }
    }, {
      message: 'Resume tailoring configuration retrieved successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to get configuration: ${error.message}`);
  }
});
