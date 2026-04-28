import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../services/supabaseService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: applications, error } = await supabase
    .from('applications')
    .select('*')
    .eq('userId', userId)
    .gte('appliedAt', today);

  const todayCount = applications?.length || 0;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: weekApps } = await supabase
    .from('applications')
    .select('*')
    .eq('userId', userId)
    .gte('appliedAt', weekAgo.toISOString());

  const weekCount = weekApps?.length || 0;

  const { data: monthApps } = await supabase
    .from('applications')
    .select('*')
    .eq('userId', userId);

  const monthCount = monthApps?.length || 0;

  const { data: jobs } = await supabase
    .from('jobs')
    .select('matchScore')
    .eq('status', 'applied');

  const avgScore = jobs?.length 
    ? Math.round(jobs.reduce((acc, j) => acc + (j.matchScore || 0), 0) / jobs.length)
    : 0;

  const platformStats = monthApps?.reduce((acc: any, app) => {
    acc[app.platform] = (acc[app.platform] || 0) + 1;
    return acc;
  }, {}) || {};

  return NextResponse.json({
    success: true,
    summary: {
      today: todayCount,
      week: weekCount,
      month: monthCount,
      avgMatchScore: avgScore,
      platformStats,
      successRate: monthApps?.filter((a: any) => a.status === 'success').length || 0,
    },
  });
}
