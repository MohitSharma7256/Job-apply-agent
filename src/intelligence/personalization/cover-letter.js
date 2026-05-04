import { z } from 'zod';
import { logger } from '../../shared/logger.js';
import { contextualEventEmitter } from '../../shared/context.js';

// Cover Letter Schemas
export const CoverLetterRequestSchema = z.object({
  userProfile: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    linkedin: z.string().optional(),
    currentTitle: z.string(),
    currentCompany: z.string().optional(),
    totalExperience: z.number(),
    keySkills: z.array(z.string()),
    achievements: z.array(z.string()),
    education: z.array(z.object({
      degree: z.string(),
      school: z.string(),
      year: z.number()
    }))
  }),
  jobInfo: z.object({
    title: z.string(),
    company: z.string(),
    hiringManager: z.string().optional(),
    location: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
    skills: z.array(z.string()),
    industry: z.string(),
    companySize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional()
  }),
  tone: z.enum(['concise', 'technical', 'leadership', 'startup', 'professional']).default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  personalization: z.object({
    referralSource: z.string().optional(),
    companyConnection: z.string().optional(),
    specificProjects: z.array(z.string()).default([]),
    excludeTopics: z.array(z.string()).default([])
  }).optional()
});

export const HallucinationReportSchema = z.object({
  unsupportedClaims: z.array(z.object({
    claim: z.string(),
    location: string,
    confidence: number,
    reason: string
  })),
  fabricatedMetrics: z.array(z.object({
    metric: string,
    location: string,
    suggestedFix: string
  })),
  falseConnections: z.array(z.object({
    connection: string,
    location: string,
    reason: string
  }))
});

export class CoverLetterGenerator {
  constructor() {
    this.toneTemplates = this.initializeToneTemplates();
    this.hallucinationPatterns = this.initializeHallucinationPatterns();
    this.sectionTemplates = this.initializeSectionTemplates();
  }

