import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../services/dbService';
import { encryptSession, decryptSession } from '../../../../lib/sessions/sessionManager';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const platform = params.platform;

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, message: 'No session found' });
    }

    return NextResponse.json({ 
      success: true, 
      session: data 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const { userId, cookies } = await request.json();
    const platform = params.platform;

    const { error } = await supabase
      .from('user_sessions')
      .upsert({
        user_id: userId,
        platform,
        cookies,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Session saved' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}