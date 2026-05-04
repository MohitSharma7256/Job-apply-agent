import { z } from 'zod';
import { logger } from '../../shared/logger.js';
import { contextualEventEmitter } from '../../shared/context.js';

// Platform strategy interface
export class PlatformStrategy {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.capabilities = new Set(config.capabilities || []);
    this.rateLimiter = new Map(); // Simple rate limiting
  }

  async execute(task, context) {
    throw new Error('execute method must be implemented by platform strategy');
  }

  async validate(task) {
    throw new Error('validate method must be implemented by platform strategy');
  }

  async getCapabilities() {
    return Array.from(this.capabilities);
  }

  async checkRateLimit(userId) {
    const key = `${this.name}:${userId}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = this.config.rateLimit?.maxRequestsPerMinute || 10;

    if (!this.rateLimiter.has(key)) {
      this.rateLimiter.set(key, []);
    }

    const requests = this.rateLimiter.get(key);
    
    // Clean old requests outside window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    this.rateLimiter.set(key, validRequests);

    if (validRequests.length >= maxRequests) {
      throw new Error(`Rate limit exceeded for ${this.name}. Max ${maxRequests} requests per minute.`);
    }

    // Add current request
    validRequests.push(now);
  }

  async handleRetry(task, error, attempt) {
    const retryStrategy = this.config.retryStrategy || 'exponential';
    const maxRetries = this.config.maxRetries || 3;

    if (attempt >= maxRetries) {
      throw new Error(`Max retries exceeded for ${this.name}: ${error.message}`);
    }

    let delay;
    switch (retryStrategy) {
      case 'fixed':
        delay = this.config.retryDelay || 5000;
        break;
      case 'exponential':
        delay = Math.min(30000, 1000 * Math.pow(2, attempt));
        break;
      case 'linear':
        delay = (attempt + 1) * (this.config.retryDelay || 2000);
        break;
      default:
        delay = 5000;
    }

    logger.warn(`Retrying task for ${this.name} after ${delay}ms`, {
      platform: this.name,
      taskId: task.id,
      attempt,
      error: error.message
    });

    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// LinkedIn Strategy
export class LinkedInStrategy extends PlatformStrategy {
  constructor() {
    super('linkedin', {
      capabilities: ['job_search', 'job_apply', 'profile_access', 'messaging'],
      rateLimit: {
        maxRequestsPerMinute: 30
      },
      retryStrategy: 'exponential',
      maxRetries: 3,
      retryDelay: 2000
    });
  }

  async validate(task) {
    const requiredFields = {
      'job_search': ['keywords'],
      'job_apply': ['jobId', 'resumeText', 'email'],
      'profile_access': ['profileId']
    };

    const fields = requiredFields[task.type];
    if (!fields) {
      throw new Error(`Unknown task type for LinkedIn: ${task.type}`);
    }

    for (const field of fields) {
      if (!task.input[field]) {
        throw new Error(`Missing required field for LinkedIn ${task.type}: ${field}`);
      }
    }

    return true;
  }

  async execute(task, context) {
    await this.checkRateLimit(context.userId);

    switch (task.type) {
      case 'job_search':
        return await this.searchJobs(task.input, context);
      case 'job_apply':
        return await this.applyToJob(task.input, context);
      case 'profile_access':
        return await this.accessProfile(task.input, context);
      default:
        throw new Error(`Unsupported task type for LinkedIn: ${task.type}`);
    }
  }

  async searchJobs(input, context) {
    logger.info(`Executing LinkedIn job search`, {
      userId: context.userId,
      keywords: input.keywords,
      locations: input.locations
    });

    // LinkedIn-specific job search implementation
    const searchParams = {
      keywords: input.keywords,
      location: input.locations?.[0] || 'United States',
      experience: input.experience || '5',
      jobType: input.jobType || 'FULL_TIME',
      remote: input.remote || false
    };

    // Simulate LinkedIn API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResults = [
      {
        id: 'linkedin_job_1',
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        description: 'Looking for experienced software engineer...',
        requirements: ['React', 'Node.js', '5+ years'],
        salary: '$150k-$200k',
        postedDate: '2 days ago',
        url: 'https://linkedin.com/jobs/view/senior-software-engineer'
      },
      {
        id: 'linkedin_job_2',
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        location: 'Remote',
        description: 'Remote full stack position...',
        requirements: ['JavaScript', 'Python', '3+ years'],
        salary: '$120k-$160k',
        postedDate: '1 week ago',
        url: 'https://linkedin.com/jobs/view/full-stack-developer'
      }
    ];

    contextualEventEmitter.emitByType('platform.job_search_completed', {
      platform: 'linkedin',
      results: mockResults,
      searchParams
    }, context.userId);

    return {
      platform: 'linkedin',
      results: mockResults,
      total: mockResults.length,
      searchParams
    };
  }

  async applyToJob(input, context) {
    logger.info(`Executing LinkedIn job application`, {
      userId: context.userId,
      jobId: input.jobId
    });

    // LinkedIn-specific application process
    const applicationData = {
      jobId: input.jobId,
      resumeText: input.resumeText,
      coverLetter: input.coverLetter,
      email: input.email,
      phone: input.phone,
      linkedInProfile: input.linkedInProfile
    };

    // Simulate LinkedIn application process
    await new Promise(resolve => setTimeout(resolve, 3000));

    const applicationResult = {
      platform: 'linkedin',
      applicationId: `linkedin_app_${Date.now()}`,
      jobId: input.jobId,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      confirmationNumber: `LI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    contextualEventEmitter.emitByType('platform.job_application_completed', {
      platform: 'linkedin',
      applicationResult
    }, context.userId);

    return applicationResult;
  }

  async accessProfile(input, context) {
    logger.info(`Accessing LinkedIn profile`, {
      userId: context.userId,
      profileId: input.profileId
    });

    // LinkedIn profile access implementation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const profileData = {
      platform: 'linkedin',
      profileId: input.profileId,
      name: 'John Doe',
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      experience: [
        {
          title: 'Senior Software Engineer',
          company: 'Tech Corp',
          duration: '2 years',
          description: 'Led development of cloud applications'
        }
      ],
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      education: [
        {
          degree: 'Bachelor of Science',
          school: 'University of California',
          field: 'Computer Science'
        }
      ]
    };

    return profileData;
  }
}

