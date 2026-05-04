import { createClient } from '@supabase/supabase-js';
import { env } from '../shared/env.js';

// Create Supabase client with service role key for admin operations
export const supabase = (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) 
  ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Create Supabase client for user operations (uses RLS)
export const supabaseClient = (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null;

class DbService {
  // User Profile operations
  async getProfile(userId) {
    try {
      if (!supabaseClient) {
        throw new Error('Database client not initialized. Check your environment variables.');
      }
      // Basic UUID validation regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return { data: null, error: null };
      }

      const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  async createProfile(profile) {
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();
    
    return { data, error };
  }

  async updateProfile(userId, updates) {
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
      if (!supabaseClient) {
        throw new Error('Database client not initialized. Check your environment variables.');
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return { data: [], error: null };
      }

      const { data, error } = await supabaseClient
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      return { data: data || [], error };
    } catch (e) {
      return { data: [], error: e };
    }
  }

  async saveJob(job) {
    const { data, error } = await supabaseClient
      .from('jobs')
      .upsert(job)
      .select()
      .single();
    
    return { data, error };
  }

  async deleteJob(jobId, userId) {
    const { data, error } = await supabaseClient
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', userId);
    
    return { data, error };
  }

  // Application operations
  async getApplications(userId, limit = 100, offset = 0) {
    const { data, error } = await supabaseClient
      .from('applications')
      .select(`
        *,
        job:jobs(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    return { data, error };
  }

  async createApplication(application) {
    const { data, error } = await supabaseClient
      .from('applications')
      .insert(application)
      .select()
      .single();
    
    return { data, error };
  }

  async updateApplication(applicationId, userId, updates) {
    const { data, error } = await supabaseClient
      .from('applications')
      .update(updates)
      .eq('id', applicationId)
      .eq('user_id', userId)
      .select()
      .single();
    
    return { data, error };
  }

  // Session operations
  async createSession(session) {
    const { data, error } = await supabaseClient
      .from('sessions')
      .insert(session)
      .select()
      .single();
    
    return { data, error };
  }

  async getValidSession(userId, platform) {
    const { data, error } = await supabaseClient
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('is_valid', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return { data, error };
  }

  async invalidateSession(sessionId, userId) {
    const { data, error } = await supabaseClient
      .from('sessions')
      .update({ is_valid: false })
      .eq('id', sessionId)
      .eq('user_id', userId);
    
    return { data, error };
  }

  // Job Search operations
  async createJobSearch(search) {
    const { data, error } = await supabaseClient
      .from('job_searches')
      .insert(search)
      .select()
      .single();
    
    return { data, error };
  }

  async getJobSearches(userId, limit = 50) {
    const { data, error } = await supabaseClient
      .from('job_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  }

  // AI Activity operations
  async createAIActivity(activity) {
    const { data, error } = await supabaseClient
      .from('ai_activities')
      .insert(activity)
      .select()
      .single();
    
    return { data, error };
  }

  async getAIActivities(userId, activityType, limit = 100) {
    let query = supabaseClient
      .from('ai_activities')
      .select('*')
      .eq('user_id', userId);
    
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  }

  // Admin operations (service role only)
  async setServiceUserContext(userId) {
    const { error } = await supabase.rpc('set_service_user_context', { user_id: userId });
    return { error };
  }

  async clearServiceUserContext() {
    const { error } = await supabase.rpc('clear_service_user_context');
    return { error };
  }
}

export const dbService = new DbService();
