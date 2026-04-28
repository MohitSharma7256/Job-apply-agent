import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing environment variables. Some features may not work.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export class DbService {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  }

  async getJobs(limit: number = 100) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) console.error('Error fetching jobs:', error);
    return data;
  }

  async getApplications(userId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*, job:jobs(*)')
      .eq('userId', userId)
      .order('appliedAt', { ascending: false });

    if (error) console.error('Error fetching applications:', error);
    return data;
  }

  async saveJob(job: any) {
    return await supabase.from('jobs').upsert(job);
  }
}

export const dbService = new DbService();
