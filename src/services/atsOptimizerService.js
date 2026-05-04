import { aiService } from './aiService.js';

class ATSOptimizerService {
  constructor() {
    this.atsKeywords = {
      technical: ['javascript', 'python', 'react', 'node.js', 'aws', 'docker', 'kubernetes', 'git', 'sql', 'nosql'],
      soft: ['leadership', 'communication', 'teamwork', 'problem-solving', 'collaboration', 'agile', 'scrum'],
      action: ['developed', 'implemented', 'designed', 'optimized', 'managed', 'led', 'created', 'improved'],
      metrics: ['increased', 'decreased', 'reduced', 'improved', 'enhanced', 'accelerated', 'streamlined']
    };
    
    this.atsRules = {
      maxFileSize: 2, // MB
      preferredFormats: ['pdf', 'docx'],
      maxPages: 2,
      minFont: 10,
      maxFont: 14,
      avoidKeywords: ['objective', 'references available upon request', 'photo'],
      requiredSections: ['experience', 'education', 'skills']
    };
  }

  // Check ATS compatibility
  async checkATSCompatibility(resume) {
    try {
      const issues = [];
      const score = 100;
      let currentScore = score;

      // Check file format
      if (!this.atsRules.preferredFormats.includes(resume.format?.toLowerCase())) {
        issues.push({
          type: 'format',
          severity: 'high',
          message: `Use ${this.atsRules.preferredFormats.join(' or ')} format instead of ${resume.format}`,
          impact: -15
        });
        currentScore -= 15;
      }

      // Check file size
      if (resume.fileSize && resume.fileSize > this.atsRules.maxFileSize) {
        issues.push({
          type: 'size',
          severity: 'medium',
          message: `File size ${resume.fileSize}MB exceeds recommended ${this.atsRules.maxFileSize}MB`,
          impact: -10
        });
        currentScore -= 10;
      }

      // Check page count
      if (resume.pageCount && resume.pageCount > this.atsRules.maxPages) {
        issues.push({
          type: 'length',
          severity: 'medium',
          message: `Resume is ${resume.pageCount} pages, keep it under ${this.atsRules.maxPages}`,
          impact: -10
        });
        currentScore -= 10;
      }

      // Check required sections
      const sections = resume.sections || [];
      this.atsRules.requiredSections.forEach(section => {
        if (!sections.includes(section)) {
          issues.push({
            type: 'structure',
            severity: 'high',
            message: `Missing required section: ${section}`,
            impact: -12
          });
          currentScore -= 12;
        }
      });

      // Check for problematic keywords
      const resumeText = (resume.content || '').toLowerCase();
      this.atsRules.avoidKeywords.forEach(keyword => {
        if (resumeText.includes(keyword)) {
          issues.push({
            type: 'content',
            severity: 'low',
            message: `Remove "${keyword}" - ATS systems may flag this`,
            impact: -5
          });
          currentScore -= 5;
        }
      });

      // Check keyword density and relevance
      const keywordAnalysis = await this.analyzeKeywordDensity(resume);
      if (keywordAnalysis.score < 70) {
        issues.push({
          type: 'keywords',
          severity: 'medium',
          message: 'Low keyword density - add more relevant keywords',
          impact: -15
        });
        currentScore -= 15;
      }

      return {
        score: Math.max(0, currentScore),
        issues,
        recommendations: this.generateRecommendations(issues),
        keywordAnalysis,
        passed: currentScore >= 70
      };

    } catch (error) {
      console.error('ATS compatibility check error:', error);
      return {
        score: 0,
        issues: [{ type: 'error', message: 'Unable to analyze resume', severity: 'high' }],
        passed: false
      };
    }
  }

  // Get comprehensive resume quality score
  async getResumeQualityScore(resume, jobDescription = null) {
    try {
      const scores = {
        atsCompatibility: 0,
        contentQuality: 0,
        keywordRelevance: 0,
        structure: 0,
        readability: 0
      };

      // ATS Compatibility
      const atsCheck = await this.checkATSCompatibility(resume);
      scores.atsCompatibility = atsCheck.score;

      // Content Quality
      scores.contentQuality = await this.assessContentQuality(resume);

      // Keyword Relevance
      if (jobDescription) {
        scores.keywordRelevance = await this.calculateKeywordRelevance(resume, jobDescription);
      } else {
        scores.keywordRelevance = 70; // Default score
      }

      // Structure
      scores.structure = this.assessStructure(resume);

      // Readability
      scores.readability = this.assessReadability(resume);

      // Calculate weighted average
      const weights = {
        atsCompatibility: 0.3,
        contentQuality: 0.25,
        keywordRelevance: 0.25,
        structure: 0.1,
        readability: 0.1
      };

      let totalScore = 0;
      Object.keys(scores).forEach(category => {
        totalScore += scores[category] * weights[category];
      });

      const finalScore = Math.round(totalScore);

      return {
        score: finalScore,
        breakdown: scores,
        grade: this.getGrade(finalScore),
        atsCheck,
        strengths: this.identifyStrengths(scores),
        improvements: this.identifyImprovements(scores)
      };

    } catch (error) {
      console.error('Quality score error:', error);
      return { score: 0, error: 'Unable to calculate quality score' };
    }
  }

