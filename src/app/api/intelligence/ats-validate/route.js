import { withRequestContext } from '@/shared/context.js';
import { validateRequest } from '@/shared/schemas.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { atsValidator } from '@/intelligence/personalization/ats-validator.js';
import { ATSValidationRequestSchema } from '@/intelligence/personalization/ats-validator.js';

export const POST = withRequestContext(async (request) => {
  try {
    // Check feature flag
    if (process.env.FF_ATS_VALIDATOR_V1 !== 'true') {
      throw new ValidationError('ATS validation is currently disabled');
    }

    // Validate request
    const body = await request.json();
    const validatedRequest = ATSValidationRequestSchema.parse(body);

    // Rate limiting check
    const userId = request.user?.id;
    if (userId) {
      // In production, implement proper rate limiting
      console.log(`ATS validation request from user: ${userId}`);
    }

    // Validate content
    const result = await atsValidator.validateContent(validatedRequest);

    return successResponse({
      score: result.score,
      violations: result.violations,
      recommendations: result.recommendations,
      keywordAnalysis: result.keywordAnalysis,
      formattingScore: result.formattingScore,
      readabilityScore: result.readabilityScore,
      fixedContent: result.fixedContent
    }, {
      message: result.fixedContent ? 'Content validated and auto-fixed' : 'Content validated',
      meta: {
        correlationId: contextualEventEmitter.getCorrelationId(),
        processingTime: result.metadata.processingTime
      }
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`ATS validation failed: ${error.message}`);
  }
});

export const GET = withRequestContext(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      throw new ValidationError('userId parameter is required');
    }

    // Return ATS validation configuration
    return successResponse({
      supportedContentTypes: ['resume', 'cover_letter', 'both'],
      validationModes: ['strict', 'standard'],
      autoFixCapabilities: [
        'format_non_ascii',
        'format_long_lines',
        'structure_inconsistent_dates'
      ],
      scoringCriteria: {
        formatting: {
          weight: 0.3,
          maxDeduction: 20
        },
        readability: {
          weight: 0.2,
          targetScore: 60
        },
        keywords: {
          weight: 0.3,
          minDensity: 0.3
        },
        structure: {
          weight: 0.2,
          requiredSections: ['Summary', 'Experience', 'Education']
        }
      },
      featureFlags: {
        atsValidatorV1: process.env.FF_ATS_VALIDATOR_V1 === 'true'
      }
    }, {
      message: 'ATS validation configuration retrieved successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to get configuration: ${error.message}`);
  }
});
