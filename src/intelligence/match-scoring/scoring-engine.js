import { z } from 'zod';
import { logger } from '../../shared/logger.js';
import { contextualEventEmitter } from '../../shared/context.js';

// Scoring factor schemas
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  skills: z.array(z.string()),
  experience: z.object({
    years: z.number().min(0).max(50),
    level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive']),
    titles: z.array(z.string()),
    companies: z.array(z.string())
  }),
  education: z.object({
    degree: z.string(),
    field: z.string(),
    school: z.string(),
    graduationYear: z.number().optional()
  }),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string(),
    remote: z.boolean(),
    relocation: z.boolean().default(false),
    preferredLocations: z.array(z.string()).default([])
  }),
  salary: z.object({
    current: z.number().optional(),
    expected: z.number().optional(),
    currency: z.string().default('USD'),
    negotiable: z.boolean().default(true)
  }),
  workAuthorization: z.object({
    citizen: z.boolean().default(false),
    workVisa: z.boolean().default(false),
    studentVisa: z.boolean().default(false),
    requiresSponsorship: z.boolean().default(false)
  }),
  preferences: z.object({
    jobTypes: z.array(z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance'])).default(['full-time']),
    industries: z.array(z.string()).default([]),
    companySizes: z.array(z.enum(['startup', 'small', 'medium', 'large', 'enterprise'])).default([]),
    remotePreference: z.enum(['on-site', 'hybrid', 'remote', 'any']).default('any')
  }),
  mustNotApply: z.object({
    noUnpaid: z.boolean().default(true),
    noRelocation: z.boolean().default(false),
    noInternships: z.boolean().default(true),
    minSalary: z.number().optional(),
    blacklistedCompanies: z.array(z.string()).default([]),
    blacklistedIndustries: z.array(z.string()).default([])
  }).optional()
});

export const JobPostingSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string(),
    remote: z.boolean(),
    hybrid: z.boolean()
  }),
  description: z.string(),
  requirements: z.array(z.string()),
  qualifications: z.array(z.string()),
  skills: z.array(z.string()),
  experience: z.object({
    years: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      preferred: z.number().optional()
    }),
    level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive']).optional()
  }),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('USD'),
    type: z.enum(['hourly', 'salary', 'contract']).default('salary')
  }),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance']),
  industry: z.string(),
  companySize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  postedDate: z.string().datetime(),
  applicationCount: z.number().optional(),
  platform: z.string()
});

export const ScoringWeightsSchema = z.object({
  skillOverlap: z.number().min(0).max(1).default(0.3),
  seniorityFit: z.number().min(0).max(1).default(0.2),
  locationFit: z.number().min(0).max(1).default(0.15),
  salaryAlignment: z.number().min(0).max(1).default(0.1),
  workAuthFit: z.number().min(0).max(1).default(0.1),
  recencyCompetition: z.number().min(0).max(1).default(0.1),
  experienceAlignment: z.number().min(0).max(1).default(0.05)
});

// Match scoring engine
export class MatchScoringEngine {
  constructor(weights = {}) {
    this.weights = ScoringWeightsSchema.parse(weights);
    this.confidenceThresholds = {
      high: 0.8,
      medium: 0.6,
      low: 0.4
    };
  }

