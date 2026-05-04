import { aiService } from './aiService.js';

class JobScoringService {
  constructor() {
    this.config = {
      MINIMUM_SUITABILITY_SCORE: 7, // 0-10 scale
      MAX_APPLICATIONS_PER_JOB: 5,
      MIN_APPLICATIONS_PER_JOB: 1,
      SCORING_FACTORS: {
        SKILLS_MATCH: 0.4,      // 40% weight
        EXPERIENCE_MATCH: 0.3,  // 30% weight  
        LOCATION_MATCH: 0.15,   // 15% weight
        SALARY_MATCH: 0.1,      // 10% weight
        COMPANY_MATCH: 0.05     // 5% weight
      }
    };
  }

  // Calculate comprehensive job suitability score
  async calculateJobScore(job, userProfile) {
    try {
      const scores = {
        skills: await this.calculateSkillsMatch(job, userProfile),
        experience: this.calculateExperienceMatch(job, userProfile),
        location: this.calculateLocationMatch(job, userProfile),
        salary: this.calculateSalaryMatch(job, userProfile),
        company: this.calculateCompanyMatch(job, userProfile)
      };

      // Weighted average calculation
      let totalScore = 0;
      Object.keys(scores).forEach(factor => {
        const weight = this.config.SCORING_FACTORS[factor.toUpperCase().replace('_MATCH', '')] || 0;
        totalScore += scores[factor] * weight;
      });

      const finalScore = Math.round(totalScore * 10) / 10; // Round to 1 decimal

      return {
        finalScore,
        breakdown: scores,
        recommendation: this.getRecommendation(finalScore),
        shouldApply: finalScore >= this.config.MINIMUM_SUITABILITY_SCORE
      };

    } catch (error) {
      console.error('Error calculating job score:', error);
      return {
        finalScore: 0,
        breakdown: {},
        recommendation: 'Unable to calculate score',
        shouldApply: false
      };
    }
  }

  // AI-powered skills matching
  async calculateSkillsMatch(job, userProfile) {
    try {
      const jobSkills = job.skills || [];
      const userSkills = userProfile.skills || [];

      if (jobSkills.length === 0) return 0.5; // Default if no skills listed

      // Use AI to analyze skill compatibility
      const analysisPrompt = `
        Compare these job requirements with candidate skills:
        
        Job Skills: ${jobSkills.join(', ')}
        Candidate Skills: ${userSkills.join(', ')}
        
        Rate the match from 0-10 considering:
        1. Direct skill matches
        2. Transferable skills
        3. Skill level compatibility
        
        Return only a number from 0-10.
      `;

      const response = await aiService.analyzeJobDescription(analysisPrompt);
      const score = parseFloat(response) || 0;
      return Math.min(10, Math.max(0, score)) / 10; // Normalize to 0-1

    } catch (error) {
      // Fallback to simple keyword matching
      return this.simpleSkillsMatch(job.skills || [], userProfile.skills || []);
    }
  }

  // Simple fallback skills matching
  simpleSkillsMatch(jobSkills, userSkills) {
    if (jobSkills.length === 0) return 0.5;
    
    const matches = jobSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    return matches.length / jobSkills.length;
  }

  // Experience level matching
  calculateExperienceMatch(job, userProfile) {
    const requiredExp = job.experienceLevel || 'mid';
    const userExp = userProfile.experienceLevel || 'mid';
    
    const experienceLevels = {
      'entry': 0,
      'junior': 1,
      'mid': 2,
      'senior': 3,
      'lead': 4,
      'principal': 5
    };

    const required = experienceLevels[requiredExp] || 2;
    const user = experienceLevels[userExp] || 2;

    if (user >= required) return 1.0; // Perfect match or overqualified
    if (user === required - 1) return 0.7; // Close match
    return 0.3; // Underqualified
  }

  // Location compatibility
  calculateLocationMatch(job, userProfile) {
    const jobLocation = (job.location || '').toLowerCase();
    const userLocations = (userProfile.targetLocations || []).map(l => l.toLowerCase());

    if (!jobLocation || userLocations.length === 0) return 0.5;

    // Exact match
    if (userLocations.some(loc => jobLocation.includes(loc) || loc.includes(jobLocation))) {
      return 1.0;
    }

    // Remote work preference
    if (jobLocation.includes('remote') && userProfile.preferredJobTypes?.includes('remote')) {
      return 1.0;
    }

    // Same country/region
    const jobCountry = this.extractCountry(jobLocation);
    const userCountry = userLocations.find(loc => this.extractCountry(loc));
    
    if (jobCountry && userCountry && jobCountry === userCountry) {
      return 0.7;
    }

    return 0.3;
  }

  // Salary expectations matching
  calculateSalaryMatch(job, userProfile) {
    const jobSalary = this.parseSalary(job.salary);
    const userSalary = userProfile.targetSalary || 0;

    if (!jobSalary || !userSalary) return 0.5;

    const ratio = userSalary / jobSalary;
    
    if (ratio >= 0.8 && ratio <= 1.2) return 1.0; // Good match
    if (ratio >= 0.6 && ratio <= 1.5) return 0.7; // Acceptable
    return 0.3; // Poor match
  }

  // Company size/type preference
  calculateCompanyMatch(job, userProfile) {
    // This could be enhanced with user preferences
    const companySize = job.companySize || 'medium';
    const userPreferences = userProfile.companyPreferences || {};

    // Basic logic - can be expanded
    if (userPreferences[companySize]) return 1.0;
    return 0.5; // Neutral
  }

  // Get recommendation based on score
  getRecommendation(score) {
    if (score >= 9) return 'Excellent match - Highly recommended';
    if (score >= 8) return 'Great match - Apply immediately';
    if (score >= 7) return 'Good match - Consider applying';
    if (score >= 6) return 'Fair match - Apply if interested';
    if (score >= 5) return 'Below average - Consider other options';
    return 'Poor match - Not recommended';
  }

  // Helper functions
  parseSalary(salaryText) {
    if (!salaryText) return null;
    
    const match = salaryText.match(/\$?(\d+(?:,\d+)*)[kK]?/);
    if (match) {
      let salary = parseInt(match[1].replace(',', ''));
      if (salaryText.toLowerCase().includes('k')) salary *= 1000;
      return salary;
    }
    return null;
  }

  extractCountry(location) {
    const countries = ['usa', 'us', 'uk', 'canada', 'india', 'australia', 'germany'];
    return countries.find(country => location.toLowerCase().includes(country));
  }

  // Batch scoring for multiple jobs
  async scoreMultipleJobs(jobs, userProfile) {
    const results = [];
    
    for (const job of jobs) {
      const score = await this.calculateJobScore(job, userProfile);
      results.push({
        ...job,
        score: score.finalScore,
        scoreBreakdown: score.breakdown,
        recommendation: score.recommendation,
        shouldApply: score.shouldApply
      });
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  // Filter jobs by minimum score
  filterJobsByScore(jobs, minScore = null) {
    const threshold = minScore || this.config.MINIMUM_SUITABILITY_SCORE;
    return jobs.filter(job => job.score >= threshold);
  }
}

export const jobScoringService = new JobScoringService();
