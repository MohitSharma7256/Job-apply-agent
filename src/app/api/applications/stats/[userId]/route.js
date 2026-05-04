import { withRequestContext } from '@/shared/context.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { applicationTracker } from '@/services/applicationTracker.js';

export const GET = withRequestContext(async (request, { params }) => {
  try {
    const { userId } = params;
    
    // Get application statistics
    const stats = await applicationTracker.getApplicationStats(userId);

    return successResponse({
      stats
    }, {
      message: 'Application statistics retrieved successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to get application stats: ${error.message}`);
  }
});
