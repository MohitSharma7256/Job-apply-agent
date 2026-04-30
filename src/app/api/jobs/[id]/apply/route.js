const { supabase } = require('@/services/dbService');
const { automationService } = require('@/services/automationService');

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  try {
    const { profile, autoReferral } = await request.json();
    const jobId = params.id;

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Trigger automation in background (or await for now)
    const result = await automationService.runAutomation(job, profile, autoReferral);

    return Response.json({ 
      success: true, 
      message: 'Application started',
      result 
    });
  } catch (error) {
    console.error('Apply API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
