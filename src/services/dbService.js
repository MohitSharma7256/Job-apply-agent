import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

class DbService {
  async getProfile(userId) {
    if (!supabase) return { data: null, error: new Error('Database not configured') };
    return await supabase.from('profiles').select('*').eq('id', userId).single();
  }

  async getJobs(limit = 100) {
    if (!supabase) return { data: [], error: new Error('Database not configured') };
    return await supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(limit);
  }

  async saveJob(job) {
    if (!supabase) return { data: null, error: new Error('Database not configured') };
    return await supabase.from('jobs').upsert(job);
  }

  async getApplications(userId) {
    if (!supabase) return { data: [], error: new Error('Database not configured') };
    return await supabase.from('applications').select('*, job:jobs(*)').eq('userId', userId);
  }
}

export const dbService = new DbService();
