import { NextResponse } from 'next/server';
import { dbService } from '@/services/dbService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '00000000-0000-0000-0000-000000000000';

    const { data: applications, error } = await dbService.getApplications(userId);
    
    if (error) throw error;

    // Calculate stats
    const total = applications?.length || 0;
    const appliedToday = applications?.filter(app => {
      const today = new Date().toISOString().split('T')[0];
      return app.created_at.startsWith(today);
    }).length || 0;

    const interviewCount = applications?.filter(app => app.status === 'interview').length || 0;
    
    const platformStats = (applications || []).reduce((acc, app) => {
      acc[app.platform] = (acc[app.platform] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      summary: {
        total,
        today: appliedToday,
        interviews: interviewCount,
        platforms: platformStats
      }
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ 
      success: true, 
      summary: { total: 0, today: 0, interviews: 0, platforms: {} } 
    });
  }
}
