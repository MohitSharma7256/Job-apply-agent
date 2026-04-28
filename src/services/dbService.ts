import { supabase } from '@/lib/supabaseClient';
import { Job, UserProfile, ApplicationRecord } from '@/types';

export class DbService {
  async getJobs(limit: number = 100) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('posted_at', { ascending: false })
      .limit(limit);

    if (error) console.error('Error fetching jobs from Supabase:', error);
    return data;
  }

  async getApplications(userId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    if (error) console.error('Error fetching applications from Supabase:', error);
    return data;
  }

  async getApplicationByJobId(jobId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error && error.code !== 'PGRST116') console.error('Error fetching application by job ID:', error);
    return data;
  }

  async saveProfile(profile: UserProfile) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education,
        target_roles: profile.targetRoles,
        resume_text: profile.resumeText,
      }, { onConflict: 'email' });

    if (error) console.error('Error saving profile to Supabase:', error);
    return data;
  }
}

export const dbService = new DbService();