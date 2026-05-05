import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/apiClient';

export const dynamic = 'force-dynamic';

export const GET = async (request) => {
  try {
    const authorization = request.headers.get('authorization');
    const hasToken = !!authorization;
    
    // Check if token exists and is properly formatted
    const isBearerToken = authorization?.startsWith('Bearer ');
    
    return NextResponse.json({
      success: true,
      authenticated: hasToken && isBearerToken,
      hasToken,
      isBearerToken,
      message: hasToken 
        ? (isBearerToken ? 'Token present, validation will occur on protected endpoints' : 'Token found but not in Bearer format')
        : 'No authentication token found',
      suggestion: !hasToken ? 'Please log in to access protected resources' : null
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check authentication status'
    }, { status: 500 });
  }
};
