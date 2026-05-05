import { NextResponse } from 'next/server';
import { dbService } from '@/services/dbService';
import { withAuth } from '@/shared/auth';
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request) => {
  try {
    const userId = request.user?.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;

    const { data: jobs, error } = await dbService.getJobs(userId, limit);
    if (error) console.error('Jobs List Load Warning:', error);

    return NextResponse.json({
      success: true,
      jobs: jobs || []
    });

  } catch (error) {
    console.error('Jobs List API Exception:', error);
    return NextResponse.json({
      success: true,
      jobs: []
    });
  }
});
