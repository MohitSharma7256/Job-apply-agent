require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('Testing Supabase connection and sessions table...');
  
  const { data, error } = await supabase
    .from('sessions')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Error fetching from sessions table:', error);
  } else {
    console.log('✅ Successfully fetched from sessions table:', data);
  }

  // Test insert
  const { data: insertData, error: insertError } = await supabase
    .from('sessions')
    .upsert({
      id: 'test-user-test-platform',
      platform: 'test-platform',
      user_id: 'test-user',
      encrypted_data: 'dummy-data',
      expires_at: new Date(Date.now() + 100000).toISOString(),
      is_valid: true,
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (insertError) {
    console.error('❌ Error inserting into sessions table:', insertError);
  } else {
    console.log('✅ Successfully inserted into sessions table:', insertData);
    
    // Cleanup
    await supabase.from('sessions').delete().eq('id', 'test-user-test-platform');
  }
}

testSupabase().catch(console.error);
