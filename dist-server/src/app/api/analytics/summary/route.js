"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const dbService_1 = require("../../../../services/dbService");
exports.runtime = 'nodejs';
async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
        return server_1.NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    const today = new Date().toISOString().split('T')[0];
    try {
        const { data: applications } = await dbService_1.supabase
            .from('applications')
            .select('*')
            .eq('userId', userId)
            .gte('appliedAt', today);
        const todayCount = applications?.length || 0;
        return server_1.NextResponse.json({
            success: true,
            summary: {
                today: todayCount,
            },
        });
    }
    catch (error) {
        return server_1.NextResponse.json({ success: true, summary: { today: 0 } });
    }
}