  async generateCoverLetter(request) {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validatedRequest = CoverLetterRequestSchema.parse(request);
      
      logger.info('Cover letter generation started', {
        company: validatedRequest.jobInfo.company,
        tone: validatedRequest.tone,
        length: validatedRequest.length
      });

      // Generate sections
      const sections = await this.generateSections(validatedRequest);
      
      // Apply tone transformation
      const tonedSections = this.applyToneToSections(sections, validatedRequest.tone);
      
      // Combine sections into full letter
      const fullLetter = this.combineSections(tonedSections, validatedRequest);
      
      // Run hallucination guard
      const hallucinationReport = this.runHallucinationGuard(
        validatedRequest.userProfile,
        validatedRequest.jobInfo,
        fullLetter
      );
      
      // Generate compliance score
      const complianceScore = this.calculateComplianceScore(fullLetter, hallucinationReport);
      
      // Generate metadata
      const metadata = this.generateMetadata(validatedRequest, fullLetter);

      const result = {
        coverLetter: {
          content: fullLetter,
          sections: tonedSections,
          metadata
        },
        compliance: {
          score: complianceScore,
          hallucinationReport,
          recommendations: this.generateRecommendations(hallucinationReport)
        },
        safetyChecks: this.generateSafetyChecks(hallucinationReport),
        warnings: this.generateWarnings(hallucinationReport),
        confidence: this.calculateConfidence(hallucinationReport, complianceScore),
        processingTime: Date.now() - startTime
      };

      // Emit completion event
      contextualEventEmitter.emitByType('cover_letter.generated', {
        company: validatedRequest.jobInfo.company,
        tone: validatedRequest.tone,
        complianceScore: result.compliance.score,
        confidence: result.confidence
      });

      logger.info('Cover letter generation completed', {
        company: validatedRequest.jobInfo.company,
        complianceScore: result.compliance.score,
        confidence: result.confidence,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logger.error('Cover letter generation failed', { error: error.message }, error);
      throw new Error(`Cover letter generation failed: ${error.message}`);
    }
  }

  async generateSections(request) {
    const sections = [];
    
    // Salutation
    sections.push(this.generateSalutation(request));
    
    // Opening paragraph
    sections.push(this.generateOpening(request));
    
    // Body paragraphs
    const bodyParagraphs = this.generateBody(request);
    sections.push(...bodyParagraphs);
    
    // Closing paragraph
    sections.push(this.generateClosing(request));
    
    // Sign-off
    sections.push(this.generateSignOff(request));

    return sections;
  }

  generateSalutation(request) {
    const { hiringManager, company } = request.jobInfo;
    
    if (hiringManager) {
      return {
        type: 'salutation',
        content: `Dear ${hiringManager},`
      };
    }
    
    return {
      type: 'salutation',
      content: `Dear Hiring Manager,`
    };
  }

  generateOpening(request) {
    const { userProfile, jobInfo, personalization } = request;
    const { title, company } = jobInfo;
    
    let opening = `I am writing to express my strong interest in the ${title} position at ${company}.`;
    
    // Add personalization if available
    if (personalization?.referralSource) {
      opening += ` I was excited to learn about this opportunity through ${personalization.referralSource}.`;
    }
    
    if (personalization?.companyConnection) {
      opening += ` Having followed ${company}'s innovative work in ${jobInfo.industry}, I am particularly drawn to your company's ${personalization.companyConnection}.`;
    }
    
    // Add experience alignment
    opening += ` With ${userProfile.totalExperience} years of experience as a ${userProfile.currentTitle}, I believe my background aligns perfectly with your requirements.`;

    return {
      type: 'opening',
      content: opening
    };
  }

  generateBody(request) {
    const { userProfile, jobInfo, personalization } = request;
    const paragraphs = [];

    // Skills and experience paragraph
    const skillsParagraph = this.generateSkillsParagraph(request);
    paragraphs.push(skillsParagraph);

    // Achievements paragraph
    const achievementsParagraph = this.generateAchievementsParagraph(request);
    paragraphs.push(achievementsParagraph);

    // Company fit paragraph
    const fitParagraph = this.generateFitParagraph(request);
    paragraphs.push(fitParagraph);

    // Specific projects paragraph (if provided)
    if (personalization?.specificProjects && personalization.specificProjects.length > 0) {
      const projectsParagraph = this.generateProjectsParagraph(request);
      paragraphs.push(projectsParagraph);
    }

    return paragraphs;
  }

  generateSkillsParagraph(request) {
    const { userProfile, jobInfo } = request;
    const { keySkills, achievements } = userProfile;
    const { requirements, skills } = jobInfo;

    // Find matching skills
    const matchingSkills = keySkills.filter(skill => 
      skills.some(jobSkill => jobSkill.toLowerCase().includes(skill.toLowerCase())) ||
      requirements.some(req => req.toLowerCase().includes(skill.toLowerCase()))
    );

    let paragraph = `In my current role as ${userProfile.currentTitle}${userProfile.currentCompany ? ` at ${userProfile.currentCompany}` : ''}, I have developed extensive expertise in ${matchingSkills.slice(0, 3).join(', ')}.`;

    // Add specific experience
    if (achievements.length > 0) {
      paragraph += ` ${achievements[0]}`;
    }

    // Connect to job requirements
    if (requirements.length > 0) {
      paragraph += ` This experience directly addresses your requirements for ${requirements.slice(0, 2).join(' and ')}.`;
    }

    return {
      type: 'body',
      content: paragraph
    };
  }

  generateAchievementsParagraph(request) {
    const { userProfile, jobInfo } = request;
    const { achievements } = userProfile;
    const { companySize } = jobInfo;

    let paragraph = 'Throughout my career, I have consistently delivered measurable results.';

    // Add achievements
    if (achievements.length > 0) {
      paragraph += ` ${achievements.slice(0, 2).join('. ')}.`;
    }

    // Tailor to company size
    if (companySize === 'startup' || companySize === 'small') {
      paragraph += ' I thrive in fast-paced environments where I can wear multiple hats and drive initiatives from concept to completion.';
    } else if (companySize === 'large' || companySize === 'enterprise') {
      paragraph += ' I excel in structured environments where I can collaborate with cross-functional teams and contribute to large-scale projects.';
    }

    return {
      type: 'body',
      content: paragraph
    };
  }

  generateFitParagraph(request) {
    const { jobInfo, personalization } = request;
    const { company, industry, description } = jobInfo;

    let paragraph = `I am particularly drawn to ${company} because of your commitment to innovation in ${industry}.`;

    // Add company-specific details
    if (description) {
      const descriptionWords = description.split(' ').slice(0, 10).join(' ');
      paragraph += ` Your focus on ${descriptionWords} resonates with my professional values and career goals.`;
    }

    // Add personalization
    if (personalization?.companyConnection) {
      paragraph += ` ${personalization.companyConnection}.`;
    }

    paragraph += ' I am confident that my skills and experience would enable me to contribute significantly to your team and help drive continued success.';

    return {
      type: 'body',
      content: paragraph
    };
  }

  generateProjectsParagraph(request) {
    const { personalization } = request;
    const { specificProjects } = personalization;

    let paragraph = 'I would like to highlight a few relevant projects:';

    specificProjects.forEach((project, index) => {
      paragraph += ` ${project}.`;
    });

    paragraph += ' These experiences demonstrate my ability to deliver results in environments similar to yours.';

    return {
      type: 'body',
      content: paragraph
    };
  }

  generateClosing(request) {
    const { userProfile, jobInfo } = request;
    const { title, company } = jobInfo;

    let closing = `I am excited about the opportunity to bring my skills and experience to the ${title} position at ${company}.`;

    closing += ` I would welcome the chance to discuss how my background in ${userProfile.keySkills.slice(0, 2).join(' and ')} can benefit your team.`;

    closing += ' Thank you for considering my application. I look forward to hearing from you soon.';

    return {
      type: 'closing',
      content: closing
    };
  }

  generateSignOff(request) {
    const { userProfile } = request;

    return {
      type: 'signoff',
      content: `
Sincerely,
${userProfile.name}
${userProfile.email}
${userProfile.phone}
${userProfile.linkedin ? userProfile.linkedin : ''}
      `.trim()
    };
  }

  applyToneToSections(sections, tone) {
    const toneTemplate = this.toneTemplates[tone];
    
    return sections.map(section => ({
      ...section,
      content: this.applyToneTransformation(section.content, tone),
      tone
    }));
  }

  applyToneTransformation(content, tone) {
    switch (tone) {
      case 'concise':
        return this.makeConcise(content);
      case 'technical':
        return this.enhanceTechnicalLanguage(content);
      case 'leadership':
        return this.enhanceLeadershipLanguage(content);
      case 'startup':
        return this.enhanceStartupLanguage(content);
      case 'professional':
      default:
        return this.enhanceProfessionalLanguage(content);
    }
  }

  combineSections(sections, request) {
    const { length } = request;
    
    let combined = sections.map(section => section.content).join('\n\n');
    
    // Adjust length if needed
    if (length === 'short' && combined.length > 400) {
      combined = this.shortenContent(combined, 400);
    } else if (length === 'long' && combined.length < 600) {
      combined = this.expandContent(combined, 600);
    }

    return combined;
  }

  runHallucinationGuard(userProfile, jobInfo, content) {
    const unsupportedClaims = [];
    const fabricatedMetrics = [];
    const falseConnections = [];

    // Check for unsupported claims
    const claims = this.extractClaims(content);
    claims.forEach(claim => {
      if (!this.isClaimSupported(claim, userProfile, jobInfo)) {
        unsupportedClaims.push({
          claim: claim.text,
          location: claim.location,
          confidence: 0.8,
          reason: 'Claim not supported by user profile or job information'
        });
      }
    });

    // Check for fabricated metrics
    const metrics = this.extractMetrics(content);
    metrics.forEach(metric => {
      if (!this.isMetricSupported(metric, userProfile)) {
        fabricatedMetrics.push({
          metric: metric.text,
          location: metric.location,
          suggestedFix: 'Remove or replace with supported metric'
        });
      }
    });

    // Check for false connections
    const connections = this.extractConnections(content);
    connections.forEach(connection => {
      if (!this.isConnectionSupported(connection, userProfile, jobInfo)) {
        falseConnections.push({
          connection: connection.text,
          location: connection.location,
          reason: 'Connection not supported by available information'
        });
      }
    });

    return {
      unsupportedClaims,
      fabricatedMetrics,
      falseConnections
    };
  }

  calculateComplianceScore(content, hallucinationReport) {
    let score = 100;

    // Deduct for hallucinations
    score -= hallucinationReport.unsupportedClaims.length * 15;
    score -= hallucinationReport.fabricatedMetrics.length * 10;
    score -= hallucinationReport.falseConnections.length * 5;

    // Check for professional tone
    if (!this.hasProfessionalTone(content)) {
      score -= 10;
    }

    // Check for appropriate length
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 150 || wordCount > 400) {
      score -= 5;
    }

    return Math.max(0, score);
  }

