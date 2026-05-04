import { withRequestContext } from '@/shared/context.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { applicationTracker } from '@/services/applicationTracker.js';

export const GET = withRequestContext(async (request, { params }) => {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      throw new ValidationError('Search query parameter "q" is required');
    }

    // Search applications
    const searchResults = await applicationTracker.searchApplications(userId, query);

    return successResponse({
      applications: searchResults,
      query,
      count: searchResults.length
    }, {
      message: 'Application search completed successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to search applications: ${error.message}`);
  }
});
