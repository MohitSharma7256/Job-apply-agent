import { withCorrelationId, successResponse, withAuth } from '@/shared/errors';
import { validateRequest, AiTailorSchema } from '@/shared/schemas';
import { addJob, getJobInfo, QUEUES } from '@/shared/queue';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export const POST = withCorrelationId(withAuth(async (request) => {
  // Validate request data
  const { job, profile, customInstructions } = await validateRequest(AiTailorSchema)(request);
  
  // Generate idempotency key
  const idempotencyKey = uuidv4();
  
  // Prepare job data
  const jobData = {
    type: 'resume_tailor',
    userId: request.user.id,
    job,
    profile,
    customInstructions,
    idempotencyKey,
    queue: QUEUES.RESUME_TAILOR,
    startTime: Date.now()
  };

  // Add job to queue
  const jobResult = await addJob(QUEUES.RESUME_TAILOR, jobData);

  return successResponse({
    jobId: jobResult.jobId,
    queue: jobResult.queue,
    status: jobResult.status,
    estimatedDuration: '45-90 seconds',
    checkUrl: `/api/jobs/${jobResult.jobId}/status`
  }, {
    message: 'Resume tailoring queued successfully',
    idempotencyKey
  });
}));

// GET endpoint to check job status
export const GET = withCorrelationId(withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
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
