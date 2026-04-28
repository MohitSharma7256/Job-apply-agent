import { NextRequest, NextResponse } from 'next/server';
import { sheetService } from '../../../services/sheetService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const stats = await sheetService.getDailyStats();
    const applications = await sheetService.getAllApplications();
    
    const now = new Date();
    const today = now.toDateString();
    
    const todayApplications = applications.filter(
      a => new Date(a.appliedAt).toDateString() === today
    );
    
    const byPlatform = applications.reduce((acc, app) => {
      acc[app.platform] = (acc[app.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentApplications = applications
      .slice(-10)
      .reverse();

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        total: applications.length,
        byPlatform,
      },
      recentApplications,
    });

  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats', message: error.message },
      { status: 500 }
    );
  }
}
