import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../services/supabaseService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: config, error } = await supabase
      .from('auto_apply_config')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const defaultConfig = {
      enabled: false,
      minMatchScore: 70,
      maxPerDay: 50,
      pauseOnWeekends: true,
      timeStart: '09:00',
      timeEnd: '18:00',
      whitelistCompanies: [],
      blacklistCompanies: [],
      whitelistKeywords: [],
      blacklistKeywords: [],
      enabledPlatforms: ['linkedin', 'indeed', 'naukri'],
      resumeId: null,
    };

    return NextResponse.json({
      success: true,
      config: config || defaultConfig,
    });

  } catch (error: any) {
    console.error('Config fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      enabled,
      minMatchScore,
      maxPerDay,
      pauseOnWeekends,
      timeStart,
      timeEnd,
      whitelistCompanies,
      blacklistCompanies,
      whitelistKeywords,
      blacklistKeywords,
      enabledPlatforms,
      resumeId,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const configData = {
      userId,
      enabled: enabled ?? false,
      minMatchScore: minMatchScore ?? 70,
      maxPerDay: maxPerDay ?? 50,
      pauseOnWeekends: pauseOnWeekends ?? true,
      timeStart: timeStart ?? '09:00',
      timeEnd: timeEnd ?? '18:00',
      whitelistCompanies: whitelistCompanies || [],
      blacklistCompanies: blacklistCompanies || [],
      whitelistKeywords: whitelistKeywords || [],
      blacklistKeywords: blacklistKeywords || [],
      enabledPlatforms: enabledPlatforms || ['linkedin'],
      resumeId,
    };

    const { data: existing } = await supabase
      .from('auto_apply_config')
      .select('id')
      .eq('userId', userId)
      .single();

    let config;
    if (existing) {
      const { data, error } = await supabase
        .from('auto_apply_config')
        .update(configData)
        .eq('userId', userId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      config = data;
    } else {
      const { data, error } = await supabase
        .from('auto_apply_config')
        .insert(configData)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      config = data;
    }

    return NextResponse.json({
      success: true,
      config,
    });

  } catch (error: any) {
    console.error('Config save error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
