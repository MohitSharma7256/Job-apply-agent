import { NextRequest, NextResponse } from 'next/server';
import { loginManager } from '@/services/sessionManager';

export const runtime = 'nodejs';

// GET: Fetch all platform sessions for a user
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'default-user';
  try {
    const sessions = await loginManager.getAllSessions(userId);
    return NextResponse.json({ success: true, sessions });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// DELETE: Remove a specific session
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'default-user';
  const { platform } = await request.json();
  try {
    const ok = await loginManager.deleteSession(userId, platform);
    return NextResponse.json({ success: ok });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
