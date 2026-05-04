import { withRequestContext } from '@/shared/context.js';
import { validateRequest } from '@/shared/schemas.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { applyModeManager } from '@/orchestration/safety/apply-modes.js';

export const POST = withRequestContext(async (request) => {
  try {
    const body = await request.json();
    const { applicationId, action, reason } = body;

    if (!applicationId || !action) {
      throw new ValidationError('applicationId and action are required');
    }

    const userId = request.user?.id;
    if (!userId) {
      throw new ValidationError('User authentication required');
    }

    let result;

    switch (action) {
      case 'approve':
        if (!reason) {
          throw new ValidationError('Reason is required for approval');
        }
        result = await applyModeManager.approveApplication(applicationId, userId, reason);
        break;

      case 'reject':
        if (!reason) {
          throw new ValidationError('Reason is required for rejection');
        }
        result = await applyModeManager.rejectApplication(applicationId, userId, reason);
        break;

      case 'cancel':
        if (!reason) {
          throw new ValidationError('Reason is required for cancellation');
        }
        result = await applyModeManager.cancelApplication(applicationId, userId, reason);
        break;

      default:
        throw new ValidationError(`Invalid action: ${action}`);
    }

    return successResponse({
      applicationId: result.applicationId,
      status: result.status,
      action,
      reason,
      timestamp: result.submittedAt || result.rejectedAt || result.cancelledAt
    }, {
      message: `Application ${action} successful`
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Application decision failed: ${error.message}`);
  }
});

export const GET = withRequestContext(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const userId = request.user?.id;

    if (!applicationId) {
      throw new ValidationError('applicationId parameter is required');
    }

    if (!userId) {
      throw new ValidationError('User authentication required');
    }

    const status = await applyModeManager.getApplicationStatus(applicationId, userId);

    return successResponse({
      applicationId: status.applicationId,
      status: status.status,
      mode: status.mode,
      qualityScores: status.qualityScores,
      createdAt: status.createdAt,
      submittedAt: status.submittedAt,
      approvedAt: status.approvedAt,
      rejectedAt: status.rejectedAt,
      cancelledAt: status.cancelledAt,
      cancelDeadline: status.cancelDeadline
    }, {
      message: 'Application status retrieved successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to get application status: ${error.message}`);
  }
});
