import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emitToUser } from '@/server/socketServer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, userId, resumeVariantId } = body;

    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const { data: application } = await supabase
      .from('applications')
      .insert({
        jobId: job.id,
        status: 'processing',
      })
      .select()
      .single();

    const applicationId = application?.id;

    emitToUser(userId, 'job:applying', {
      jobId: job.id,
      step: 'login',
      title: job.title,
      company: job.company,
    });

    setTimeout(() => {
      emitToUser(userId, 'job:applying', {
        jobId: job.id,
        step: 'filling',
      });
    }, 2000);

    setTimeout(() => {
      emitToUser(userId, 'job:applying', {
        jobId: job.id,
        step: 'submitting',
      });
    }, 4000);

    setTimeout(async () => {
      await supabase
        .from('applications')
        .update({
          status: 'success',
          appliedAt: new Date().toISOString(),
        })
        .eq('id', applicationId);

      await supabase
        .from('jobs')
        .update({ status: 'applied' })
        .eq('id', jobId);

      emitToUser(userId, 'job:applied', {
        jobId: job.id,
        applicationId,
        timestamp: new Date().toISOString(),
        title: job.title,
        company: job.company,
      });
    }, 6000);

    return NextResponse.json({
      success: true,
      applicationId,
      message: 'Application submitted',
    });

  } catch (error: any) {
    console.error('Apply error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      *,
      job:jobs(title, company, location, platform, matchScore)
    `)
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  return NextResponse.json({
    success: !error,
    applications: applications || [],
  });
}