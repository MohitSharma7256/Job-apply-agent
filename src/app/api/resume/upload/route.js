import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/dbService';
import { withAuth } from '@/shared/auth';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request) => {
  try {
    const supabase = getSupabaseAdmin();
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration missing. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your deployment. Manual bucket creation may also be required if storage is not configured.' 
      }, { status: 200 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const userId = request.user?.id;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 200 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    const uploadToResumes = () => supabase.storage
      .from('resumes')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    let { data: uploadData, error: uploadError } = await uploadToResumes();

    const bucketMissing = uploadError?.message?.toLowerCase().includes('bucket not found')
      || uploadError?.message?.toLowerCase().includes('bucket does not exist')
      || uploadError?.message?.toLowerCase().includes('storage bucket');

    if (bucketMissing) {
      console.log('🔄 Bucket "resumes" missing or unavailable. Ensuring public bucket exists...');
      const { error: createError } = await supabase.storage.createBucket('resumes', { public: true });

      if (createError && !/already exists|exists/i.test(createError.message || '')) {
        console.error('❌ Failed to auto-create bucket:', createError);
        return NextResponse.json({
          success: false,
          error: `Failed to create storage bucket automatically: ${createError.message}`
        }, { status: 200 });
      }

      const retry = await uploadToResumes();
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
}); }
});
