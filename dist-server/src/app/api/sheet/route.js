"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
exports.POST = POST;
exports.PATCH = PATCH;
const server_1 = require("next/server");
const sheetService_1 = require("../../../services/sheetService");
exports.runtime = 'nodejs';
async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const filter = searchParams.get('filter') || 'all';
        let applications = await sheetService_1.sheetService.getAllApplications();
        switch (filter) {
            case 'today':
                applications = await sheetService_1.sheetService.getTodayApplications();
                break;
            case 'week':
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                applications = applications.filter(app => new Date(app.appliedAt) >= weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                applications = applications.filter(app => new Date(app.appliedAt) >= monthAgo);
                break;
        }
        return server_1.NextResponse.json({
            success: true,
            count: applications.length,
            applications,
        });
    }
    catch (error) {
        console.error('Sheet read error:', error);
        return server_1.NextResponse.json({ error: 'Failed to read applications', message: error.message }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const application = body;
        await sheetService_1.sheetService.addApplication(application);
        return server_1.NextResponse.json({
            success: true,
            message: 'Application added to sheet',
        });
    }
    catch (error) {
        console.error('Sheet write error:', error);
        return server_1.NextResponse.json({ error: 'Failed to add application', message: error.message }, { status: 500 });
    }
}
async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, status, notes } = body;
        await sheetService_1.sheetService.updateApplicationStatus(id, status, notes);
        return server_1.NextResponse.json({
            success: true,
            message: 'Application status updated',
        });
    }
    catch (error) {
        console.error('Sheet update error:', error);
        return server_1.NextResponse.json({ error: 'Failed to update application', message: error.message }, { status: 500 });
    }
}
