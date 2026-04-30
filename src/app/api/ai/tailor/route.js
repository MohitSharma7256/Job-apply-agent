const { aiService } = require('../../../../services/aiService');

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { job, profile } = await request.json();

    if (!job || !profile) {
      return Response.json({ error: 'Job and Profile required' }, { status: 400 });
    }

    const tailoredContent = await aiService.tailorResume(profile.resumeText, job.description);
    const coverLetter = await aiService.generateCoverLetter(profile.resumeText, job.description);

    return Response.json({
      success: true,
      tailoredContent,
      coverLetter,
    });
  } catch (error) {
    console.error('AI Tailoring error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
