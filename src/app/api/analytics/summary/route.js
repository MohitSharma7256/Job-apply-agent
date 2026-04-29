import { NextResponse } from 'next/server';
import { supabase } from '../../../../services/dbService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';

    const today = new Date().toISOString().split('T')[0];
    const { data: applications, error } = await supabase
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
