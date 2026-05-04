-- Migration 001: Normalize Database Schema
-- Standardizes table names to snake_case and fixes column inconsistencies
-- Adds proper user_id foreign keys and enables RLS

-- Create normalized user_profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    location TEXT,
    skills JSONB DEFAULT '[]',
    experience_years NUMERIC DEFAULT 0,
    education TEXT,
    target_roles JSONB DEFAULT '[]',
    resume_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create normalized jobs table with proper user relationship
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    salary TEXT,
    description TEXT,
    platform TEXT,
    url TEXT,
    posted_date TIMESTAMP WITH TIME ZONE,
    match_score NUMERIC DEFAULT 0,
    skills JSONB DEFAULT '[]',
    ai_analysis JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create normalized applications table with proper relationships
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    job_title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    platform TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'applied',
    notes TEXT,
    resume_used TEXT,
    cover_letter_used TEXT,
    ai_tailored BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create normalized sessions table with proper user relationship
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    encrypted_data TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job_searches table for tracking search history
CREATE TABLE IF NOT EXISTS public.job_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    keywords TEXT[] NOT NULL,
    locations TEXT[] DEFAULT '{}',
    platforms TEXT[] DEFAULT '{}',
    results_count INTEGER DEFAULT 0,
    search_params JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ai_activities table for tracking AI operations
CREATE TABLE IF NOT EXISTS public.ai_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'tailor_resume', 'generate_cover_letter', 'optimize_profile'
    input_data JSONB NOT NULL,
    output_data JSONB,
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    cost_cents NUMERIC,
    status TEXT DEFAULT 'completed',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Migrate data from old tables if they exist
DO $$
BEGIN
    -- Migrate user_profiles if old table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        INSERT INTO public.user_profiles (email, name, phone, location, skills, experience_years, education, target_roles, resume_text, created_at)
        SELECT email, name, phone, location, skills, experience, education, target_roles, resume_text, created_at
        FROM public.user_profiles
        ON CONFLICT (email) DO NOTHING;
    END IF;

    -- Migrate jobs if old table exists and has user_id column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'user_id') THEN
        INSERT INTO public.jobs (user_id, title, company, location, salary, description, platform, url, posted_date, match_score, skills, ai_analysis, created_at)
        SELECT user_id, title, company, location, salary, description, platform, url, posted_date::timestamp, match_score, skills, ai_analysis, created_at
        FROM public.jobs
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_platform ON public.jobs(platform);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_platform ON public.sessions(platform);
CREATE INDEX IF NOT EXISTS idx_job_searches_user_id ON public.job_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_activities_user_id ON public.ai_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_activities_type ON public.ai_activities(activity_type);
