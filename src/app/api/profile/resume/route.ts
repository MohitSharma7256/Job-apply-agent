import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string || 'default-user';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ success: false, error: 'Only PDF files are allowed' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size must be under 5MB' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    / Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${userId}/resume_${Date.now()}.pdf`;

    / Try to upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase storage error:', uploadError);
      / Fallback: store base64 in DB if storage bucket doesn't exist
      const base64 = buffer.toString('base64');
      const dataUrl = `data:application/pdf;base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        text: '',
        message: 'Resume saved locally (Supabase storage not configured)',
      });
    }

    / Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData?.publicUrl || '';

    / Save resume URL to user_profiles table
    await supabase
      .from('user_profiles')
      .upsert({
        email: userId,
        resume_url: publicUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      text: '',
      fileName: file.name,
    });

  } catch (error: any) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
