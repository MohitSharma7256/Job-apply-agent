const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

class DbService {
  async getProfile(userId) {
    return await supabase.from('profiles').select('*').eq('id', userId).single();
  }

  async getJobs(limit = 100) {
    return await supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(limit);
  }

  async saveJob(job) {
    return await supabase.from('jobs').upsert(job);
  }

  async getApplications(userId) {
    return await supabase.from('applications').select('*, job:jobs(*)').eq('userId', userId);
  }
}

module.exports = { 
  supabase,
  dbService: new DbService() 
};