// Naukri Strategy
export class NaukriStrategy extends PlatformStrategy {
  constructor() {
    super('naukri', {
      capabilities: ['job_search', 'job_apply', 'resume_upload'],
      rateLimit: {
        maxRequestsPerMinute: 20
      },
      retryStrategy: 'exponential',
      maxRetries: 3,
      retryDelay: 3000
    });
  }

  async validate(task) {
    const requiredFields = {
      'job_search': ['keywords'],
      'job_apply': ['jobId', 'resumeText'],
      'resume_upload': ['resumeText']
    };

    const fields = requiredFields[task.type];
    if (!fields) {
      throw new Error(`Unknown task type for Naukri: ${task.type}`);
    }

    for (const field of fields) {
      if (!task.input[field]) {
        throw new Error(`Missing required field for Naukri ${task.type}: ${field}`);
      }
    }

    return true;
  }

  async execute(task, context) {
    await this.checkRateLimit(context.userId);

    switch (task.type) {
      case 'job_search':
        return await this.searchJobs(task.input, context);
      case 'job_apply':
        return await this.applyToJob(task.input, context);
      case 'resume_upload':
        return await this.uploadResume(task.input, context);
      default:
        throw new Error(`Unsupported task type for Naukri: ${task.type}`);
    }
  }