  generateMetadata(request, content) {
    return {
      generatedAt: new Date().toISOString(),
      tone: request.tone,
      length: request.length,
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      paragraphCount: content.split('\n\n').length,
      personalization: {
        referralSource: request.personalization?.referralSource,
        companyConnection: request.personalization?.companyConnection,
        specificProjects: request.personalization?.specificProjects?.length || 0
      }
    };
  }

  generateSafetyChecks(hallucinationReport) {
    const checks = [];

    if (hallucinationReport.unsupportedClaims.length > 0) {
      checks.push({
        type: 'unsupported_claims',
        severity: 'critical',
        message: `${hallucinationReport.unsupportedClaims.length} unsupported claims detected`,
        action: 'review_claims'
      });
    }

    if (hallucinationReport.fabricatedMetrics.length > 0) {
      checks.push({
        type: 'fabricated_metrics',
        severity: 'critical',
        message: `${hallucinationReport.fabricatedMetrics.length} potentially fabricated metrics`,
        action: 'verify_metrics'
      });
    }

    if (hallucinationReport.falseConnections.length > 0) {
      checks.push({
        type: 'false_connections',
        severity: 'warning',
        message: `${hallucinationReport.falseConnections.length} potentially false connections`,
        action: 'review_connections'
      });
    }

    return checks;
  }