  // Match job and resume
  async matchJob(resume, jobDescription) {
    try {
      const prompt = `
        Analyze this resume against the job description and provide:
        1. Match percentage (0-100)
        2. Missing keywords/skills
        3. Strengths that match well
        4. Areas that need improvement
        5. Overall recommendation
        
        Resume: ${JSON.stringify(resume)}
        Job Description: ${jobDescription}
        
        Return as JSON with these fields.
      `;

      const analysis = await aiService.analyzeJobDescription(prompt);
      const matchData = JSON.parse(analysis);

      // Enhance with our own analysis
      const keywordAnalysis = await this.calculateKeywordRelevance(resume, jobDescription);
      const skillGaps = await this.analyzeSkillGaps(resume, jobDescription);

      return {
        matchPercentage: matchData.matchPercentage || keywordAnalysis,
        missingKeywords: matchData.missingKeywords || skillGaps.missing,
        strengths: matchData.strengths || skillGaps.strengths,
        improvements: matchData.improvements || skillGaps.improvements,
        recommendation: matchData.recommendation || this.getRecommendation(matchData.matchPercentage || keywordAnalysis),
        keywordAnalysis,
        skillGaps
      };

    } catch (error) {
      console.error('Job matching error:', error);
      return {
        matchPercentage: 0,
        error: 'Unable to match job'
      };
    }
  }

  // Analyze resume gaps
  async analyzeResumeGaps(resume, jobDescription = null) {
    try {
      const gaps = {
        skills: [],
        experience: [],
        education: [],
        keywords: [],
        sections: []
      };

      // Analyze skills gaps
      const skills = resume.skills || [];
      if (jobDescription) {
        const requiredSkills = await this.extractRequiredSkills(jobDescription);
        gaps.skills = requiredSkills.filter(skill => 
          !skills.some(userSkill => 
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
          )
        );
      }

      // Analyze experience gaps
      const experience = resume.experience || [];
      if (experience.length === 0) {
        gaps.experience.push('No work experience listed');
      } else if (experience.length < 2) {
        gaps.experience.push('Limited work experience - consider adding more roles');
      }

      // Analyze education gaps
      const education = resume.education || [];
      if (education.length === 0) {
        gaps.education.push('No education information provided');
      }

      // Analyze keyword gaps
      const resumeText = (resume.content || '').toLowerCase();
      const importantKeywords = [
        'developed', 'implemented', 'designed', 'managed', 'led', 'created',
        'increased', 'decreased', 'improved', 'optimized', 'reduced'
      ];
      
      gaps.keywords = importantKeywords.filter(keyword => !resumeText.includes(keyword));

      // Analyze section gaps
      const sections = resume.sections || [];
      const importantSections = ['summary', 'experience', 'education', 'skills'];
      gaps.sections = importantSections.filter(section => !sections.includes(section));

      return {
        gaps,
        totalGaps: gaps.skills.length + gaps.experience.length + gaps.education.length + 
                   gaps.keywords.length + gaps.sections.length,
        severity: this.calculateGapSeverity(gaps),
        recommendations: this.generateGapRecommendations(gaps)
      };

    } catch (error) {
      console.error('Resume gaps analysis error:', error);
      return { gaps: {}, error: 'Unable to analyze gaps' };
    }
  }

  // Optimize resume for specific job
  async optimizeResumeForJob(resume, jobDescription) {
    try {
      const optimization = {
        sections: {},
        keywords: [],
        improvements: [],
        score: 0
      };

      // Get current match analysis
      const matchAnalysis = await this.matchJob(resume, jobDescription);
      
      // Optimize each section
      const sections = ['summary', 'experience', 'skills', 'education'];
      for (const section of sections) {
        optimization.sections[section] = await this.optimizeSection(
          resume[section] || {},
          jobDescription,
          section
        );
      }

      // Add missing keywords
      optimization.keywords = matchAnalysis.missingKeywords.slice(0, 10);

      // Generate improvements
      optimization.improvements = [
        `Add these keywords: ${optimization.keywords.join(', ')}`,
        `Quantify achievements with metrics`,
        `Use action verbs from job description`,
        `Tailor summary to match job requirements`
      ];

      // Calculate optimization score
      optimization.score = Math.max(0, 100 - matchAnalysis.missingKeywords.length * 5);

      return {
        optimization,
        beforeScore: matchAnalysis.matchPercentage,
        afterScore: optimization.score,
        improvement: optimization.score - matchAnalysis.matchPercentage,
        matchAnalysis
      };

    } catch (error) {
      console.error('Resume optimization error:', error);
      return { error: 'Unable to optimize resume' };
    }
  }

