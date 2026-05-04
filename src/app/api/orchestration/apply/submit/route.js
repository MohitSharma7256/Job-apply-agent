import { withRequestContext, validateRequest } from '@/shared/context.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { applyModeManager } from '@/orchestration/safety/apply-modes.js';
import { ApplyRequestSchema } from '@/orchestration/safety/apply-modes.js';

export const POST = withRequestContext(async (request) => {
  try {
    // Validate request
    const body = await request.json();
    const validatedRequest = ApplyRequestSchema.parse({
      ...body,
      userId: request.user?.id
    });

    // Submit application
    const result = await applyModeManager.submitApplication(validatedRequest);

    return successResponse({
      applicationId: result.applicationId,
      status: result.status,
      submittedAt: result.submittedAt,
      expiresAt: result.expiresAt,
      qualityScores: result.qualityScores
    }, {
      message: `Application ${result.status} successfully`,
      meta: {
        correlationId: contextualEventEmitter.getCorrelationId()
      }
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Application submission failed: ${error.message}`);
  }
});
