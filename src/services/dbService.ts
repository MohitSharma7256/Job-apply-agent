export { supabase } from '../../../services/dbService';
import { Job, UserProfile, ApplicationRecord } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export class dbService {
  async saveJobs(jobs: Job[]) {
    if (!supabaseUrl || !supabaseKey) return null; // Skip if not configured
    try {
      const { data, error } = await supabase
        .from('jobs')
        .upsert(
          jobs.map(job => ({
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            salary: job.salary,
            description: job.description,
            platform: job.platform,
            url: job.url,
            posted_date: job.postedDate,
            match_score: job.matchScore,
            skills: job.skills,
            ai_analysis: job.aiAnalysis,
          })),
          { onConflict: 'id' }
        );
      if (error && error.code !== 'PGRST205') {
        console.error('Error saving jobs to Supabase:', error);
      }
      return data;
    } catch (e) {
      // Silently fail - app works without Supabase
      return null;
    }
  }

  async getJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('match_score', { ascending: false });
    
    if (error) console.error('Error fetching jobs from Supabase:', error);
    return data;
  }

  async saveApplication(app: ApplicationRecord) {
    const { data, error } = await supabase
      .from('applications')
      .upsert({
        id: app.id,
        job_id: app.jobId,
        job_title: app.jobTitle,
        company: app.company,
        location: app.location,
        platform: app.platform,
        applied_at: app.appliedAt,
        status: app.status,
        notes: app.notes,
      });

    if (error) console.error('Error saving application to Supabase:', error);
    return data;
  }

  async getApplications() {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
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

export const dbService = new dbService();