  // Optimize specific section
  async optimizeSection(sectionContent, jobDescription, sectionType) {
    try {
      const prompt = `
        Optimize this ${sectionType} section for the job description:
        
        Current content: ${JSON.stringify(sectionContent)}
        Job description: ${jobDescription}
        
        Guidelines:
        - Include relevant keywords from job description
        - Use action verbs
        - Quantify achievements where possible
        - Keep it concise and impactful
        - Match the tone and requirements
        
        Return optimized content as JSON.
      `;

      const optimized = await aiService.tailorResume(
        JSON.stringify(sectionContent),
        jobDescription
      );

      return {
        original: sectionContent,
        optimized: optimized,
        improvements: this.identifySectionImprovements(sectionContent, optimized)
      };

    } catch (error) {
      console.error('Section optimization error:', error);
      return { original: sectionContent, optimized: sectionContent };
    }
  }

  // Improve bullet point
  async improveBulletPoint(bulletPoint, jobDescription = null) {
    try {
      const prompt = `
        Improve this bullet point to be more impactful:
        
        Current: "${bulletPoint}"
        ${jobDescription ? `Job Context: ${jobDescription}` : ''}
        
        Guidelines:
        - Start with strong action verb
        - Include quantifiable metrics
        - Show impact and results
        - Keep it concise (under 2 lines)
        - Include relevant keywords
        
        Return only the improved bullet point.
      `;

      const improved = await aiService.tailorResume(bulletPoint, jobDescription || '');
      
      return {
        original: bulletPoint,
        improved: improved,
        analysis: this.analyzeBulletPoint(improved)
      };

    } catch (error) {
      console.error('Bullet point improvement error:', error);
      return { original: bulletPoint, improved: bulletPoint };
    }
  }

  // Helper methods
  async analyzeKeywordDensity(resume) {
    const content = (resume.content || '').toLowerCase();
    const importantKeywords = Object.values(this.atsKeywords).flat();
    
    const foundKeywords = importantKeywords.filter(keyword => content.includes(keyword));
    const density = (foundKeywords.length / importantKeywords.length) * 100;

    return {
      score: Math.round(density),
      foundKeywords,
      totalKeywords: importantKeywords.length,
      density: Math.round(density)
    };
  }

  async assessContentQuality(resume) {
    let score = 70; // Base score
    
    // Check for quantifiable achievements
    const content = (resume.content || '');
    const hasMetrics = /\d+%|\$\d+|\d+ years|\d+ months/.test(content);
    if (hasMetrics) score += 15;
    
    // Check for action verbs
    const actionVerbs = this.atsKeywords.action;
    const actionCount = actionVerbs.filter(verb => content.toLowerCase().includes(verb)).length;
    score += Math.min(15, actionCount * 3);
    
    return Math.min(100, score);
  }

  assessStructure(resume) {
    let score = 70;
    const sections = resume.sections || [];
    
    // Check for logical section order
    const expectedOrder = ['summary', 'experience', 'education', 'skills'];
    const orderScore = this.checkSectionOrder(sections, expectedOrder);
    score += orderScore * 10;
    
    return Math.min(100, score);
  }

