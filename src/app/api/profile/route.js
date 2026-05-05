import { NextResponse } from 'next/server';
import { dbService } from '@/services/dbService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '00000000-0000-0000-0000-000000000000';

    const { data: profile, error } = await dbService.getProfile(userId);
    
    // Log error but don't crash
    if (error) console.error('Profile Load Warning:', error);

    return NextResponse.json({
      success: true,
      profile: profile || {}
    });

  } catch (error) {
    console.error('Profile API Exception:', error);
    return NextResponse.json({
      success: true, // Still return success to prevent UI crash
      profile: {}
    });
  }
}

export async function POST(request) {
  try {
    const profileData = await request.json();
    const userId = profileData.id || '00000000-0000-0000-0000-000000000000'; // Mock UUID fallback
    
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
    }, { status: 500 });
  }
}
