import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/dbService';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const supabase = getSupabaseAdmin();
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration missing. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set on Render.' 
      }, { status: 200 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId') || '00000000-0000-0000-0000-000000000000';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 200 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    let { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    // Auto-create bucket if missing and retry
    if (uploadError && uploadError.message.toLowerCase().includes('bucket not found')) {
      console.log('🔄 Bucket "resumes" missing. Auto-creating public bucket...');
      const { error: createError } = await supabase.storage.createBucket('resumes', { public: true });
      
      if (createError) {
        console.error('❌ Failed to auto-create bucket:', createError);
        return NextResponse.json({ success: false, error: 'Failed to create storage bucket automatically. Please create a PUBLIC bucket named "resumes" in Supabase Storage.' }, { status: 200 });
      }
      
      // Retry upload
      const retry = await supabase.storage
        .from('resumes')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true
        });
        
      uploadData = retry.data;
      uploadError = retry.error;
    }

    if (uploadError) {
      console.error('Production Storage Error:', uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 200 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });

  } catch (error) {
    console.error('Critical Upload Exception:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected server error during upload: ' + error.message
    }, { status: 200 });
  }
}
