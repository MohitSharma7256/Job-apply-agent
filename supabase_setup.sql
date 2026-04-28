-- 1. Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id text PRIMARY KEY,
    platform text NOT NULL,
    user_id text NOT NULL,
    encrypted_data text NOT NULL,
    expires_at timestamp with time zone,
    is_valid boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id text PRIMARY KEY,
    title text NOT NULL,
    company text NOT NULL,
    location text,
    salary text,
    description text,
    platform text,
    url text,
    posted_date text,
    match_score numeric,
    skills jsonb,
    ai_analysis jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id text PRIMARY KEY,
    job_id text,
    job_title text,
    company text,
    location text,
    platform text,
    applied_at timestamp with time zone,
    status text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    email text PRIMARY KEY,
    name text,
    phone text,
    location text,
    skills jsonb,
    experience numeric,
    education text,
    target_roles jsonb,
    resume_text text,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Disable RLS on all tables so your local agent can insert data without admin keys
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
