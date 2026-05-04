import { jobScoringService } from '../../src/services/jobScoringService.js';
import { dbService } from '../../src/services/dbService.js';
import { emitJobEvent, EVENT_TYPES } from '../../src/shared/events.js';

export async function processJobSearch(jobData) {
  const { userId, keywords, locations, platforms, maxResults, profile, idempotencyKey } = jobData;
  
  try {
    // Check idempotency
    if (idempotencyKey) {
      const existingResult = await dbService.getAIActivities(userId, 'job_search');
      const duplicate = existingResult?.find(activity => 
        activity.input_data?.idempotencyKey === idempotencyKey && 
        activity.status === 'completed'
      );
      
      if (duplicate) {
        console.log(`🔄 Idempotent request detected for job search: ${idempotencyKey}`);
        return duplicate.output_data;
      } else {
        console.log(`🔄 Processing job search with idempotency key: ${idempotencyKey}`);
      }
    }

    // Emit job started event
    emitJobEvent(EVENT_TYPES.JOB_STARTED, {
      type: 'job_search',
      keywords,
      locations,
      platforms,
      maxResults
    }, jobData.jobRecordId, userId);

    // Generate mock search results (replace with real scraping in production)
    const mockJobs = await generateMockJobs(keywords, locations, platforms, maxResults);
    
    // Emit progress event
    emitJobEvent(EVENT_TYPES.JOB_PROGRESS, {
      type: 'job_search',
      step: 'scraping',
      progress: 25,
      message: 'Jobs scraped, starting AI scoring...'
    }, jobData.jobRecordId, userId);
    
    // Score all jobs using AI
    const scoredJobs = await jobScoringService.scoreMultipleJobs(mockJobs, profile);
    
    // Emit progress event
    emitJobEvent(EVENT_TYPES.JOB_PROGRESS, {
      type: 'job_search',
      step: 'scoring',
      progress: 50,
      message: 'AI scoring completed, filtering jobs...'
    }, jobData.jobRecordId, userId);
    
    // Filter by minimum suitability score
    const qualifiedJobs = jobScoringService.filterJobsByScore(scoredJobs);
    
    // Emit progress event
    emitJobEvent(EVENT_TYPES.JOB_PROGRESS, {
      type: 'job_search',
      step: 'filtering',
      progress: 75,
      message: 'Jobs filtered, saving search results...'
    }, jobData.jobRecordId, userId);
    
    // Apply application limits
    const limitedJobs = qualifiedJobs.slice(0, maxResults || 10);
    
    // Save search to database
    const searchResult = {
      jobs: limitedJobs,
      pagination: {
        total: qualifiedJobs.length,
        returned: limitedJobs.length,
        hasMore: qualifiedJobs.length > limitedJobs.length
      },
      scoring: {
        averageScore: qualifiedJobs.reduce((sum, job) => sum + job.score, 0) / qualifiedJobs.length || 0,
        highMatchCount: qualifiedJobs.filter(job => job.score >= 8).length,
        mediumMatchCount: qualifiedJobs.filter(job => job.score >= 6 && job.score < 8).length,
        lowMatchCount: qualifiedJobs.filter(job => job.score < 6).length
      },
      search: {
        keywords,
        locations,
        platforms,
        processedAt: new Date().toISOString()
      }
    };

    // Save job search record
    await dbService.createJobSearch({
      user_id: userId,
      keywords: keywords.split(' ').filter(k => k.length > 0),
      locations: locations || [],
      platforms: platforms || [],
      results_count: limitedJobs.length,
      search_params: { keywords, locations, platforms, maxResults, profile: { ...profile, resumeText: undefined } }
    });

    // Save qualified jobs to database
    for (const job of limitedJobs) {
      await dbService.saveJob({
        user_id: userId,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        description: job.description,
        platform: job.platform,
        url: job.url,
        posted_date: job.postedDate,
        match_score: job.score,
        skills: job.skills,
        ai_analysis: job.aiAnalysis
      });
    }

    console.log(`✅ Job search completed for ${keywords}`);
    
    // Emit job completed event
    emitJobEvent(EVENT_TYPES.JOB_COMPLETED, {
      type: 'job_search',
      keywords,
      locations,
      platforms,
      resultsCount: limitedJobs.length,
      qualifiedCount: qualifiedJobs.length
    }, jobData.jobRecordId, userId);
    
    return searchResult;
  } catch (error) {
    console.error('Job search processing failed:', error);
    
    // Emit job failed event
    emitJobEvent(EVENT_TYPES.JOB_FAILED, {
      type: 'job_search',
      keywords,
      locations,
      platforms,
      error: error.message
    }, jobData.jobRecordId, userId);
    
    throw new Error(`Job search failed: ${error.message}`);
  }
}

