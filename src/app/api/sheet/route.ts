import { NextRequest, NextResponse } from 'next/server';
import { sheetService } from '@/services/sheetService';
import { ApplicationRecord } from '@/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'all';

    let applications = await sheetService.getAllApplications();

    switch (filter) {
      case 'today':
        applications = await sheetService.getTodayApplications();
        break;
      case 'week':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        applications = applications.filter(app => new Date(app.appliedAt) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        applications = applications.filter(app => new Date(app.appliedAt) >= monthAgo);
        break;
    }

    return NextResponse.json({
      success: true,
      count: applications.length,
      applications,
    });

  } catch (error: any) {
    console.error('Sheet read error:', error);
    return NextResponse.json(
      { error: 'Failed to read applications', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const application = body as ApplicationRecord;

    await sheetService.addApplication(application);

    return NextResponse.json({
      success: true,
      message: 'Application added to sheet',
    });

  } catch (error: any) {
    console.error('Sheet write error:', error);
    return NextResponse.json(
      { error: 'Failed to add application', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    await sheetService.updateApplicationStatus(id, status, notes);

    return NextResponse.json({
      success: true,
      message: 'Application status updated',
    });

  } catch (error: any) {
    console.error('Sheet update error:', error);
    return NextResponse.json(
      { error: 'Failed to update application', message: error.message },
      { status: 500 }
    );
  }
}
