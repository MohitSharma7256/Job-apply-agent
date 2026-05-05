// Direct environment access to bypass validation strictness in production
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-for-dev-only-change-in-prod',
  SESSION_SECRET: process.env.SESSION_SECRET || 'fallback-secret-for-dev-only-change-in-prod',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Log keys presence for debugging (without showing values)
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Environment Check:', {
    hasUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: env.NODE_ENV
  });
}