// Generate mock job data (replace with real web scraping)
async function generateMockJobs(keywords, locations, platforms, maxResults) {
  const baseJobs = [
    {
      title: 'Senior Frontend Developer',
      company: 'Tech Corp',
      location: 'Remote',
      platform: 'linkedin',
      description: 'Looking for experienced frontend developer with React and TypeScript skills...',
      skills: ['React', 'TypeScript', 'CSS', 'Node.js'],
      experienceLevel: 'senior',
      salary: '$120k - $150k',
      companySize: 'medium',
      postedDate: new Date().toISOString(),
      url: 'https://linkedin.com/jobs/senior-frontend-developer'
    },
    {
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'Bangalore',
      platform: 'naukri',
      description: 'Join our team as a full stack engineer working with modern tech stack...',
      skills: ['JavaScript', 'Python', 'Docker', 'AWS'],
      experienceLevel: 'mid',
      salary: '$80k - $100k',
      companySize: 'small',
      postedDate: new Date(Date.now() - 86400000).toISOString(),
      url: 'https://naukri.com/jobs/full-stack-engineer'
    },
    {
      title: 'React Developer',
      company: 'Enterprise Inc',
      location: 'Delhi',
      platform: 'indeed',
      description: 'Seeking talented React developer for enterprise applications...',
      skills: ['React', 'Redux', 'GraphQL', 'Jest'],
      experienceLevel: 'mid',
      salary: '$100k - $130k',
      companySize: 'large',
      postedDate: new Date(Date.now() - 172800000).toISOString(),
      url: 'https://indeed.com/jobs/react-developer'
    },
    {
      title: 'Software Engineer',
      company: 'Google',
      location: 'Bangalore',
      platform: 'linkedin',
      description: 'Build planet-scale applications...',
      skills: ['Go', 'C++', 'Systems'],
      experienceLevel: 'mid',
      salary: '$150k+',
      companySize: 'large',
      postedDate: new Date().toISOString(),
      url: 'https://linkedin.com/jobs/google-se'
    },
    {
      title: 'Senior Node.js Developer',
      company: 'FinTech Solution',
      location: 'Mumbai',
      platform: 'naukri',
      description: 'Looking for Node.js expert for high-throughput systems...',
      skills: ['Node.js', 'Redis', 'Microservices'],
      experienceLevel: 'senior',
      salary: '₹25L - ₹40L',
      companySize: 'medium',
      postedDate: new Date().toISOString(),
      url: 'https://naukri.com/jobs/node-expert'
    },
    {
      title: 'DevOps Engineer',
      company: 'InfraCo',
      location: 'Remote',
      platform: 'glassdoor',
      description: 'DevOps engineer to help build and maintain our cloud infrastructure...',
      skills: ['AWS', 'Terraform', 'CI/CD', 'Docker'],
      experienceLevel: 'mid',
      salary: '$110k - $140k',
      companySize: 'medium',
      postedDate: new Date(Date.now() - 259200000).toISOString(),
      url: 'https://glassdoor.com/jobs/devops-engineer'
    }
  ];

  // Filter by keywords (simple keyword matching)
  const keywordArray = keywords.toLowerCase().split(' ');
  let filteredJobs = baseJobs.filter(job => {
    const jobText = `${job.title} ${job.description} ${job.skills.join(' ')}`.toLowerCase();
    return keywordArray.some(keyword => jobText.includes(keyword));
  });

  // Filter by locations if specified
  if (locations && locations.length > 0) {
    filteredJobs = filteredJobs.filter(job => 
      locations.some(location => 
        job.location.toLowerCase().includes(location.toLowerCase()) ||
        location.toLowerCase().includes('remote') && job.location.toLowerCase().includes('remote')
      )
    );
  }

  // Filter by platforms if specified
  if (platforms && platforms.length > 0) {
    filteredJobs = filteredJobs.filter(job => platforms.includes(job.platform));
  }

  // Limit results
  return filteredJobs.slice(0, maxResults || 10).map((job, index) => ({
    ...job,
    id: `job-${Date.now()}-${index}`,
    applied: false,
    saved: false
  }));
}
