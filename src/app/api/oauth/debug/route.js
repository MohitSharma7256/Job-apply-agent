import { NextResponse } from 'next/server';
import { env } from '@/shared/env.js';

export const dynamic = 'force-dynamic';

export const GET = async (request) => {
  const debugInfo = {
    supabase: {
      url: env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      serviceKey: env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
    },
    app: {
      url: env.NEXT_PUBLIC_APP_URL ? '✅ Set' : '❌ Missing',
      nodeEnv: env.NODE_ENV || '❌ Missing',
    },
    oauth: {
      redirectUrl: `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
      siteUrl: env.NEXT_PUBLIC_APP_URL || 'Not set',
    },
    environment: process.env.NODE_ENV
  };

  // Test Supabase connection
  let supabaseStatus = 'Unknown';
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Simple connection test
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
    supabaseStatus = error ? '❌ Connection Failed' : '✅ Connected';
  } catch (err) {
    supabaseStatus = `❌ Error: ${err.message}`;
  }

  return NextResponse.json({
    success: true,
    debug: debugInfo,
    supabaseStatus,
    message: 'OAuth Configuration Debug Info'
  });
};
