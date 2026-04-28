"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const sheetService_1 = require("../../../services/sheetService");
exports.runtime = 'nodejs';
async function GET(request) {
    try {
        const stats = await sheetService_1.sheetService.getDailyStats();
        const applications = await sheetService_1.sheetService.getAllApplications();
        const now = new Date();
        const today = now.toDateString();
        const todayApplications = applications.filter(a => new Date(a.appliedAt).toDateString() === today);
        const byPlatform = applications.reduce((acc, app) => {
            acc[app.platform] = (acc[app.platform] || 0) + 1;
            return acc;
        }, {});
        const recentApplications = applications
            .slice(-10)
            .reverse();
        return server_1.NextResponse.json({
            success: true,
            stats: {
                ...stats,
                total: applications.length,
                byPlatform,
            },
            recentApplications,
        });
    }
    catch (error) {
        console.error('Stats error:', error);
        return server_1.NextResponse.json({ error: 'Failed to get stats', message: error.message }, { status: 500 });
    }
}
