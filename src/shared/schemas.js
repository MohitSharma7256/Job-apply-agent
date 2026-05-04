import { z } from 'zod';

// Common schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const IdSchema = z.string().uuid().or(z.string().min(1));

// Job search schema
export const JobSearchSchema = z.object({
  keywords: z.string().min(1, 'Keywords are required'),
  locations: z.array(z.string()).optional().default([]),
  platforms: z.array(z.enum(['linkedin', 'naukri', 'indeed', 'glassdoor'])).optional().default([]),
  maxResults: z.coerce.number().int().min(1).max(50).default(10),
  profile: z.object({
    resumeText: z.string().optional(),
    skills: z.array(z.string()).optional().default([]),
    experience: z.number().optional(),
    targetRoles: z.array(z.string()).optional().default([]),
    location: z.string().optional()
  }).optional()
});

// Job apply schema
export const JobApplySchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  platform: z.enum(['linkedin', 'naukri', 'indeed', 'glassdoor']),
  customResume: z.string().optional(),
  customCoverLetter: z.string().optional(),
  profile: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    resumeText: z.string().optional()
  })
});

// AI tailor schema
export const AiTailorSchema = z.object({
  job: z.object({
    title: z.string().min(1, 'Job title is required'),
    company: z.string().min(1, 'Company is required'),
    description: z.string().min(1, 'Job description is required'),
    skills: z.array(z.string()).optional().default([])
  }),
  profile: z.object({
    resumeText: z.string().min(1, 'Resume text is required'),
    skills: z.array(z.string()).optional().default([]),
    experience: z.number().optional()
  })
});

// Profile schema
export const ProfileSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional().default([]),
  experience: z.number().min(0).max(50).optional(),
  education: z.string().optional(),
  targetRoles: z.array(z.string()).optional().default([]),
  resumeText: z.string().optional()
});

// Resume generation schema
export const ResumeGenerateSchema = z.object({
  profile: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    location: z.string().optional(),
    skills: z.array(z.string()).optional().default([]),
    experience: z.number().optional(),
    education: z.string().optional(),
    resumeText: z.string().optional()
  }),
  jobDescription: z.string().min(1, 'Job description is required'),
  template: z.enum(['modern', 'classic', 'creative']).optional().default('modern')
});

// Validation helper function
export function validateRequest(schema) {
  return async (request) => {
    try {
      const body = await request.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        throw new ValidationError('Request validation failed', validationErrors);
      }
      throw error;
    }
  };
}
