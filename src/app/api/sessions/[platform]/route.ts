import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { encryptSession, decryptSession } from '@/lib/sessions/sessionManager';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: session, error } = await supabase
      .from('platform_sessions')
      .select('*')
      .eq('platform', platform)
      .eq('userId', userId)
      .eq('status', 'active')
      .gt('expiresAt', new Date().toISOString())
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (error || !session) {
      return NextResponse.json({
        active: false,
        platform,
        message: 'No active session found',
      });
    }

    try {
      const decrypted = await decryptSession(session.encryptedData);
      return NextResponse.json({
        active: true,
        platform,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        profile: decrypted,
      });
    } catch {
      return NextResponse.json({
        active: false,
        platform,
        message: 'Session corrupted',
      });
    }

  } catch (error: any) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform;
    const body = await request.json();
    const { userId, credentials, profileData, expiresIn = 86400 } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const sessionData = {
      platform,
      userId,
      credentials,
      profile: profileData,
      createdAt: new Date().toISOString(),
    };

    const encrypted = await encryptSession(sessionData);

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await supabase
      .from('platform_sessions')
      .update({ status: 'expired' })
      .eq('platform', platform)
      .eq('userId', userId)
      .eq('status', 'active');

    const { data: session, error } = await supabase
      .from('platform_sessions')
      .insert({
        userId,
        platform,
        encryptedData: encrypted,
        status: 'active',
        expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Session insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      expiresAt,
      platform,
    });

  } catch (error: any) {
    console.error('Session create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('platform_sessions')
      .update({ status: 'revoked' })
      .eq('platform', platform)
      .eq('userId', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Session revoked' });

  } catch (error: any) {
    console.error('Session revoke error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}