  async searchJobs(input, context) {
    logger.info(`Executing Naukri job search`, {
      userId: context.userId,
      keywords: input.keywords
    });

    const searchParams = {
      keywords: input.keywords,
      location: input.location || 'India',
      experience: input.experience || '5',
      salary: input.salary || '10-20',
      industry: input.industry || 'IT-Software'
    };

    await new Promise(resolve => setTimeout(resolve, 2500));

    const mockResults = [
      {
        id: 'naukri_job_1',
        title: 'Senior Java Developer',
        company: 'Infosys',
        location: 'Bangalore, Karnataka',
        description: 'Senior Java developer position...',
        requirements: ['Java', 'Spring', 'Microservices'],
        salary: '₹15-25 LPA',
        postedDate: '3 days ago',
        url: 'https://naukri.com/job-listings/senior-java-developer'
      },
      {
        id: 'naukri_job_2',
        title: 'Full Stack Engineer',
        company: 'TCS',
        location: 'Mumbai, Maharashtra',
        description: 'Full stack engineering role...',
        requirements: ['JavaScript', 'Node.js', 'React'],
        salary: '₹12-18 LPA',
        postedDate: '1 week ago',
        url: 'https://naukri.com/job-listings/full-stack-engineer'
      }
    ];

    contextualEventEmitter.emitByType('platform.job_search_completed', {
      platform: 'naukri',
      results: mockResults,
      searchParams
    }, context.userId);

    return {
      platform: 'naukri',
      results: mockResults,
      total: mockResults.length,
      searchParams
    };
  }

  async applyToJob(input, context) {
    logger.info(`Executing Naukri job application`, {
      userId: context.userId,
      jobId: input.jobId
    });

    const applicationData = {
      jobId: input.jobId,
      resumeText: input.resumeText,
      coverLetter: input.coverLetter,
      email: input.email,
      phone: input.phone,
      currentSalary: input.currentSalary,
      expectedSalary: input.expectedSalary,
      noticePeriod: input.noticePeriod || '30 days'
    };

    await new Promise(resolve => setTimeout(resolve, 4000));

    const applicationResult = {
      platform: 'naukri',
      applicationId: `naukri_app_${Date.now()}`,
      jobId: input.jobId,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      confirmationNumber: `NK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    contextualEventEmitter.emitByType('platform.job_application_completed', {
      platform: 'naukri',
      applicationResult
    }, context.userId);

    return applicationResult;
  }

  async uploadResume(input, context) {
    logger.info(`Uploading resume to Naukri`, {
      userId: context.userId
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const uploadResult = {
      platform: 'naukri',
      resumeId: `naukri_resume_${Date.now()}`,
      status: 'uploaded',
      uploadedAt: new Date().toISOString(),
      fileUrl: `https://naukri.com/resume/view/${Date.now()}`
    };

    return uploadResult;
  }
}

// Indeed Strategy
export class IndeedStrategy extends PlatformStrategy {
  constructor() {
    super('indeed', {
      capabilities: ['job_search', 'job_apply', 'company_reviews'],
      rateLimit: {
        maxRequestsPerMinute: 25
      },
      retryStrategy: 'linear',
      maxRetries: 2,
      retryDelay: 3000
    });
  }

  async validate(task) {
    const requiredFields = {
      'job_search': ['keywords'],
      'job_apply': ['jobId', 'resumeText'],
      'company_reviews': ['companyId']
    };

    const fields = requiredFields[task.type];
    if (!fields) {
      throw new Error(`Unknown task type for Indeed: ${task.type}`);
    }

    for (const field of fields) {
      if (!task.input[field]) {
        throw new Error(`Missing required field for Indeed ${task.type}: ${field}`);
      }
    }

    return true;
  }

  async execute(task, context) {
    await this.checkRateLimit(context.userId);

    switch (task.type) {
      case 'job_search':
        return await this.searchJobs(task.input, context);
      case 'job_apply':
        return await this.applyToJob(task.input, context);
      case 'company_reviews':
        return await this.getCompanyReviews(task.input, context);
      default:
        throw new Error(`Unsupported task type for Indeed: ${task.type}`);
    }
  }

