"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
exports.POST = POST;
exports.PUT = PUT;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const dbService_1 = require("../../../../services/dbService");
exports.runtime = 'nodejs';
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        if (!userId) {
            return server_1.NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        const { data: resumes, error } = await dbService_1.supabase
            .from('resume_variants')
            .select('*')
            .eq('userId', userId)
            .order('isDefault', { ascending: false })
            .order('createdAt', { ascending: false });
        if (error) {
            return server_1.NextResponse.json({ error: error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({
            success: true,
            resumes: resumes || [],
        });
    }
    catch (error) {
        console.error('Resume list error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const formData = await request.formData();
        const userId = formData.get('userId');
        const file = formData.get('file');
        const name = formData.get('name');
        const tags = formData.get('tags');
        const isDefault = formData.get('isDefault') === 'true';
        if (!userId || !file) {
            return server_1.NextResponse.json({ error: 'User ID and file required' }, { status: 400 });
        }
        const allowedTypes = ['application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            return server_1.NextResponse.json({ error: 'Only PDF files allowed' }, { status: 400 });
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return server_1.NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${userId}/${Date.now()}-${file.name}`;
        const filePath = `resumes/${fileName}`;
        const { error: uploadError } = await dbService_1.supabase.storage
            .from('resumes')
            .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
        });
        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return server_1.NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
        }
        const { data: urlData } = dbService_1.supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);
        if (isDefault) {
            await dbService_1.supabase
                .from('resume_variants')
                .update({ isDefault: false })
                .eq('userId', userId);
        }
        const { data: resume, error: dbError } = await dbService_1.supabase
            .from('resume_variants')
            .insert({
            userId,
            name: name || file.name.replace('.pdf', ''),
            fileUrl: urlData.publicUrl,
            filePath,
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            isDefault: isDefault || false,
            fileSize: file.size,
        })
            .select()
            .single();
        if (dbError) {
            console.error('DB insert error:', dbError);
            await dbService_1.supabase.storage.from('resumes').remove([filePath]);
            return server_1.NextResponse.json({ error: dbError.message }, { status: 500 });
        }
        return server_1.NextResponse.json({
            success: true,
            resume,
        });
    }
    catch (error) {
        console.error('Resume upload error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
async function PUT(request) {
    try {
        const body = await request.json();
        const { resumeId, userId, name, tags, isDefault } = body;
        if (!resumeId) {
            return server_1.NextResponse.json({ error: 'Resume ID required' }, { status: 400 });
        }
        if (isDefault) {
            await dbService_1.supabase
                .from('resume_variants')
                .update({ isDefault: false })
                .eq('userId', userId);
        }
        const { data: resume, error } = await dbService_1.supabase
            .from('resume_variants')
            .update({
            name,
            tags: tags || [],
            isDefault: isDefault || false,
            updatedAt: new Date().toISOString(),
        })
            .eq('id', resumeId)
            .select()
            .single();
        if (error) {
            return server_1.NextResponse.json({ error: error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ success: true, resume });
    }
    catch (error) {
        console.error('Resume update error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const resumeId = searchParams.get('resumeId');
        const userId = searchParams.get('userId');
        if (!resumeId) {
            return server_1.NextResponse.json({ error: 'Resume ID required' }, { status: 400 });
        }
        const { data: resume } = await dbService_1.supabase
            .from('resume_variants')
            .select('filePath')
            .eq('id', resumeId)
            .single();
        if (resume?.filePath) {
            await dbService_1.supabase.storage.from('resumes').remove([resume.filePath]);
        }
        const { error } = await dbService_1.supabase
            .from('resume_variants')
            .delete()
            .eq('id', resumeId);
        if (error) {
            return server_1.NextResponse.json({ error: error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ success: true, message: 'Resume deleted' });
    }
    catch (error) {
        console.error('Resume delete error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
