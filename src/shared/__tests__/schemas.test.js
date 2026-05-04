import { describe, it, expect } from '@jest/globals';
import { 
  JobSearchSchema, 
  AiTailorSchema, 
  JobApplySchema, 
  ProfileSchema,
  ResumeGenerateSchema,
  validateRequest 
} from '../schemas.js';
import { z } from 'zod';

describe('Validation Schemas', () => {
  describe('JobSearchSchema', () => {
    it('should validate valid job search data', () => {
      const validData = {
        keywords: 'React Developer',
        locations: ['Remote', 'Bangalore'],
        platforms: ['linkedin', 'naukri'],
        maxResults: 10,
        profile: {
          skills: ['React', 'Node.js'],
          experience: 5,
          targetRoles: ['Senior Developer']
        }
      };

      const result = JobSearchSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should accept minimal required data', () => {
      const minimalData = {
        keywords: 'React'
      };

      const result = JobSearchSchema.parse(minimalData);
      expect(result).toMatchObject({
        keywords: 'React',
        locations: [],
        platforms: [],
        maxResults: 10,
        profile: {}
      });
    });

    it('should reject invalid keywords', () => {
      const invalidData = {
        keywords: ''
      };

      expect(() => JobSearchSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject invalid maxResults', () => {
      const invalidData = {
        keywords: 'React',
        maxResults: 101
      };

      expect(() => JobSearchSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject invalid platforms', () => {
      const invalidData = {
        keywords: 'React',
        platforms: ['invalid-platform']
      };

      expect(() => JobSearchSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe('AiTailorSchema', () => {
    it('should validate valid AI tailor data', () => {
      const validData = {
        job: {
          title: 'Senior React Developer',
          company: 'Tech Corp',
          description: 'Looking for experienced React developer...',
          skills: ['React', 'TypeScript']
        },
        profile: {
          resumeText: 'Experienced developer with 5 years...',
          skills: ['React', 'Node.js'],
          experience: 5
        },
        customInstructions: 'Focus on leadership experience'
      };

      const result = AiTailorSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject missing job description', () => {
      const invalidData = {
        job: {
          title: 'Senior React Developer',
          company: 'Tech Corp'
        },
        profile: {
          resumeText: 'Experienced developer...'
        }
      };

      expect(() => AiTailorSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject missing profile resume text', () => {
      const invalidData = {
        job: {
          title: 'Senior React Developer',
          company: 'Tech Corp',
          description: 'Looking for experienced React developer...'
        },
        profile: {
          skills: ['React']
        }
      };

      expect(() => AiTailorSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe('JobApplySchema', () => {
    it('should validate valid job application data', () => {
      const validData = {
        jobId: 'job-123',
        platform: 'linkedin',
        customResume: 'Tailored resume content...',
        customCoverLetter: 'Custom cover letter...',
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          resumeText: 'Original resume content...'
        }
      };

      const result = JobApplySchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid job ID', () => {
      const invalidData = {
        jobId: '',
        platform: 'linkedin',
        profile: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      };

      expect(() => JobApplySchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject invalid platform', () => {
      const invalidData = {
        jobId: 'job-123',
        platform: 'invalid-platform',
        profile: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      };

      expect(() => JobApplySchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        jobId: 'job-123',
        platform: 'linkedin',
        profile: {
          name: 'John Doe',
          email: 'invalid-email'
        }
      };

      expect(() => JobApplySchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe('ProfileSchema', () => {
    it('should validate valid profile data', () => {
      const validData = {
        email: 'john@example.com',
        name: 'John Doe',
        phone: '+1234567890',
        location: 'Bangalore',
        skills: ['React', 'Node.js', 'TypeScript'],
        experience: 5,
        education: 'B.Tech Computer Science',
        targetRoles: ['Senior Developer', 'Tech Lead'],
        resumeText: 'Experienced software developer...'
      };

      const result = ProfileSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should accept minimal required data', () => {
      const minimalData = {
        email: 'john@example.com',
        name: 'John Doe'
      };

      const result = ProfileSchema.parse(minimalData);
      expect(result).toMatchObject({
        email: 'john@example.com',
        name: 'John Doe',
        skills: [],
        targetRoles: []
      });
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'John Doe'
      };

      expect(() => ProfileSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject invalid experience range', () => {
      const invalidData = {
        email: 'john@example.com',
        name: 'John Doe',
        experience: 51 // Over 50 years
      };

      expect(() => ProfileSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe('ResumeGenerateSchema', () => {
    it('should validate valid resume generation data', () => {
      const validData = {
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          location: 'Bangalore',
          skills: ['React', 'Node.js'],
          experience: 5,
          education: 'B.Tech',
          resumeText: 'Original resume...'
        },
        jobDescription: 'Looking for experienced React developer...',
        template: 'modern'
      };

      const result = ResumeGenerateSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid template', () => {
      const invalidData = {
        profile: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        jobDescription: 'Job description...',
        template: 'invalid-template'
      };

      expect(() => ResumeGenerateSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });
});

describe('validateRequest Helper', () => {
  it('should validate request with valid data', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        keywords: 'React Developer',
        locations: ['Remote']
      })
    };

    const validator = validateRequest(JobSearchSchema);
    const result = await validator(mockRequest);

    expect(result).toEqual({
      keywords: 'React Developer',
      locations: ['Remote'],
      platforms: [],
      maxResults: 10,
      profile: {}
    });
  });

  it('should throw ValidationError for invalid data', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        keywords: '' // Invalid - empty string
      })
    };

    const validator = validateRequest(JobSearchSchema);

    try {
      await validator(mockRequest);
      fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error.name).toBe('ValidationError');
      expect(error.details).toBeInstanceOf(Array);
      expect(error.details[0]).toMatchObject({
        field: 'keywords',
        message: expect.any(String),
        code: expect.any(String)
      });
    }
  });

  it('should handle JSON parsing errors', async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
    };

    const validator = validateRequest(JobSearchSchema);

    try {
      await validator(mockRequest);
      fail('Should have thrown error');
    } catch (error) {
      expect(error.message).toBe('Invalid JSON');
    }
  });
});

describe('Schema Edge Cases', () => {
  describe('Array Validation', () => {
    it('should handle empty arrays', () => {
      const data = {
        keywords: 'React',
        locations: [],
        platforms: []
      };

      const result = JobSearchSchema.parse(data);
      expect(result.locations).toEqual([]);
      expect(result.platforms).toEqual([]);
    });

    it('should handle arrays with special characters', () => {
      const data = {
        keywords: 'React',
        locations: ['San Francisco, CA', 'New York, NY'],
        platforms: ['linkedin', 'naukri']
      };

      const result = JobSearchSchema.parse(data);
      expect(result.locations).toEqual(['San Francisco, CA', 'New York, NY']);
      expect(result.platforms).toEqual(['linkedin', 'naukri']);
    });
  });

  describe('String Validation', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const data = {
        keywords: 'React',
        profile: {
          resumeText: longString
        }
      };

      const result = JobSearchSchema.parse(data);
      expect(result.profile.resumeText).toBe(longString);
    });

    it('should handle strings with special characters', () => {
      const data = {
        keywords: 'React!@#$%^&*()',
        profile: {
          resumeText: 'Resume with émojis 🚀 and ñiçoñ'
        }
      };

      const result = JobSearchSchema.parse(data);
      expect(result.keywords).toBe('React!@#$%^&*()');
      expect(result.profile.resumeText).toBe('Resume with émojis 🚀 and ñiçoñ');
    });
  });

  describe('Number Validation', () => {
    it('should handle boundary values', () => {
      const data = {
        keywords: 'React',
        maxResults: 1 // Minimum
      };

      const result = JobSearchSchema.parse(data);
      expect(result.maxResults).toBe(1);

      const data2 = {
        keywords: 'React',
        maxResults: 50 // Maximum
      };

      const result2 = JobSearchSchema.parse(data2);
      expect(result2.maxResults).toBe(50);
    });

    it('should handle decimal numbers', () => {
      const data = {
        keywords: 'React',
        maxResults: 10.5
      };

      const result = JobSearchSchema.parse(data);
      expect(result.maxResults).toBe(10);
    });
  });

  describe('Optional Fields', () => {
    it('should handle undefined optional fields', () => {
      const data = {
        keywords: 'React',
        profile: undefined
      };

      const result = JobSearchSchema.parse(data);
      expect(result.profile).toEqual({});
    });

    it('should handle null optional fields', () => {
      const data = {
        keywords: 'React',
        profile: null
      };

      const result = JobSearchSchema.parse(data);
      expect(result.profile).toEqual({});
    });
  });
});