  async searchJobs(input, context) {
    logger.info(`Executing Indeed job search`, {
      userId: context.userId,
      keywords: input.keywords
    });

    const searchParams = {
      keywords: input.keywords,
      location: input.location || 'United States',
      radius: input.radius || '25',
      jobType: input.jobType || 'fulltime',
      salary: input.salary || '60000'
    };

    await new Promise(resolve => setTimeout(resolve, 1800));

    const mockResults = [
      {
        id: 'indeed_job_1',
        title: 'Software Developer',
        company: 'Tech Solutions Inc',
        location: 'New York, NY',
        description: 'Software developer position with growing tech company...',
        requirements: ['Programming', 'Problem solving', 'Team work'],
        salary: '$80k-$120k',
        postedDate: '1 day ago',
        url: 'https://indeed.com/job/software-developer'
      },
      {
        id: 'indeed_job_2',
        title: 'Web Developer',
        company: 'Digital Agency',
        location: 'Remote',
        description: 'Remote web developer role...',
        requirements: ['HTML', 'CSS', 'JavaScript'],
        salary: '$70k-$100k',
        postedDate: '4 days ago',
        url: 'https://indeed.com/job/web-developer'
      }
    ];

    contextualEventEmitter.emitByType('platform.job_search_completed', {
      platform: 'indeed',
      results: mockResults,
      searchParams
    }, context.userId);

    return {
      platform: 'indeed',
      results: mockResults,
      total: mockResults.length,
      searchParams
    };
  }

