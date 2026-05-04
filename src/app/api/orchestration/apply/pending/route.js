import { withRequestContext } from '@/shared/context.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { applyModeManager } from '@/orchestration/safety/apply-modes.js';

export const GET = withRequestContext(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || request.user?.id;

    if (!userId) {
      throw new ValidationError('userId parameter is required');
    }

    const pendingApplications = await applyModeManager.getPendingApplications(userId);

    return successResponse({
      applications: pendingApplications,
      count: pendingApplications.length
    }, {
      message: 'Pending applications retrieved successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to get pending applications: ${error.message}`);
  }
});

export const POST = withRequestContext(async (request) => {
  try {
    const body = await request.json();
    const { action, applicationIds, reason, hours } = body;

    if (!action || !applicationIds || !Array.isArray(applicationIds)) {
      throw new ValidationError('action and applicationIds array are required');
    }

    const userId = request.user?.id;
    if (!userId) {
      throw new ValidationError('User authentication required');
    }

    let results = [];

    switch (action) {
      case 'approve':
        if (!reason) {
          throw new ValidationError('Reason is required for approval');
        }
        for (const applicationId of applicationIds) {
          try {
            const result = await applyModeManager.approveApplication(applicationId, userId, reason);
            results.push({
              applicationId,
              status: 'approved',
              success: true
            });
          } catch (error) {
            results.push({
              applicationId,
              status: 'failed',
              success: false,
              error: error.message
            });
          }
        }
        break;

      case 'reject':
        if (!reason) {
          throw new ValidationError('Reason is required for rejection');
        }
        for (const applicationId of applicationIds) {
          try {
            const result = await applyModeManager.rejectApplication(applicationId, userId, reason);
            results.push({
              applicationId,
              status: 'rejected',
              success: true
            });
          } catch (error) {
            results.push({
              applicationId,
              status: 'failed',
              success: false,
              error: error.message
            });
          }
        }
        break;

      case 'snooze':
        const snoozeHours = hours || 24;
        for (const applicationId of applicationIds) {
          try {
            await applyModeManager.snoozeApplication(applicationId, snoozeHours);
            results.push({
              applicationId,
              status: 'snoozed',
              success: true,
              hours: snoozeHours
            });
          } catch (error) {
            results.push({
              applicationId,
              status: 'failed',
              success: false,
              error: error.message
            });
          }
        }
        break;

      default:
        throw new ValidationError(`Invalid action: ${action}`);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return successResponse({
      results,
      summary: {
        total: applicationIds.length,
        success: successCount,
        failures: failureCount
      }
    }, {
      message: `Bulk ${action} completed: ${successCount} successful, ${failureCount} failed`
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Bulk action failed: ${error.message}`);
  }
});
