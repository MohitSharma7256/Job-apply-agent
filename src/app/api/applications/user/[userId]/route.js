import { withRequestContext } from '@/shared/context.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { applicationTracker } from '@/services/applicationTracker.js';

export const GET = withRequestContext(async (request, { params }) => {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const filters = {
      status: searchParams.get('status') || 'all',
      platform: searchParams.get('platform') || 'all',
      priority: searchParams.get('priority') || 'all',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };

    // Get user applications
    const applications = await applicationTracker.getUserApplications(userId, filters);

    return successResponse({
      applications,
      count: applications.length,
      filters
    }, {
      message: 'Applications retrieved successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to get applications: ${error.message}`);
  }
});

export const POST = withRequestContext(async (request, { params }) => {
  try {
    const { userId } = params;
    const body = await request.json();
    
    // Create new application
    const application = await applicationTracker.createApplication({
      ...body,
      userId
    });

    return successResponse({
      application
    }, {
      message: 'Application created successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to create application: ${error.message}`);
  }
});