  async applyToJob(input, context) {
    logger.info(`Executing Indeed job application`, {
      userId: context.userId,
      jobId: input.jobId
    });

    const applicationData = {
      jobId: input.jobId,
      resumeText: input.resumeText,
      coverLetter: input.coverLetter,
      email: input.email,
      phone: input.phone,
      availability: input.availability || 'immediately'
    };

    await new Promise(resolve => setTimeout(resolve, 3500));

    const applicationResult = {
      platform: 'indeed',
      applicationId: `indeed_app_${Date.now()}`,
      jobId: input.jobId,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      confirmationNumber: `ID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    contextualEventEmitter.emitByType('platform.job_application_completed', {
      platform: 'indeed',
      applicationResult
    }, context.userId);

    return applicationResult;
  }

  async getCompanyReviews(input, context) {
    logger.info(`Getting Indeed company reviews`, {
      userId: context.userId,
      companyId: input.companyId
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    const reviews = [
      {
        id: 'review_1',
        rating: 4,
        title: 'Great company culture',
        content: 'Really enjoy working here, good work-life balance',
        author: 'Current Employee',
        date: '2 months ago'
      },
      {
        id: 'review_2',
        rating: 3,
        title: 'Decent place to work',
        content: 'Good opportunities but management could be better',
        author: 'Former Employee',
        date: '6 months ago'
      }
    ];

    return {
      platform: 'indeed',
      companyId: input.companyId,
      reviews,
      averageRating: 3.5,
      totalReviews: reviews.length
    };
  }
}

// Custom ATS Strategy (for custom applicant tracking systems)
export class CustomATSStrategy extends PlatformStrategy {
  constructor(config) {
    super('custom_ats', {
      capabilities: config.capabilities || ['job_search', 'job_apply'],
      baseUrl: config.baseUrl,
      authMethod: config.authMethod || 'api_key',
      rateLimit: {
        maxRequestsPerMinute: config.rateLimit || 15
      },
      retryStrategy: 'exponential',
      maxRetries: 3,
      retryDelay: 4000
    });
    
    this.customConfig = config;
  }

  async validate(task) {
    const requiredFields = {
      'job_search': ['keywords'],
      'job_apply': ['jobId', 'resumeText']
    };

    const fields = requiredFields[task.type];
    if (!fields) {
      throw new Error(`Unknown task type for Custom ATS: ${task.type}`);
    }

    for (const field of fields) {
      if (!task.input[field]) {
        throw new Error(`Missing required field for Custom ATS ${task.type}: ${field}`);
      }
    }

    return true;
  }

  async execute(task, context) {
    await this.checkRateLimit(context.userId);

    switch (task.type) {
      case 'job_search':
        return await this.searchJobs(task.input, context);
      case 'job_apply':
        return await this.applyToJob(task.input, context);
      default:
        throw new Error(`Unsupported task type for Custom ATS: ${task.type}`);
    }
  }

  async searchJobs(input, context) {
    logger.info(`Executing Custom ATS job search`, {
      userId: context.userId,
      baseUrl: this.config.baseUrl,
      keywords: input.keywords
    });

    // Custom ATS implementation would make actual API calls
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResults = [
      {
        id: 'custom_job_1',
        title: 'Senior Developer',
        company: 'Custom Company',
        location: 'Remote',
        description: 'Senior developer role at custom ATS...',
        requirements: ['JavaScript', 'React', 'Node.js'],
        salary: '$100k-$150k',
        postedDate: '5 days ago',
        url: `${this.config.baseUrl}/jobs/view/custom_job_1`
      }
    ];

    contextualEventEmitter.emitByType('platform.job_search_completed', {
      platform: 'custom_ats',
      results: mockResults,
      baseUrl: this.config.baseUrl
    }, context.userId);

    return {
      platform: 'custom_ats',
      results: mockResults,
      total: mockResults.length,
      baseUrl: this.config.baseUrl
    };
  }

  async applyToJob(input, context) {
    logger.info(`Executing Custom ATS job application`, {
      userId: context.userId,
      baseUrl: this.config.baseUrl,
      jobId: input.jobId
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const applicationResult = {
      platform: 'custom_ats',
      applicationId: `custom_app_${Date.now()}`,
      jobId: input.jobId,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      baseUrl: this.config.baseUrl
    };

    contextualEventEmitter.emitByType('platform.job_application_completed', {
      platform: 'custom_ats',
      applicationResult
    }, context.userId);

    return applicationResult;
  }
}

// Platform Strategy Registry
export class PlatformStrategyRegistry {
  constructor() {
    this.strategies = new Map();
    this.loadDefaultStrategies();
  }

  loadDefaultStrategies() {
    this.registerStrategy(new LinkedInStrategy());
    this.registerStrategy(new NaukriStrategy());
    this.registerStrategy(new IndeedStrategy());
  }

  registerStrategy(strategy) {
    this.strategies.set(strategy.name, strategy);
    logger.info(`Platform strategy registered: ${strategy.name}`, {
      capabilities: strategy.config.capabilities
    });
  }

  getStrategy(name) {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Platform strategy not found: ${name}`);
    }
    return strategy;
  }

  getStrategiesByCapability(capability) {
    return Array.from(this.strategies.values())
      .filter(strategy => strategy.capabilities.has(capability));
  }

  getAllStrategies() {
    return Array.from(this.strategies.values());
  }

  registerCustomStrategy(name, config) {
    const customStrategy = new CustomATSStrategy({
      name,
      ...config
    });
    this.registerStrategy(customStrategy);
    return customStrategy;
  }

  async executeTask(platform, task, context) {
    const strategy = this.getStrategy(platform);
    
    // Validate task
    await strategy.validate(task);
    
    // Execute task with retry logic
    let attempt = 0;
    while (true) {
      try {
        const result = await strategy.execute(task, context);
        return result;
      } catch (error) {
        attempt++;
        logger.warn(`Task execution failed for ${platform}`, {
          platform,
          taskId: task.id,
          attempt,
          error: error.message
        });

        if (attempt >= strategy.config.maxRetries) {
          throw error;
        }

        await strategy.handleRetry(task, error, attempt);
      }
    }
  }
}

// Global registry instance
export const platformRegistry = new PlatformStrategyRegistry();