  async calculateMatchScore(userProfile, jobPosting, customWeights = {}) {
    const startTime = Date.now();
    
    try {
      // Validate inputs
      const validatedProfile = UserProfileSchema.parse(userProfile);
      const validatedJob = JobPostingSchema.parse(jobPosting);
      const weights = { ...this.weights, ...customWeights };

      // Calculate individual factor scores
      const factorScores = {
        skillOverlap: await this.calculateSkillOverlap(validatedProfile, validatedJob),
        seniorityFit: await this.calculateSeniorityFit(validatedProfile, validatedJob),
        locationFit: await this.calculateLocationFit(validatedProfile, validatedJob),
        salaryAlignment: await this.calculateSalaryAlignment(validatedProfile, validatedJob),
        workAuthFit: await this.calculateWorkAuthFit(validatedProfile, validatedJob),
        recencyCompetition: await this.calculateRecencyCompetition(validatedJob),
        experienceAlignment: await this.calculateExperienceAlignment(validatedProfile, validatedJob)
      };

      // Apply hard filters (can disqualify immediately)
      const hardFilterResults = await this.applyHardFilters(validatedProfile, validatedJob);
      
      if (!hardFilterResults.passed) {
        return {
          overallScore: 0,
          factorScores,
          explanations: hardFilterResults.reasons,
          confidence: 'low',
          riskFlags: ['disqualified'],
          disqualified: true,
          disqualifiedReason: hardFilterResults.primaryReason
        };
      }

      // Calculate weighted overall score
      const overallScore = this.calculateWeightedScore(factorScores, weights);

      // Generate explanations
      const explanations = this.generateExplanations(factorScores, validatedProfile, validatedJob);

      // Determine confidence and risk flags
      const confidence = this.determineConfidence(overallScore, factorScores);
      const riskFlags = this.identifyRiskFlags(factorScores, validatedProfile, validatedJob);

      const result = {
        overallScore: Math.round(overallScore * 100) / 100, // Round to 2 decimal places
        factorScores,
        explanations,
        confidence,
        riskFlags,
        disqualified: false,
        metadata: {
          calculatedAt: new Date().toISOString(),
          calculationDuration: Date.now() - startTime,
          weights,
          hardFilters: hardFilterResults
        }
      };

      // Emit scoring event
      contextualEventEmitter.emitByType('match.score_calculated', {
        userId: validatedProfile.id,
        jobId: validatedJob.id,
        score: result.overallScore,
        confidence: result.confidence,
        riskFlags: result.riskFlags.length
      }, validatedProfile.id);

      logger.info(`Match score calculated`, {
        userId: validatedProfile.id,
        jobId: validatedJob.id,
        score: result.overallScore,
        confidence: result.confidence,
        riskFlags: result.riskFlags.length,
        duration: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logger.error(`Match scoring failed`, {
        userId: userProfile.id,
        jobId: jobPosting.id,
        error: error.message
      }, error);
      
      throw new Error(`Match scoring failed: ${error.message}`);
    }
  }

  async calculateSkillOverlap(profile, job) {
    const userSkills = new Set(profile.skills.map(s => s.toLowerCase()));
    const jobSkills = new Set(job.skills.map(s => s.toLowerCase()));
    
    // Calculate overlap
    const overlap = [...userSkills].filter(skill => jobSkills.has(skill)).length;
    const totalUniqueSkills = new Set([...userSkills, ...jobSkills]).size;
    const overlapRatio = totalUniqueSkills > 0 ? overlap / totalUniqueSkills : 0;

    // Bonus for key skill matches
    const keySkills = ['react', 'node', 'python', 'javascript', 'java', 'aws', 'docker', 'kubernetes'];
    const keySkillMatches = [...userSkills].filter(skill => 
      jobSkills.has(skill) && keySkills.includes(skill)
    ).length;
    const keySkillBonus = Math.min(keySkillMatches / 5, 0.2); // Max 20% bonus

    return Math.min(overlapRatio + keySkillBonus, 1.0);
  }

  async calculateSeniorityFit(profile, job) {
    const profileLevel = this.getSeniorityLevel(profile.experience.level);
    const jobLevel = this.getSeniorityLevel(job.experience.level);

    // Exact match gets full score
    if (profileLevel === jobLevel) return 1.0;

    // Calculate level difference penalty
    const levelDiff = Math.abs(profileLevel - jobLevel);
    const maxDiff = 6; // Maximum possible difference (executive to entry)

    // Penalize overqualification more than underqualification
    if (profileLevel > jobLevel) {
      return Math.max(0, 1.0 - (levelDiff / maxDiff) * 1.5);
    } else {
      return Math.max(0, 1.0 - (levelDiff / maxDiff) * 0.8);
    }
  }

  async calculateLocationFit(profile, job) {
    // Remote jobs are always a good fit
    if (job.remote && (profile.remote || profile.preferences.remotePreference === 'remote' || profile.preferences.remotePreference === 'any')) {
      return 1.0;
    }

    // Hybrid jobs
    if (job.hybrid && (profile.remote || profile.preferences.remotePreference === 'hybrid' || profile.preferences.remotePreference === 'any')) {
      return 0.9;
    }

    // On-site jobs
    if (!job.remote && !job.hybrid) {
      // Check if user is willing to relocate
      if (profile.relocation) {
        return 0.8; // Willing to relocate but not ideal
      }

      // Check preferred locations
      const userLocation = `${profile.location.city}, ${profile.location.state}`.toLowerCase();
      const jobLocation = `${job.location.city}, ${job.location.state}`.toLowerCase();
      
      if (userLocation === jobLocation) {
        return 1.0; // Exact location match
      }

      // Check if job is in preferred locations
      const preferredMatch = profile.preferredLocations.some(pref => 
        pref.toLowerCase() === jobLocation
      );
      
      if (preferredMatch) {
        return 0.95;
      }

      // Same country/state
      if (profile.location.state === job.location.state) {
        return 0.7;
      }

      return 0.3; // Poor location fit
    }

    return 0.5; // Default
  }

  async calculateSalaryAlignment(profile, job) {
    if (!profile.salary.expected || !job.salary.min) {
      return 0.5; // No salary data available
    }

    const expectedSalary = profile.salary.expected;
    const minSalary = job.salary.min;
    const maxSalary = job.salary.max;

    // Check if job meets minimum expectation
    if (minSalary >= expectedSalary) {
      return 1.0; // Job meets or exceeds expectation
    }

    // Calculate how close it is to expectation
    const salaryGap = expectedSalary - minSalary;
    const percentageGap = salaryGap / expectedSalary;

    if (percentageGap <= 0.1) {
      return 0.9; // Within 10%
    } else if (percentageGap <= 0.2) {
      return 0.8; // Within 20%
    } else if (percentageGap <= 0.3) {
      return 0.6; // Within 30%
    } else {
      return Math.max(0.2, 1.0 - percentageGap * 2); // Exponential decay
    }
  }

  async calculateWorkAuthFit(profile, job) {
    // If user is citizen, always a perfect fit
    if (profile.workAuthorization.citizen) {
      return 1.0;
    }

    // If user has work visa, good fit
    if (profile.workAuthorization.workVisa) {
      return 0.95;
    }

    // If job doesn't require sponsorship, student visa might work
    if (!profile.workAuthorization.requiresSponsorship) {
      if (profile.workAuthorization.studentVisa) {
        return 0.7; // Student visa, some risk
      }
      return 0.8; // No sponsorship required
    }

    // If job requires sponsorship and user doesn't have work visa
    if (profile.workAuthorization.requiresSponsorship && !profile.workAuthorization.workVisa) {
      return 0.1; // Very poor fit
    }

    return 0.5; // Default
  }

  async calculateRecencyCompetition(job) {
    const postedDate = new Date(job.postedDate);
    const now = new Date();
    const daysSincePosted = (now - postedDate) / (1000 * 60 * 60 * 24);

    // Newer jobs get higher scores
    if (daysSincePosted <= 1) {
      return 1.0;
    } else if (daysSincePosted <= 3) {
      return 0.9;
    } else if (daysSincePosted <= 7) {
      return 0.8;
    } else if (daysSincePosted <= 14) {
      return 0.6;
    } else if (daysSincePosted <= 30) {
      return 0.4;
    } else {
      return 0.2; // Very old job
    }
  }

  async calculateExperienceAlignment(profile, job) {
    if (!job.experience.years.preferred) {
      return 0.8; // No preference specified
    }

    const userYears = profile.experience.years;
    const preferredYears = job.experience.years.preferred;

    // Calculate alignment with preferred years
    const diff = Math.abs(userYears - preferredYears);
    const maxDiff = 20; // Maximum reasonable difference

    if (diff <= 1) {
      return 1.0; // Perfect match
    } else if (diff <= 3) {
      return 0.9;
    } else if (diff <= 5) {
      return 0.7;
    } else {
      return Math.max(0.3, 1.0 - (diff / maxDiff));
    }
  }

  async applyHardFilters(profile, job) {
    const reasons = [];
    let primaryReason = null;

    // Check must-not-apply rules
    if (profile.mustNotApply) {
      const rules = profile.mustNotApply;

      // No unpaid internships
      if (rules.noUnpaid && job.employmentType === 'internship' && !job.salary?.min) {
        reasons.push('Unpaid internship not allowed');
        primaryReason = primaryReason || reasons[0];
      }

      // No relocation required
      if (rules.noRelocation && !job.remote && !profile.relocation) {
        const userLocation = `${profile.location.city}, ${profile.location.state}`;
        const jobLocation = `${job.location.city}, ${job.location.state}`;
        
        if (userLocation !== jobLocation) {
          reasons.push('Relocation required but not preferred');
          primaryReason = primaryReason || reasons[0];
        }
      }

      // No internships
      if (rules.noInternships && job.employmentType === 'internship') {
        reasons.push('Internships not preferred');
        primaryReason = primaryReason || reasons[0];
      }

      // Minimum salary requirement
      if (rules.minSalary && (!job.salary.min || job.salary.min < rules.minSalary)) {
        reasons.push(`Salary below minimum requirement ($${rules.minSalary})`);
        primaryReason = primaryReason || reasons[0];
      }

      // Blacklisted companies
      if (rules.blacklistedCompanies && rules.blacklistedCompanies.includes(job.company)) {
        reasons.push('Company is blacklisted');
        primaryReason = primaryReason || reasons[0];
      }

      // Blacklisted industries
      if (rules.blacklistedIndustries && rules.blacklistedIndustries.includes(job.industry)) {
        reasons.push('Industry is blacklisted');
        primaryReason = primaryReason || reasons[0];
      }
    }

    // Employment type preference
    if (!profile.preferences.jobTypes.includes(job.employmentType)) {
      reasons.push(`Employment type "${job.employmentType}" not in preferences`);
      primaryReason = primaryReason || reasons[0];
    }

    return {
      passed: reasons.length === 0,
      reasons,
      primaryReason
    };
  }

  calculateWeightedScore(factorScores, weights) {
    return Object.entries(factorScores).reduce((total, [factor, score]) => {
      const weight = weights[factor] || 0;
      return total + (score * weight);
    }, 0);
  }

  generateExplanations(factorScores, profile, job) {
    const explanations = [];

    // Generate top 5 reasons
    const sortedFactors = Object.entries(factorScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    for (const [factor, score] of sortedFactors) {
      const explanation = this.getFactorExplanation(factor, score, profile, job);
      if (explanation) {
        explanations.push(explanation);
      }
    }

    return explanations;
  }

  getFactorExplanation(factor, score, profile, job) {
    const explanations = {
      skillOverlap: () => {
        const userSkills = profile.skills.slice(0, 3).join(', ');
        const jobSkills = job.skills.slice(0, 3).join(', ');
        return {
          factor: 'Skill Match',
          score: Math.round(score * 100),
          reason: `Strong skill alignment between your expertise (${userSkills}) and job requirements (${jobSkills})`,
          impact: 'high'
        };
      },
      seniorityFit: () => {
        return {
          factor: 'Experience Level',
          score: Math.round(score * 100),
          reason: `Your ${profile.experience.level} experience level matches the ${job.experience.level} requirement`,
          impact: 'high'
        };
      },
      locationFit: () => {
        const locationDesc = job.remote ? 'Remote work' : `${job.location.city}, ${job.location.state}`;
        return {
          factor: 'Location',
          score: Math.round(score * 100),
          reason: `Great location match for ${locationDesc}`,
          impact: 'medium'
        };
      },
      salaryAlignment: () => {
        if (profile.salary.expected && job.salary.min) {
          const expected = profile.salary.expected;
          const offered = job.salary.min;
          const comparison = offered >= expected ? 'meets or exceeds' : 'close to';
          return {
            factor: 'Salary',
            score: Math.round(score * 100),
            reason: `Salary ${comparison} your expectations ($${offered} vs $${expected})`,
            impact: 'medium'
          };
        }
        return null;
      },
      workAuthFit: () => {
        return {
          factor: 'Work Authorization',
          score: Math.round(score * 100),
          reason: 'Your work authorization status aligns with job requirements',
          impact: 'medium'
        };
      },
      recencyCompetition: () => {
        const postedDate = new Date(job.postedDate);
        const daysAgo = Math.floor((new Date() - postedDate) / (1000 * 60 * 60 * 24));
        return {
          factor: 'Job Freshness',
          score: Math.round(score * 100),
          reason: `Recently posted (${daysAgo} days ago) with likely less competition`,
          impact: 'low'
        };
      },
      experienceAlignment: () => {
        if (job.experience.years.preferred) {
          return {
            factor: 'Experience Years',
            score: Math.round(score * 100),
            reason: `Your ${profile.experience.years} years of experience matches the ${job.experience.years.preferred} year preference`,
            impact: 'medium'
          };
        }
        return null;
      }
    };

    return explanations[factor]?.();
  }

  determineConfidence(overallScore, factorScores) {
    // High confidence if most factors are strong
    const strongFactors = Object.values(factorScores).filter(score => score >= 0.8).length;
    const totalFactors = Object.keys(factorScores).length;
    const strongFactorRatio = strongFactors / totalFactors;

    if (overallScore >= 0.8 && strongFactorRatio >= 0.6) {
      return 'high';
    } else if (overallScore >= 0.6 && strongFactorRatio >= 0.4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  identifyRiskFlags(factorScores, profile, job) {
    const risks = [];

    // Low skill overlap
    if (factorScores.skillOverlap < 0.3) {
      risks.push('low_skill_match');
    }

    // Seniority mismatch
    if (factorScores.seniorityFit < 0.4) {
      risks.push('seniority_mismatch');
    }

    // Location issues
    if (factorScores.locationFit < 0.4) {
      risks.push('location_mismatch');
    }

    // Salary below expectation
    if (factorScores.salaryAlignment < 0.4) {
      risks.push('salary_below_expectation');
    }

    // Work authorization issues
    if (factorScores.workAuthFit < 0.3) {
      risks.push('work_authorization_issue');
    }

    // Old job posting
    if (factorScores.recencyCompetition < 0.3) {
      risks.push('old_job_posting');
    }

    // High competition
    if (job.applicationCount && job.applicationCount > 100) {
      risks.push('high_competition');
    }

    return risks;
  }

  getSeniorityLevel(level) {
    const levels = {
      'entry': 0,
      'junior': 1,
      'mid': 2,
      'senior': 3,
      'lead': 4,
      'principal': 5,
      'executive': 6
    };
    return levels[level] || 2; // Default to mid-level
  }

  // Batch scoring for multiple jobs
  async batchScoreJobs(userProfile, jobPostings, customWeights = {}) {
    const startTime = Date.now();
    const results = [];

    for (const job of jobPostings) {
      try {
        const score = await this.calculateMatchScore(userProfile, job, customWeights);
        results.push({
          jobId: job.id,
          score: score.overallScore,
          confidence: score.confidence,
          riskFlags: score.riskFlags,
          disqualified: score.disqualified
        });
      } catch (error) {
        logger.warn(`Failed to score job ${job.id}`, { jobId: job.id, error: error.message });
        results.push({
          jobId: job.id,
          score: 0,
          confidence: 'low',
          riskFlags: ['scoring_error'],
          disqualified: true,
          error: error.message
        });
      }
    }

    // Sort by score (highest first) and handle disqualified jobs
    const qualifiedJobs = results.filter(r => !r.disqualified);
    const disqualifiedJobs = results.filter(r => r.disqualified);

    qualifiedJobs.sort((a, b) => b.score - a.score);
    disqualifiedJobs.sort((a, b) => a.jobId.localeCompare(b.jobId));

    const finalResults = [...qualifiedJobs, ...disqualifiedJobs];

    logger.info(`Batch scoring completed`, {
      userId: userProfile.id,
      totalJobs: jobPostings.length,
      qualifiedJobs: qualifiedJobs.length,
      disqualifiedJobs: disqualifiedJobs.length,
      duration: Date.now() - startTime
    });

    return finalResults;
  }

  // Update scoring weights
  updateWeights(newWeights) {
    this.weights = ScoringWeightsSchema.parse({ ...this.weights, ...newWeights });
    logger.info('Scoring weights updated', { weights: this.weights });
  }

  // Get current weights
  getWeights() {
    return { ...this.weights };
  }
}

// Global scoring engine instance
export const matchScoringEngine = new MatchScoringEngine();
