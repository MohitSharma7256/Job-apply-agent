"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.POST = POST;
const server_1 = require("next/server");
const dbService_1 = require("../../../../../services/dbService");
const aiLetterService_1 = require("../../../../../services/aiLetterService");
exports.runtime = 'nodejs';
async function POST(request, { params }) {
    try {
        const { profile } = await request.json();
        const jobId = params.id;
        if (!profile) {
            return server_1.NextResponse.json({ error: 'Profile required' }, { status: 400 });
        }
        const { data: job, error: jobError } = await dbService_1.supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();
        if (jobError || !job) {
            return server_1.NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }
        const coverLetter = await aiLetterService_1.aiLetterService.generateCoverLetter(job, profile);
        return server_1.NextResponse.json({
            success: true,
            message: 'Application queued',
            coverLetter
        });
    }
    catch (error) {
        console.error('Apply API error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
