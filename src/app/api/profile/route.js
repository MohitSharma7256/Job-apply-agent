import { NextResponse } from 'next/server';
import { dbService } from '@/services/dbService';
import { withAuth } from '@/shared/auth';
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request) => {
  try {
    const userId = request.user?.id;

    const { data: profile, error } = await dbService.getProfile(userId);
    if (error) console.error('Profile Load Warning:', error);

    return NextResponse.json({
      success: true,
      profile: profile || {}
    });

  } catch (error) {
    console.error('Profile API Exception:', error);
    return NextResponse.json({ success: true, profile: {} });
  }
});

export const POST = withAuth(async (request) => {
  try {
    const profileData = await request.json();
    const userId = request.user?.id;
    
    const { data, error } = await dbService.updateProfile(userId, profileData);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
      data
    });

  } catch (error) {
    console.error('Profile Save Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save profile'
    }, { status: 200 });
  }
});
