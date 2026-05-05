import { NextResponse } from 'next/server';
import { dbService } from '@/services/dbService';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId') || '00000000-0000-0000-0000-000000000000';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Convert file to Buffer for storage
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
      // If bucket doesn't exist, we might need to inform the user
      if (uploadError.message.includes('bucket not found')) {
        console.warn('⚠️ Storage bucket "resumes" not found. Please create it in Supabase.');
      }
      throw uploadError;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = dbService.supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);

    // 3. Save reference in Database (user_profiles or a new resumes table)
    // For now, we'll return success and the URL
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: publicUrl,
      fileName: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });

  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Upload failed'
    }, { status: 500 });
  }
}
