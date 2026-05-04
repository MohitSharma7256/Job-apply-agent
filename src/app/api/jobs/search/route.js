import { withCorrelationId, successResponse } from '@/shared/errors';
import { withAuth } from '@/shared/auth';
import { validateRequest, JobSearchSchema } from '@/shared/schemas';
import { addJob, getJobInfo, QUEUES } from '@/shared/queue';
import { v4 as uuidv4 } from 'uuid';

export const POST = withCorrelationId(withAuth(async (request) => {
  // Validate request data
  const { keywords, locations, platforms, maxResults, profile } = await validateRequest(JobSearchSchema)(request);
  
  // Generate idempotency key
  const idempotencyKey = uuidv4();
  
  // Prepare job data
  const jobData = {
    type: 'job_search',
    userId: request.user.id,
    keywords,
    locations,
    platforms,
    maxResults,
    profile,
    idempotencyKey,
    queue: QUEUES.JOB_SEARCH,
    startTime: Date.now()
  };

  // Add job to queue
  const jobResult = await addJob(QUEUES.JOB_SEARCH, jobData);

  return successResponse({
    jobId: jobResult.jobId,
    queue: jobResult.queue,
    status: jobResult.status,
    estimatedDuration: '30-60 seconds',
    checkUrl: `/api/jobs/${jobResult.jobId}/status`
  }, {
    message: 'Job search queued successfully',
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
