import { z } from 'zod';

// Environment variable schema with validation
const envSchema = z.object({
  // Required Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().min(1, 'Supabase URL is required'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // Required AI service keys
  GOOGLE_AI_API_KEY: z.string().min(1, 'Google AI API key is required'),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  
  // Required security keys
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  
  // Optional but recommended
  ANTHROPIC_API_KEY: z.string().optional(),
  SERPER_API_KEY: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  
  // Application configuration
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  
  // CORS configuration
  CORS_ALLOWLIST: z.string().optional().transform(val => {
    return val ? val.split(',').map(origin => origin.trim()) : [];
  }),
});

// Validate environment variables
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, env };
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error.errors) {
      error.errors.forEach(e => {
        console.error(`  - ${e.path.join('.')}: ${e.message}`);
      });
    } else {
      console.error(error);
    }
    
    console.warn('\nEnvironment variables present:', Object.keys(process.env).filter(k => !k.startsWith('npm_')).join(', '));
    
    // Don't exit during build phase or production to allow deployment to proceed
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production') {
      console.warn('⚠️  Continuing despite missing environment variables. App may fail at runtime.');
      return { success: false, env: process.env };
    }
    
    process.exit(1);
  }
}

// Export validated environment variables
export const env = validateEnv().env;
