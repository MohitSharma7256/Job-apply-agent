import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../services/dbService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: resumes, error } = await supabase
      .from('resume_variants')
      .select('*')
      .eq('userId', userId)
      .order('isDefault', { ascending: false })
      .order('createdAt', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resumes: resumes || [],
    });

  } catch (error: any) {
    console.error('Resume list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const tags = formData.get('tags') as string;
    const isDefault = formData.get('isDefault') === 'true';

    if (!userId || !file) {
      return NextResponse.json({ error: 'User ID and file required' }, { status: 400 });
    }

    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF files allowed' }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const filePath = `resumes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);

    if (isDefault) {
      await supabase
        .from('resume_variants')
        .update({ isDefault: false })
        .eq('userId', userId);
    }

    const { data: resume, error: dbError } = await supabase
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
      await supabase.storage.from('resumes').remove([filePath]);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resume,
    });

  } catch (error: any) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeId, userId, name, tags, isDefault } = body;

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });
    }

    if (isDefault) {
      await supabase
        .from('resume_variants')
        .update({ isDefault: false })
        .eq('userId', userId);
    }

    const { data: resume, error } = await supabase
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, resume });

  } catch (error: any) {
    console.error('Resume update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get('resumeId');
    const userId = searchParams.get('userId');

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });
    }

    const { data: resume } = await supabase
      .from('resume_variants')
      .select('filePath')
      .eq('id', resumeId)
      .single();

    if (resume?.filePath) {
      await supabase.storage.from('resumes').remove([resume.filePath]);
    }

    const { error } = await supabase
      .from('resume_variants')
      .delete()
      .eq('id', resumeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Resume deleted' });

  } catch (error: any) {
    console.error('Resume delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
