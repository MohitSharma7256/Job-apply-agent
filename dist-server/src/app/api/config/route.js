"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const dbService_1 = require("../../../services/dbService");
exports.runtime = 'nodejs';
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        if (!userId) {
            return server_1.NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        const { data: config, error } = await dbService_1.supabase
            .from('auto_apply_config')
            .select('*')
            .eq('userId', userId)
            .single();
        if (error && error.code !== 'PGRST116') {
            return server_1.NextResponse.json({ error: error.message }, { status: 500 });
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
        return server_1.NextResponse.json({
            success: true,
            config: config || defaultConfig,
        });
    }
    catch (error) {
        console.error('Config fetch error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const { userId, enabled, minMatchScore, maxPerDay, pauseOnWeekends, timeStart, timeEnd, whitelistCompanies, blacklistCompanies, whitelistKeywords, blacklistKeywords, enabledPlatforms, resumeId, } = body;
        if (!userId) {
            return server_1.NextResponse.json({ error: 'User ID required' }, { status: 400 });
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
        const { data: existing } = await dbService_1.supabase
            .from('auto_apply_config')
            .select('id')
            .eq('userId', userId)
            .single();
        let config;
        if (existing) {
            const { data, error } = await dbService_1.supabase
                .from('auto_apply_config')
                .update(configData)
                .eq('userId', userId)
                .select()
                .single();
            if (error) {
                return server_1.NextResponse.json({ error: error.message }, { status: 500 });
            }
            config = data;
        }
        else {
            const { data, error } = await dbService_1.supabase
                .from('auto_apply_config')
                .insert(configData)
                .select()
                .single();
            if (error) {
                return server_1.NextResponse.json({ error: error.message }, { status: 500 });
            }
            config = data;
        }
        return server_1.NextResponse.json({
            success: true,
            config,
        });
    }
    catch (error) {
        console.error('Config save error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