  assessReadability(resume) {
    const content = resume.content || '';
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Ideal: 15-20 words per sentence
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) {
      return 85;
    } else if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) {
      return 75;
    } else {
      return 65;
    }
  }

  checkSectionOrder(sections, expectedOrder) {
    let score = 0;
    let currentIndex = 0;
    
    expectedOrder.forEach(section => {
      const index = sections.indexOf(section);
      if (index !== -1 && index >= currentIndex) {
        score++;
        currentIndex = index;
      }
    });
    
    return score / expectedOrder.length;
  }

  getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  generateRecommendations(issues) {
    return issues.map(issue => ({
      priority: issue.severity,
      action: issue.message,
      impact: `+${Math.abs(issue.impact)} points`
    }));
  }

  async calculateKeywordRelevance(resume, jobDescription) {
    const resumeText = (resume.content || '').toLowerCase();
    const jobText = jobDescription.toLowerCase();
    
    const jobKeywords = this.extractKeywords(jobText);
    const matchingKeywords = jobKeywords.filter(keyword => resumeText.includes(keyword));
    
    return Math.round((matchingKeywords.length / jobKeywords.length) * 100);
  }

  extractKeywords(text) {
    // Simple keyword extraction - can be enhanced with NLP
    const words = text.split(/\s+/);
    const importantWords = words.filter(word => 
      word.length > 3 && 
      !this.isStopWord(word) &&
      /[a-z]/.test(word)
    );
    
    return [...new Set(importantWords)].slice(0, 50);
  }

  isStopWord(word) {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return stopWords.includes(word);
  }

  async extractRequiredSkills(jobDescription) {
    // Enhanced skill extraction using AI
    const prompt = `
      Extract all required and preferred skills from this job description:
      ${jobDescription}
      
      Return as JSON array of skills.
    `;

    try {
      const response = await aiService.analyzeJobDescription(prompt);
      return JSON.parse(response);
    } catch (error) {
      // Fallback to regex extraction
      const skills = [];
      const skillPatterns = [
        /(\w+)\s*(experience|skills?|knowledge)/gi,
        /proficient in (\w+)/gi,
        /experience with (\w+)/gi
      ];
      
      skillPatterns.forEach(pattern => {
        const matches = jobDescription.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const skill = match.split(' ')[0];
            if (skill.length > 2) skills.push(skill);
          });
        }
      });
      
      return skills;
    }
  }

  async analyzeSkillGaps(resume, jobDescription) {
    const requiredSkills = await this.extractRequiredSkills(jobDescription);
    const userSkills = (resume.skills || []).map(skill => skill.toLowerCase());
    
    const missing = requiredSkills.filter(skill => 
      !userSkills.some(userSkill => 
        userSkill.includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(userSkill)
      )
    );
    
    const strengths = userSkills.filter(skill => 
      requiredSkills.some(req => 
        skill.includes(req.toLowerCase()) || 
        req.toLowerCase().includes(skill)
      )
    );

    return {
      missing,
      strengths,
      gapPercentage: Math.round((missing.length / requiredSkills.length) * 100)
    };
  }

  getRecommendation(score) {
    if (score >= 80) return 'Excellent match - Apply now';
    if (score >= 70) return 'Good match - Consider applying';
    if (score >= 60) return 'Fair match - Some improvements needed';
    if (score >= 50) return 'Poor match - Significant improvements needed';
    return 'Not recommended - Major gaps identified';
  }

  identifyStrengths(scores) {
    return Object.keys(scores)
      .filter(key => scores[key] >= 80)
      .map(key => `${key} (${scores[key]}%)`);
  }

  identifyImprovements(scores) {
    return Object.keys(scores)
      .filter(key => scores[key] < 70)
      .map(key => `${key} (${scores[key]}%)`);
  }

  calculateGapSeverity(gaps) {
    const totalGaps = gaps.skills.length + gaps.experience.length + 
                      gaps.education.length + gaps.keywords.length + gaps.sections.length;
    
    if (totalGaps >= 10) return 'high';
    if (totalGaps >= 5) return 'medium';
    return 'low';
  }

  generateGapRecommendations(gaps) {
    const recommendations = [];
    
    if (gaps.skills.length > 0) {
      recommendations.push(`Add these skills: ${gaps.skills.slice(0, 5).join(', ')}`);
    }
    
    if (gaps.experience.length > 0) {
      recommendations.push(gaps.experience[0]);
    }
    
    if (gaps.education.length > 0) {
      recommendations.push(gaps.education[0]);
    }
    
    if (gaps.keywords.length > 0) {
      recommendations.push(`Include action verbs: ${gaps.keywords.slice(0, 3).join(', ')}`);
    }
    
    if (gaps.sections.length > 0) {
      recommendations.push(`Add sections: ${gaps.sections.join(', ')}`);
    }
    
    return recommendations;
  }

  identifySectionImprovements(original, optimized) {
    const improvements = [];
    
    if (optimized.length > original.length) {
      improvements.push('Added more detail');
    }
    
    if (optimized.includes('%') || optimized.includes('$')) {
      improvements.push('Added metrics');
    }
    
    return improvements;
  }

  analyzeBulletPoint(bulletPoint) {
    const hasActionVerb = this.atsKeywords.action.some(verb => 
      bulletPoint.toLowerCase().startsWith(verb.toLowerCase())
    );
    
    const hasMetric = /\d+%|\$\d+|\d+ years/.test(bulletPoint);
    const isConcise = bulletPoint.length < 100;
    
    return {
      hasActionVerb,
      hasMetric,
      isConcise,
      score: (hasActionVerb ? 35 : 0) + (hasMetric ? 35 : 0) + (isConcise ? 30 : 0)
    };
  }
}

export const atsOptimizerService = new ATSOptimizerService();
