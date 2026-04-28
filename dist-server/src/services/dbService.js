"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = exports.DbService = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase] Missing environment variables. Some features may not work.');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});
class DbService {
    async getProfile(userId) {
        const { data, error } = await exports.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        return { data, error };
    }
    async getJobs(limit = 100) {
        const { data, error } = await exports.supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error)
            console.error('Error fetching jobs:', error);
        return data;
    }
    async getApplications(userId) {
        const { data, error } = await exports.supabase
            .from('applications')
            .select('*, job:jobs(*)')
            .eq('userId', userId)
            .order('appliedAt', { ascending: false });
        if (error)
            console.error('Error fetching applications:', error);
        return data;
    }
    async saveJob(job) {
        return await exports.supabase.from('jobs').upsert(job);
    }
}
exports.DbService = DbService;
exports.dbService = new DbService();
