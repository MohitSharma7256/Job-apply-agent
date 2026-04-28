import { NextResponse } from 'next/server';
import { supabase } from '../../../../services/supabaseService';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('applied', false)
      .order('match_score', { ascending: false })
      .limit(50);

    if (error) {
      // If table doesn't exist yet, return empty
      return NextResponse.json({ success: true, jobs: [] });
    }

    return NextResponse.json({
      success: true,
      jobs: (jobs || []).map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        salary: j.salary,
        url: j.url,
        platform: j.platform,
        skills: j.skills || [],
        matchScore: j.match_score,
        applied: j.applied,
        status: j.status,
        postedDate: j.posted_at,
      }))
    });
  } catch (e) {
    return NextResponse.json({ success: true, jobs: [] });
  }
}
