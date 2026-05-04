import { dbService } from '../../src/services/dbService.js';
import { processWebAutomation } from './webAutomationProcessor.js';

export async function processJobApply(jobData) {
  const { userId, jobId, platform, customResume, customCoverLetter, profile, idempotencyKey } = jobData;
  
  try {
    // Check idempotency
    if (idempotencyKey) {
      console.log(`🔄 Processing job application with idempotency key: ${idempotencyKey}`);
    }

    // Validate input
    if (!jobId || !platform || !profile?.email) {
      throw new Error('Job ID, platform, and profile email are required');
    }

    console.log(`🔄 Applying for job ${jobId} on ${platform}`);

    // Get job details
    const { data: job, error: jobError } = await dbService.getJobs(userId, 1, 0);
    if (jobError || !job || job.length === 0) {
      throw new Error('Job not found or access denied');
    }

    const jobDetails = job.find(j => j.id === jobId);
    if (!jobDetails) {
      throw new Error('Job not found in user jobs');
    }

    // Check if already applied
    const { data: existingApplications } = await dbService.getApplications(userId);
    const alreadyApplied = existingApplications?.find(app => app.job_id === jobId);
    
    if (alreadyApplied) {
      throw new Error('Already applied to this job');
    }

    // Prepare application data
    const applicationData = {
      user_id: userId,
      job_id: jobId,
      job_title: jobDetails.title,
      company: jobDetails.company,
      location: jobDetails.location,
      platform: platform,
      resume_used: customResume || profile.resumeText,
      cover_letter_used: customCoverLetter,
      ai_tailored: !!customResume || !!customCoverLetter
    };

    // Process web automation for application submission
    const automationResult = await processWebAutomation({
      type: 'job_application',
      platform,
      jobDetails,
      profile,
      resume: customResume || profile.resumeText,
      coverLetter: customCoverLetter,
      userId
    });

    // Create application record
    const { data: application, error: appError } = await dbService.createApplication({
      ...applicationData,
      status: automationResult.success ? 'applied' : 'failed',
      notes: automationResult.message || automationResult.error
    });

    if (appError) {
      throw new Error(`Failed to create application record: ${appError.message}`);
    }

    // Update job status
    await dbService.updateJob(jobId, userId, { status: 'applied' });

    const result = {
      application: {
        id: application.id,
        jobId: jobId,
        jobTitle: jobDetails.title,
        company: jobDetails.company,
        platform: platform,
        status: automationResult.success ? 'applied' : 'failed',
        appliedAt: application.created_at
      },
      automation: automationResult,
      processing: {
        processedAt: new Date().toISOString(),
        aiTailored: applicationData.ai_tailored
      }
    };

    console.log(`✅ Job application processed for ${jobDetails.title} at ${jobDetails.company}`);
    return result;
  } catch (error) {
    console.error('Job application processing failed:', error);
    throw new Error(`Job application failed: ${error.message}`);
  }
}
