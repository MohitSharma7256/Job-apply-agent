import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../services/dbService';
import { aiLetterService } from '../../../../services/aiLetterService';

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

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const coverLetter = await aiLetterService.generateCoverLetter(job, profile);

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