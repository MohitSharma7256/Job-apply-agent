import { createClient } from '@supabase/supabase-js';
import { env } from '../shared/env.js';

// Safe client creation helper
function createSafeClient(url, key, name) {
  try {
    if (!url || !key || url === "" || key === "") {
      console.warn(`⚠️ Supabase ${name} keys missing or empty. URL: ${url ? 'present' : 'missing'}`);
      return null;
    }
    return createClient(url, key);
  } catch (e) {
    console.error(`❌ Failed to initialize Supabase ${name}:`, e.message);
    return null;
  }
}

// Create Supabase client with service role key for admin operations
export const supabase = createSafeClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, 'Admin');

// Create Supabase client for user operations (uses RLS)
export const supabaseClient = createSafeClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'User');

class DbService {
  // User Profile operations
  async getProfile(userId) {
    try {
      if (!supabaseClient) {
        console.warn('⚠️ Database client not initialized. Returning empty profile.');
        return { data: null, error: null };
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) return { data: null, error: null };

      const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        if (error.code === '42P01') return { data: null, error: null };
        return { data: null, error };
      }
      return { data, error: null };
    } catch (e) {
      console.error('DbService Error (getProfile):', e);
      return { data: null, error: null };
    }
  }

  async createProfile(profile) {
    if (!supabaseClient) return { data: null, error: null };
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();
    return { data, error };
  }

  async updateProfile(userId, updates) {
    if (!supabaseClient) return { data: null, error: null };
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .upsert({ ...updates, id: userId })
      .select()
      .single();
    return { data, error };
  }

  // Job operations
  async getJobs(userId, limit = 100, offset = 0) {
    try {
      if (!supabaseClient) return { data: [], error: null };
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) return { data: [], error: null };

      const { data, error } = await supabaseClient
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error && error.code === '42P01') return { data: [], error: null };
      return { data: data || [], error };
    } catch (e) {
      console.error('DbService Error (getJobs):', e);
      return { data: [], error: null };
    }
  }

  async saveJob(job) {
    if (!supabaseClient) return { data: null, error: null };
    const { data, error } = await supabaseClient
      .from('jobs')
      .upsert(job)
      .select()
      .single();
    return { data, error };
  }

  async deleteJob(jobId, userId) {
    if (!supabaseClient) return { data: null, error: null };
    const { data, error } = await supabaseClient
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', userId);
    return { data, error };
  }

  // Application operations
  async getApplications(userId, limit = 100, offset = 0) {
    try {
      if (!supabaseClient) return { data: [], error: null };
      const { data, error } = await supabaseClient
        .from('applications')
        .select(`*, job:jobs(*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error && error.code === '42P01') return { data: [], error: null };
      return { data: data || [], error };
    } catch (e) {
      return { data: [], error: null };
    }
  }

  async createApplication(application) {
    if (!supabaseClient) return { data: null, error: null };
    const { data, error } = await supabaseClient
      .from('applications')
      .insert(application)
      .select()
      .single();
    return { data, error };
  }

  // Job Search operations
  async getJobSearches(userId, limit = 50) {
    try {
      if (!supabaseClient) return { data: [], error: null };
      const { data, error } = await supabaseClient
        .from('job_searches')
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

  async createJobSearch(search) {
    if (!supabaseClient) return { data: null, error: null };
    const { data, error } = await supabaseClient
      .from('job_searches')
      .insert(search)
      .select()
      .single();
    return { data, error };
  }

  // AI Activity operations
  async createAIActivity(activity) {
    if (!supabaseClient) return { data: null, error: null };
    const { data, error } = await supabaseClient
      .from('ai_activities')
      .insert(activity)
      .select()
      .single();
    return { data, error };
  }

  async getAIActivities(userId, activityType, limit = 100) {
    try {
      if (!supabaseClient) return { data: [], error: null };
      let query = supabaseClient.from('ai_activities').select('*').eq('user_id', userId);
      if (activityType) query = query.eq('activity_type', activityType);
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error && error.code === '42P01') return { data: [], error: null };
      return { data: data || [], error };
    } catch (e) {
      return { data: [], error: null };
    }
  }

  // Admin operations (service role only)
  async setServiceUserContext(userId) {
    if (!supabase) return { error: new Error('Admin client not initialized') };
    const { error } = await supabase.rpc('set_service_user_context', { user_id: userId });
    return { error };
  }
}

export const dbService = new DbService();
export { supabase as adminClient, supabaseClient as userClient };
