import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../services/supabaseService';
import { coverLetterService } from '@/services/coverLetterService';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const { data: applications } = await supabase
      .from('applications')
      .select('*')
      .eq('jobId', jobId)
      .order('createdAt', { ascending: false })
      .limit(1);

    return NextResponse.json({
      success: true,
      job,
      lastApplication: applications?.[0] || null,
    });

  } catch (error: any) {
    console.error('Job fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();
    const { userId, resumeVariantId, coverLetter } = body;

    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const existingApp = await supabase
      .from('applications')
      .select('id')
      .eq('jobId', jobId)
      .eq('userId', userId)
      .single();

    if (existingApp) {
      return NextResponse.json({ 
        error: 'Already applied to this job',
        applicationId: existingApp.id,
      }, { status: 409 });
    }

    let generatedCoverLetter = coverLetter;
    if (!generatedCoverLetter && job) {
      try {
        const profile = { name: 'Candidate', skills: [], experience: 3, targetRoles: [], location: '', education: '', resumeText: '' };
        generatedCoverLetter = await coverLetterService.generateCoverLetter(job, profile as any);
      } catch (error) {
        console.error('Cover letter generation failed:', error);
      }
    }

    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({
        jobId: job.id,
        userId: userId,
        status: 'queued',
        resumeVariantId,
        coverLetter: generatedCoverLetter,
        appliedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (appError) {
      console.error('Application insert error:', appError);
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    await supabase
      .from('jobs')
      .update({ 
        status: 'applied',
        appliedCount: (job.appliedCount || 0) + 1,
      })
      .eq('id', jobId);

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      coverLetter: generatedCoverLetter,
      message: 'Application queued for processing',
    });

  } catch (error: any) {
    console.error('Apply error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('jobId', jobId)
      .eq('userId', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Application deleted' });

  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}