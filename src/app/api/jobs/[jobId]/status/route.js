import { withCorrelationId, successResponse, withAuth, ValidationError } from '@/shared/errors';
import { getJobInfo, retryJob, cancelJob } from '@/shared/queue';

export const GET = withCorrelationId(withAuth(async (request, { params }) => {
  const { jobId } = params;
  
  if (!jobId) {
    throw new ValidationError('Job ID is required');
  }

  const jobInfo = await getJobInfo(jobId);
  
  if (!jobInfo) {
    throw new ValidationError('Job not found');
  }

  // Verify user can access this job
  if (jobInfo.input?.userId !== request.user.id) {
    throw new ValidationError('Access denied to this job');
  }

  return successResponse(jobInfo);
}));

export const POST = withCorrelationId(withAuth(async (request, { params }) => {
  const { jobId } = params;
  const { action } = await request.json();
  
  if (!jobId) {
    throw new ValidationError('Job ID is required');
  }

  if (!action || !['retry', 'cancel'].includes(action)) {
    throw new ValidationError('Action must be "retry" or "cancel"');
  }

  const jobInfo = await getJobInfo(jobId);
  
  if (!jobInfo) {
    throw new ValidationError('Job not found');
  }

  // Verify user can access this job
  if (jobInfo.input?.userId !== request.user.id) {
    throw new ValidationError('Access denied to this job');
  }

  let result;
  if (action === 'retry') {
    result = await retryJob(jobId);
  } else if (action === 'cancel') {
    result = await cancelJob(jobId);
  }

  return successResponse({
    jobId,
    action,
    success: true,
    result
  }, {
    message: `Job ${action} completed successfully`
  });
}));
