import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../services/dbService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: applications } = await supabase
      .from('applications')
      .select('*')
      .eq('userId', userId)
      .gte('appliedAt', today);

    const todayCount = applications?.length || 0;

    return NextResponse.json({
      success: true,
      summary: {
        today: todayCount,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: true, summary: { today: 0 } });
  }
}
