import { NextResponse } from 'next/server';
import { dbService } from '@/services/dbService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    const limit = parseInt(searchParams.get('limit')) || 20;

    const { data: jobs, error } = await dbService.getJobs(userId, limit);
    
    if (error) throw error;

    return NextResponse.json({
      success: true,
      jobs: jobs || []
    });

  } catch (error) {
    console.error('Jobs List API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load jobs'
    }, { status: 500 });
  }
}
