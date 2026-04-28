import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../services/supabaseService';
import { coverLetterService } from '../../../../services/coverLetterService';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { profile } = await request.json();
    const jobId = params.id;

    if (!profile) {
      return NextResponse.json({ error: 'Profile required' }, { status: 400 });
    }

    // 1. Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // 2. Generate Cover Letter
    const coverLetter = await coverLetterService.generateCoverLetter(profile, job);

    // 3. Queue the application
    // (Logic for queuing would go here)

    return NextResponse.json({ 
      success: true, 
      message: 'Application queued',
      coverLetter 
    });
  } catch (error: any) {
    console.error('Apply API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}