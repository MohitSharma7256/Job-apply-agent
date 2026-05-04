-- Migration 002: Enable Row Level Security and Create Policies
-- Enables RLS on all user-scoped tables and creates proper access policies

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_activities ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can insert their own profile (registration)
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Jobs Policies
-- Users can view their own jobs
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own jobs
CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own jobs
CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own jobs
CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Applications Policies
-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON public.applications
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own applications
CREATE POLICY "Users can insert own applications" ON public.applications
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own applications
CREATE POLICY "Users can update own applications" ON public.applications
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own applications
CREATE POLICY "Users can delete own applications" ON public.applications
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Sessions Policies
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON public.sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON public.sessions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON public.sessions
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Job Searches Policies
-- Users can view their own search history
CREATE POLICY "Users can view own job searches" ON public.job_searches
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own job searches
CREATE POLICY "Users can insert own job searches" ON public.job_searches
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can delete their own job searches
CREATE POLICY "Users can delete own job searches" ON public.job_searches
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- AI Activities Policies
-- Users can view their own AI activities
CREATE POLICY "Users can view own AI activities" ON public.ai_activities
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own AI activities
CREATE POLICY "Users can insert own AI activities" ON public.ai_activities
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can delete their own AI activities
CREATE POLICY "Users can delete own AI activities" ON public.ai_activities
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Service Role Policies (for backend processes)
-- Allow service role to bypass RLS for specific operations
CREATE POLICY "Service role full access" ON public.user_profiles
    FOR ALL USING (current_setting('app.current_user_id', true) IS NOT NULL);

CREATE POLICY "Service role full access" ON public.jobs
    FOR ALL USING (current_setting('app.current_user_id', true) IS NOT NULL);

CREATE POLICY "Service role full access" ON public.applications
    FOR ALL USING (current_setting('app.current_user_id', true) IS NOT NULL);

CREATE POLICY "Service role full access" ON public.sessions
    FOR ALL USING (current_setting('app.current_user_id', true) IS NOT NULL);

CREATE POLICY "Service role full access" ON public.job_searches
    FOR ALL USING (current_setting('app.current_user_id', true) IS NOT NULL);

CREATE POLICY "Service role full access" ON public.ai_activities
    FOR ALL USING (current_setting('app.current_user_id', true) IS NOT NULL);

-- Create function to set user context for service operations
CREATE OR REPLACE FUNCTION set_service_user_context(user_id TEXT)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clear user context
CREATE OR REPLACE FUNCTION clear_service_user_context()
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
