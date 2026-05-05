import { NextResponse } from 'next/server';
import { dbService } from '@/services/dbService';

export async function POST(request) {
  try {
    if (!dbService.supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase keys are missing in environment variables. Check your Render settings.' 
      }, { status: 200 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId') || '00000000-0000-0000-0000-000000000000';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 200 });
    }

    // Convert file to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Upload to Supabase Storage
    const fileName = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const { data: uploadData, error: uploadError } = await dbService.supabase.storage
      .from('resumes')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Storage Error:', uploadError);
      let errorMsg = uploadError.message;
      if (errorMsg.includes('bucket not found')) {
        errorMsg = 'Storage bucket "resumes" not found in Supabase. Please create it manually.';
      }
      return NextResponse.json({ success: false, error: errorMsg }, { status: 200 });
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = dbService.supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: publicUrl,
      fileName: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });

  } catch (error) {
    console.error('Upload API Exception:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected server error during upload'
    }, { status: 200 });
  }
}
