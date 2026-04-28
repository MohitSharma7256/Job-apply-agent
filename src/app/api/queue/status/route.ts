import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../services/supabaseService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('job_queue')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data: jobs, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const pending = jobs?.filter(j => j.status === 'pending') || [];
    const processing = jobs?.filter(j => j.status === 'processing') || [];
    const completed = jobs?.filter(j => j.status === 'completed') || [];
    const failed = jobs?.filter(j => j.status === 'failed') || [];

    return NextResponse.json({
      success: true,
      jobs: jobs || [],
      stats: {
        total: jobs?.length || 0,
        pending: pending.length,
        processing: processing.length,
        completed: completed.length,
        failed: failed.length,
        successRate: completed.length + failed.length > 0
          ? Math.round((completed.length / (completed.length + failed.length)) * 100)
          : 100,
      },
    });

  } catch (error: any) {
    console.error('Queue status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, userId, priority = 'normal', scheduledAt } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('job_queue')
      .select('id')
      .eq('jobId', jobId)
      .eq('userId', userId)
      .in('status', ['pending', 'processing'])
      .single();

    if (existing) {
      return NextResponse.json({
        error: 'Job already in queue',
        queueId: existing.id,
      }, { status: 409 });
    }

    const { data: queueJob, error } = await supabase
      .from('job_queue')
      .insert({
        jobId,
        userId,
        status: 'pending',
        priority,
        scheduledAt: scheduledAt || new Date().toISOString(),
        attempts: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      queueId: queueJob.id,
      status: 'pending',
    });

  } catch (error: any) {
    console.error('Queue add error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queueId = searchParams.get('queueId');
    const userId = searchParams.get('userId');

    if (!queueId) {
      return NextResponse.json({ error: 'Queue ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('job_queue')
      .update({ status: 'cancelled' })
      .eq('id', queueId)
      .eq('userId', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Job cancelled' });

  } catch (error: any) {
    console.error('Queue delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
