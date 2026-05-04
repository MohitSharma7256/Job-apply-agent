import { aiService } from '../../src/services/aiService.js';

export async function processResumeTailor(jobData) {
  const { userId, job, profile, idempotencyKey, customInstructions } = jobData;
  
  try {
    // Check idempotency
    if (idempotencyKey) {
      // In a real implementation, you'd check against previous AI activities
      console.log(`🔄 Processing resume tailor with idempotency key: ${idempotencyKey}`);
    }

    // Validate input
    if (!job?.description || !profile?.resumeText) {
      throw new Error('Job description and resume text are required');
    }

    console.log(`🔄 Tailoring resume for ${job.title} at ${job.company}`);

    // Process resume tailoring and cover letter generation in parallel
    const [tailoredContent, coverLetter] = await Promise.all([
      aiService.tailorResume(profile.resumeText, job.description, customInstructions),
      aiService.generateCoverLetter(profile.resumeText, job.description, customInstructions)
    ]);

    // Calculate AI metrics (mock implementation)
    const processingMetrics = {
      tokensUsed: Math.floor(Math.random() * 2000) + 1000, // Mock token usage
      costCents: (Math.floor(Math.random() * 50) + 10) / 100, // Mock cost calculation
      processingTimeMs: Date.now() - jobData.startTime || 5000
    };

    const result = {
      tailoredContent,
      coverLetter,
      job: {
        title: job.title,
        company: job.company,
        description: job.description.substring(0, 200) + '...', // Truncated for storage
        skills: job.skills || []
      },
      profile: {
        name: profile.name,
        email: profile.email,
        skills: profile.skills || []
      },
      processing: {
        processedAt: new Date().toISOString(),
        customInstructions: customInstructions || null,
        ...processingMetrics
      }
    };

    console.log(`✅ Resume tailoring completed for ${job.title} at ${job.company}`);
    return result;
  } catch (error) {
    console.error('Resume tailoring processing failed:', error);
    throw new Error(`Resume tailoring failed: ${error.message}`);
  }
}
