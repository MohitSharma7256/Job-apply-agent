import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const dbService = {
  async getApplications(userId = 'default-user') {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('userId', userId)
      .order('appliedAt', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async createApplication(application) {
    const { data, error } = await supabase
      .from('applications')
      .insert([application])
      .select();
    
    if (error) throw error;
    return data[0];
  }
};
