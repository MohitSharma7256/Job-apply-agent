import { withRequestContext } from '@/shared/context.js';
import { validateRequest } from '@/shared/schemas.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { coverLetterGenerator } from '@/intelligence/personalization/cover-letter.js';
import { CoverLetterRequestSchema } from '@/intelligence/personalization/cover-letter.js';

// Build trigger: 2026-05-04 15:18:30联想

export const POST = withRequestContext(async (request) => {
  try {
    // Check feature flag
    if (process.env.FF_COVER_LETTER_V2 !== 'true') {
      throw new ValidationError('Cover letter generation is currently disabled');
    }

    // Validate request
    const body = await request.json();
    const validatedRequest = CoverLetterRequestSchema.parse(body);

    // Rate limiting check
    const userId = request.user?.id;
    if (userId) {
      // In production, implement proper rate limiting
      console.log(`Cover letter generation request from user: ${userId}`);
    }

    // Generate cover letter
    const result = await coverLetterGenerator.generateCoverLetter(validatedRequest);

    return successResponse({
      coverLetter: result.coverLetter,
      compliance: result.compliance,
      safetyChecks: result.safetyChecks,
      warnings: result.warnings,
      confidence: result.confidence
    }, {
      message: 'Cover letter generated successfully',
      meta: {
        processingTime: result.processingTime
      }
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Cover letter generation failed: ${error.message}`);
  }
});

export const GET = withRequestContext(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      throw new ValidationError('userId parameter is required');
    }

    // Return cover letter configuration
    return successResponse({
      supportedTones: ['concise', 'technical', 'leadership', 'startup', 'professional'],
      supportedLengths: ['short', 'medium', 'long'],
      defaultSettings: {
        tone: 'professional',
        length: 'medium'
      },
      featureFlags: {
        coverLetterV2: process.env.FF_COVER_LETTER_V2 === 'true'
      }
    }, {
      message: 'Cover letter configuration retrieved successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to get configuration: ${error.message}`);
  }
});
