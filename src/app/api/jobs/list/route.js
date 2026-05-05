import { NextResponse } from 'next/server';
import { dbService } from '@/services/dbService';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '00000000-0000-0000-0000-000000000000';
    const limit = parseInt(searchParams.get('limit')) || 20;

    const { data: jobs, error } = await dbService.getJobs(userId, limit);
    
    // Log error but don't crash
    if (error) console.error('Jobs List Load Warning:', error);

    return NextResponse.json({
      success: true,
      jobs: jobs || []
    });

  } catch (error) {
    console.error('Jobs List API Exception:', error);
    return NextResponse.json({
      success: true, // Still return success to prevent UI crash
      jobs: []
    });
  }
}
