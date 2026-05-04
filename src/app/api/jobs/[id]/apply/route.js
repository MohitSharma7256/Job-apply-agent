import { withCorrelationId, successResponse, withAuth, ValidationError } from '@/shared/errors';
import { validateRequest, JobApplySchema } from '@/shared/schemas';
import { addJob, getJobInfo, QUEUES } from '@/shared/queue';
import { dbService } from '../../../../../services/dbService.js';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export const POST = withCorrelationId(withAuth(async (request, { params }) => {
  const jobId = params.id;
  
  // Validate request data
  const { customResume, customCoverLetter, profile } = await validateRequest(JobApplySchema)(request);
  
  // Get job details
  const { data: jobs, error: jobError } = await dbService.getJobs(request.user.id, 1, 0);
  if (jobError || !jobs || jobs.length === 0) {
    throw new ValidationError('Job not found or access denied');
  }

  const jobDetails = jobs.find(j => j.id === jobId);
  if (!jobDetails) {
    throw new ValidationError('Job not found in user jobs');
  }

  // Generate idempotency key
  const idempotencyKey = uuidv4();
  
  // Prepare job data
  const jobData = {
    type: 'job_apply',
    userId: request.user.id,
    jobId,
    platform: jobDetails.platform,
    customResume,
    customCoverLetter,
    profile,
    idempotencyKey,
    queue: QUEUES.JOB_APPLY,
    startTime: Date.now()
  };

  // Add job to queue
  const jobResult = await addJob(QUEUES.JOB_APPLY, jobData);

  return successResponse({
    jobId: jobResult.jobId,
    queue: jobResult.queue,
    status: jobResult.status,
    estimatedDuration: '2-5 minutes',
    checkUrl: `/api/jobs/${jobResult.jobId}/status`
  }, {
    message: 'Job application queued successfully',
    jobDetails: {
      title: jobDetails.title,
      company: jobDetails.company,
      platform: jobDetails.platform
    },
    idempotencyKey
  });
}));

// GET endpoint to check job status
export const GET = withCorrelationId(withAuth(async (request, { params }) => {
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
