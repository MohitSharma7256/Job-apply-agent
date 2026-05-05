import { createClient } from '@supabase/supabase-js';

// Ultimate Resilient Client Getter
// Directly accesses process.env to ensure Render keys are always picked up
export const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false }
  });
};

export const getSupabaseUser = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) return null;
  return createClient(url, key);
};

class DbService {
  async getProfile(userId) {
    try {
      const supabase = getSupabaseUser() || getSupabaseAdmin();
      if (!supabase) return { data: null, error: null };

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') return { data: null, error: null };
      return { data, error };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  async updateProfile(userId, updates) {
    try {
      const supabase = getSupabaseAdmin() || getSupabaseUser();
      if (!supabase) return { data: null, error: null };

      return await supabase
        .from('user_profiles')
        .upsert({ ...updates, id: userId })
        .select()
        .single();
    } catch (e) {
      return { data: null, error: e };
    }
  }

  async getJobs(userId, limit = 50) {
    try {
      const supabase = getSupabaseUser() || getSupabaseAdmin();
      if (!supabase) return { data: [], error: null };

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      return { data: data || [], error };
    } catch (e) {
      return { data: [], error: null };
    }
  }
}

export const dbService = new DbService();
