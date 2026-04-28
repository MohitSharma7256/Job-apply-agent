"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const dbService_1 = require("../../../../services/dbService");
exports.runtime = 'nodejs';
async function GET(request, { params }) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const platform = params.platform;
    if (!userId) {
        return server_1.NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    try {
        const { data, error } = await dbService_1.supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('platform', platform)
            .single();
        if (error || !data) {
            return server_1.NextResponse.json({ success: false, message: 'No session found' });
        }
        return server_1.NextResponse.json({
            success: true,
            session: data
        });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
async function POST(request, { params }) {
    try {
        const { userId, cookies } = await request.json();
        const platform = params.platform;
        const { error } = await dbService_1.supabase
            .from('user_sessions')
            .upsert({
            user_id: userId,
            platform,
            cookies,
            updated_at: new Date().toISOString()
        });
        if (error)
            throw error;
        return server_1.NextResponse.json({ success: true, message: 'Session saved' });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
