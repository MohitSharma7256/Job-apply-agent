import { withRequestContext } from '@/shared/context.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { applicationTracker } from '@/services/applicationTracker.js';

export const GET = withRequestContext(async (request, { params }) => {
  try {
    const { applicationId } = params;
    const userId = request.user?.id;
    
    if (!userId) {
      throw new ValidationError('User authentication required');
    }

    // Get application
    const application = await applicationTracker.getApplication(applicationId, userId);

    return successResponse({
      application
    }, {
      message: 'Application retrieved successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to get application: ${error.message}`);
  }
});

export const PUT = withRequestContext(async (request, { params }) => {
  try {
    const { applicationId } = params;
    const userId = request.user?.id;
    const body = await request.json();
    
    if (!userId) {
      throw new ValidationError('User authentication required');
    }

    const { action, data } = body;

    // Get application first to verify ownership
    const existingApplication = await applicationTracker.getApplication(applicationId, userId);

    let updatedApplication;

    switch (action) {
      case 'update_status':
        updatedApplication = await applicationTracker.updateApplicationStatus(
          applicationId,
          data.status,
          data.action || 'status_updated',
          data.details || 'Status updated by user',
          'user',
          data.metadata
        );
        break;

      case 'add_interaction':
        updatedApplication = await applicationTracker.addInteraction(applicationId, {
          type: data.type,
          details: data.details,
          outcome: data.outcome,
          metadata: data.metadata
        });
        break;

      case 'add_note':
        updatedApplication = await applicationTracker.addNote(
          applicationId,
          data.content,
          data.tags || [],
          'user'
        );
        break;

      case 'add_reminder':
        updatedApplication = await applicationTracker.addReminder(applicationId, {
          timestamp: data.timestamp,
          message: data.message,
          type: data.type
        });
        break;

      case 'complete_reminder':
        updatedApplication = await applicationTracker.completeReminder(applicationId, data.reminderId);
        break;

      case 'update_tags':
        updatedApplication = await applicationTracker.updateTags(applicationId, data.tags);
        break;

      case 'update_priority':
        updatedApplication = await applicationTracker.updatePriority(applicationId, data.priority);
        break;

      case 'update_analytics':
        updatedApplication = await applicationTracker.updateAnalytics(applicationId, data.analytics);
        break;

      default:
        throw new ValidationError(`Unknown action: ${action}`);
    }

    return successResponse({
      application: updatedApplication
    }, {
      message: `Application ${action} successful`
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to update application: ${error.message}`);
  }
});

export const DELETE = withRequestContext(async (request, { params }) => {
  try {
    const { applicationId } = params;
    const userId = request.user?.id;
    
    if (!userId) {
      throw new ValidationError('User authentication required');
    }

    // Get application first to verify ownership
    const existingApplication = await applicationTracker.getApplication(applicationId, userId);

    // Update status to withdrawn
    const updatedApplication = await applicationTracker.updateApplicationStatus(
      applicationId,
      'withdrawn',
      'application_withdrawn',
      'Application withdrawn by user',
      'user'
    );

    return successResponse({
      application: updatedApplication
    }, {
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to withdraw application: ${error.message}`);
  }
});