  generateWarnings(hallucinationReport) {
    const warnings = [];

    if (hallucinationReport.unsupportedClaims.length > 0) {
      warnings.push({
        type: 'unsupported_claims',
        message: 'Some claims may not be supported by your profile',
        count: hallucinationReport.unsupportedClaims.length
      });
    }

    return warnings;
  }

  calculateConfidence(hallucinationReport, complianceScore) {
    let confidence = 1.0;

    // Reduce confidence based on hallucinations
    confidence -= hallucinationReport.unsupportedClaims.length * 0.3;
    confidence -= hallucinationReport.fabricatedMetrics.length * 0.2;
    confidence -= hallucinationReport.falseConnections.length * 0.1;

    // Consider compliance score
    if (complianceScore < 80) {
      confidence -= 0.2;
    } else if (complianceScore < 90) {
      confidence -= 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  generateRecommendations(hallucinationReport) {
    const recommendations = [];

    hallucinationReport.unsupportedClaims.forEach(claim => {
      recommendations.push({
        type: 'claim_review',
        severity: 'high',
        suggestion: `Review claim: "${claim.claim}" - ensure it's supported by your experience`,
        location: claim.location
      });
    });

    hallucinationReport.fabricatedMetrics.forEach(metric => {
      recommendations.push({
        type: 'metric_verification',
        severity: 'high',
        suggestion: `Verify metric: "${metric.metric}" or remove if unsupported`,
        location: metric.location
      });
    });

    return recommendations;
  }

  // Helper methods
  initializeToneTemplates() {
    return {
      concise: {
        characteristics: ['brief', 'direct', 'impact-focused'],
        maxLength: 300
      },
      technical: {
        characteristics: ['precise', 'detailed', 'technology-focused'],
        keyTerms: ['technical', 'technology', 'system', 'architecture', 'framework']
      },
      leadership: {
        characteristics: ['strategic', 'team-focused', 'impact-oriented'],
        keyTerms: ['leadership', 'strategy', 'team', 'mentor', 'guide', 'influence']
      },
      startup: {
        characteristics: ['dynamic', 'growth-focused', 'hands-on'],
        keyTerms: ['startup', 'growth', 'scale', 'innovative', 'agile', 'fast-paced']
      },
      professional: {
        characteristics: ['formal', 'structured', 'polished'],
        keyTerms: ['professional', 'experienced', 'skilled', 'qualified', 'dedicated']
      }
    };
  }

  initializeHallucinationPatterns() {
    return [
      {
        pattern: /\b(\d+)%\s+(?:increase|growth|improvement|reduction)\b/gi,
        type: 'metric',
        risk: 'high'
      },
      {
        pattern: /\b(led|managed|directed)\s+(?:a\s+)?(?:team\s+)?(?:of\s+)?(\d+)\s+/gi,
        type: 'team_size',
        risk: 'medium'
      },
      {
        pattern: /\b(\d+)\s+(?:years?\s+)?(?:of\s+)?experience\s+in\s+(.+?)\b/gi,
        type: 'experience_claim',
        risk: 'medium'
      }
    ];
  }

  initializeSectionTemplates() {
    return {
      salutation: 'Dear {hiring_manager},',
      opening: 'I am writing to express my interest in the {position} at {company}.',
      body_skills: 'In my role as {current_title}, I have developed expertise in {skills}.',
      body_achievements: 'Throughout my career, I have {achievements}.',
      body_fit: 'I am drawn to {company} because of {reason}.',
      closing: 'I look forward to discussing how I can contribute to your team.',
      signoff: 'Sincerely,\n{name}\n{contact}'
    };
  }

  makeConcise(content) {
    // Remove filler words
    const fillerWords = /\b(?:very|really|quite|rather|extremely|incredibly)\s+/gi;
    let concise = content.replace(fillerWords, '');

    // Remove redundant phrases
    const redundantPhrases = /\b(?:in order to|for the purpose of|due to the fact that)\s+/gi;
    concise = concise.replace(redundantPhrases, 'to ');

    // Shorten sentences
    const sentences = concise.split('. ');
    concise = sentences.map(sentence => {
      if (sentence.length > 50) {
        return sentence.split(', ').slice(0, 2).join(', ') + '.';
      }
      return sentence + '.';
    }).join(' ');

    return concise;
  }

  enhanceTechnicalLanguage(content) {
    const enhancements = {
      'good': 'robust',
      'fast': 'high-performance',
      'big': 'scalable',
      'new': 'innovative',
      'helped': 'enabled',
      'made': 'engineered',
      'used': 'implemented'
    };

    let enhanced = content;
    Object.entries(enhancements).forEach(([old, newWord]) => {
      const regex = new RegExp(`\\b${old}\\b`, 'gi');
      enhanced = enhanced.replace(regex, newWord);
    });

    return enhanced;
  }

  enhanceLeadershipLanguage(content) {
    const leadershipTerms = [
      'led', 'managed', 'directed', 'oversaw', 'coordinated', 'mentored',
      'strategic', 'initiative', 'ownership', 'accountability', 'vision'
    ];

    let enhanced = content;
    leadershipTerms.forEach(term => {
      if (!content.toLowerCase().includes(term)) {
        enhanced += ` Demonstrated ${term} capabilities.`;
      }
    });

    return enhanced;
  }

  enhanceStartupLanguage(content) {
    const startupTerms = [
      'fast-paced', 'agile', 'lean', 'pivot', 'growth', 'scaling',
      'mvp', 'iteration', 'disruptive', 'innovative', 'hands-on'
    ];

    let enhanced = content;
    startupTerms.forEach(term => {
      if (!content.toLowerCase().includes(term)) {
        enhanced += ` Thrived in ${term} environment.`;
      }
    });

    return enhanced;
  }

  enhanceProfessionalLanguage(content) {
    const professionalTerms = [
      'professional', 'experienced', 'skilled', 'qualified', 'dedicated',
      'committed', 'detail-oriented', 'results-driven', 'proactive'
    ];

    let enhanced = content;
    professionalTerms.forEach(term => {
      if (!content.toLowerCase().includes(term)) {
        enhanced += ` ${term} professional.`;
      }
    });

    return enhanced;
  }

  shortenContent(content, maxLength) {
    if (content.length <= maxLength) return content;
    
    const sentences = content.split('. ');
    let shortened = '';
    
    for (const sentence of sentences) {
      if (shortened.length + sentence.length + 2 <= maxLength) {
        shortened += (shortened ? '. ' : '') + sentence;
      } else {
        break;
      }
    }
    
    return shortened + '.';
  }

  expandContent(content, minLength) {
    if (content.length >= minLength) return content;
    
    const sentences = content.split('. ');
    const expanded = [...sentences];
    
    // Add relevant expansion sentences
    if (content.includes('skills')) {
      expanded.push('These skills have been honed through extensive hands-on experience and continuous learning.');
    }
    
    if (content.includes('experience')) {
      expanded.push('My experience spans multiple industries and project types, providing me with a versatile perspective.');
    }
    
    return expanded.join('. ');
  }

  extractClaims(content) {
    const claims = [];
    
    // Extract experience claims
    const experienceClaims = content.match(/\b(\d+)\s+(?:years?\s+)?(?:of\s+)?experience\s+in\s+(.+?)(?:\.|$)/gi);
    if (experienceClaims) {
      experienceClaims.forEach((claim, index) => {
        claims.push({
          text: claim.trim(),
          location: `experience_claim_${index}`,
          type: 'experience'
        });
      });
    }
    
    // Extract skill claims
    const skillClaims = content.match(/\b(?:expert|proficient|skilled|experienced)\s+in\s+(.+?)(?:\.|$)/gi);
    if (skillClaims) {
      skillClaims.forEach((claim, index) => {
        claims.push({
          text: claim.trim(),
          location: `skill_claim_${index}`,
          type: 'skill'
        });
      });
    }
    
    return claims;
  }

  extractMetrics(content) {
    const metrics = [];
    
    // Extract percentage metrics
    const percentages = content.match(/\b(\d+)%\s+(?:increase|growth|improvement|reduction)/gi);
    if (percentages) {
      percentages.forEach((metric, index) => {
        metrics.push({
          text: metric,
          location: `percentage_metric_${index}`,
          type: 'percentage'
        });
      });
    }
    
    // Extract team size metrics
    const teamSizes = content.match(/\b(led|managed|directed)\s+(?:a\s+)?(?:team\s+)?(?:of\s+)?(\d+)\s+/gi);
    if (teamSizes) {
      teamSizes.forEach((metric, index) => {
        metrics.push({
          text: metric,
          location: `team_size_metric_${index}`,
          type: 'team_size'
        });
      });
    }
    
    return metrics;
  }

  extractConnections(content) {
    const connections = [];
    
    // Extract company connections
    const companyConnections = content.match(/\b(?:followed|tracked|admired)\s+(.+?)\s+(?:for|at|in)\s+(.+?)(?:\.|$)/gi);
    if (companyConnections) {
      companyConnections.forEach((connection, index) => {
        connections.push({
          text: connection.trim(),
          location: `company_connection_${index}`,
          type: 'company'
        });
      });
    }
    
    return connections;
  }

  isClaimSupported(claim, userProfile, jobInfo) {
    const claimText = claim.text.toLowerCase();
    
    // Check against user profile
    const profileText = JSON.stringify(userProfile).toLowerCase();
    if (profileText.includes(claimText.substring(0, 20))) {
      return true;
    }
    
    // Check against job info
    const jobText = JSON.stringify(jobInfo).toLowerCase();
    if (jobText.includes(claimText.substring(0, 20))) {
      return true;
    }
    
    return false;
  }

  isMetricSupported(metric, userProfile) {
    // In a real implementation, this would check against actual user data
    // For now, be conservative and flag most metrics
    return false;
  }

  isConnectionSupported(connection, userProfile, jobInfo) {
    // Check if connection is supported by available information
    return false;
  }

  hasProfessionalTone(content) {
    const unprofessionalPatterns = [
      /\b(?:hey|hi|what's up|gonna|wanna|kinda|sorta)\b/gi,
      /\b(?:awesome|cool|great|amazing|fantastic)\s+(?:stuff|things)\b/gi
    ];
    
    return !unprofessionalPatterns.some(pattern => pattern.test(content));
  }
}

// Global cover letter generator instance
export const coverLetterGenerator = new CoverLetterGenerator();
