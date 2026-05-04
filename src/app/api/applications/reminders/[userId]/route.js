import { withRequestContext } from '@/shared/context.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { applicationTracker } from '@/services/applicationTracker.js';

export const GET = withRequestContext(async (request, { params }) => {
  try {
    const { userId } = params;
    
    // Get upcoming reminders
    const reminders = await applicationTracker.getUpcomingReminders(userId);

    return successResponse({
      reminders,
      count: reminders.length
    }, {
      message: 'Reminders retrieved successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to get reminders: ${error.message}`);
  }
});
