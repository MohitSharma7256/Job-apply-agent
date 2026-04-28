"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const sessionManager_1 = require("../../../services/sessionManager");
exports.runtime = 'nodejs';
// GET: Fetch all platform sessions for a user
async function GET(request) {
    const userId = request.headers.get('x-user-id') || 'default-user';
    try {
        const sessions = await sessionManager_1.loginManager.getAllSessions(userId);
        return server_1.NextResponse.json({ success: true, sessions });
    }
    catch (e) {
        return server_1.NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
// DELETE: Remove a specific session
async function DELETE(request) {
    const userId = request.headers.get('x-user-id') || 'default-user';
    const { platform } = await request.json();
    try {
        const ok = await sessionManager_1.loginManager.deleteSession(userId, platform);
        return server_1.NextResponse.json({ success: ok });
    }
    catch (e) {
        return server_1.NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
