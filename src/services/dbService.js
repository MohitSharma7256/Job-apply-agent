import { createClient } from '@supabase/supabase-js';
import { env } from '../shared/env.js';

// Ultra-resilient client creation
function createSafeClient(url, key, name) {
  try {
    // Priority 1: Use provided key
    // Priority 2: Fallback to process.env directly if env object is empty
    const finalUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const finalKey = key || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!finalUrl || !finalKey) {
      console.error(`❌ CRITICAL: Supabase ${name} configuration missing. URL or Key is undefined.`);
      return null;
    }
    
    return createClient(finalUrl, finalKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (e) {
    console.error(`❌ FAILED to initialize Supabase ${name}:`, e.message);
    return null;
  }
}

// Admin client (Service Role)
export const supabase = createSafeClient(
  env.NEXT_PUBLIC_SUPABASE_URL, 
  env.SUPABASE_SERVICE_ROLE_KEY, 
  'Admin'
);

// User client (Anon Key)
export const supabaseClient = createSafeClient(
  env.NEXT_PUBLIC_SUPABASE_URL, 
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 
  'User'
);

class DbService {
  get supabase() { return supabase; }
  get supabaseClient() { return supabaseClient; }

  // Resilient Profile Fetch
  async getProfile(userId) {
    try {
      const client = this.supabaseClient || this.supabase;
      if (!client) return { data: null, error: new Error('No database client available') };

      const { data, error } = await client
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') return { data: null, error: null };
      if (error && error.code === '42P01') {
        console.warn('⚠️ Table user_profiles missing. Creating on the fly might be needed.');
        return { data: null, error: null };
      }
      return { data, error };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  async updateProfile(userId, updates) {
    try {
      const client = this.supabase || this.supabaseClient;
      if (!client) return { data: null, error: new Error('No database client available') };

      const { data, error } = await client
        .from('user_profiles')
        .upsert({ ...updates, id: userId })
        .select()
        .single();
      
      return { data, error };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  // Resilient Job Fetch
  async getJobs(userId, limit = 50) {
    try {
      const client = this.supabaseClient || this.supabase;
      if (!client) return { data: [], error: null };

      const { data, error } = await client
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error && error.code === '42P01') return { data: [], error: null };
      return { data: data || [], error };
    } catch (e) {
      return { data: [], error: null };
    }
  }

  async saveJob(job) {
    const client = this.supabase || this.supabaseClient;
    if (!client) return { data: null, error: null };
    return await client.from('jobs').upsert(job).select().single();
  }
}

export const dbService = new DbService();
