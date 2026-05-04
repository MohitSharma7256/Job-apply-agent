import { z } from 'zod';
import { logger } from '../../shared/logger.js';
import { contextualEventEmitter } from '../../shared/context.js';

// Resume Tailoring Schemas
export const ResumeSectionSchema = z.object({
  id: z.string(),
  type: z.enum(['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'other']),
  title: z.string(),
  content: z.string(),
  locked: z.boolean().default(false),
  originalContent: z.string().optional(),
  changes: z.array(z.object({
    type: z.enum(['add', 'remove', 'modify', 'reorder']),
    position: z.number(),
    original: z.string().optional(),
    new: z.string().optional(),
    reason: z.string()
  })).default([])
});

export const ResumeTailorRequestSchema = z.object({
  masterResume: z.object({
    sections: z.array(ResumeSectionSchema),
    metadata: z.object({
      totalYearsExperience: z.number(),
      currentTitle: z.string(),
      targetIndustries: z.array(z.string()),
      skills: z.array(z.string()),
      education: z.array(z.object({
        degree: z.string(),
        school: z.string(),
        year: z.number()
      }))
    })
  }),
  jobDescription: z.string(),
  jobRequirements: z.array(z.string()),
  jobSkills: z.array(z.string()),
  targetTone: z.enum(['professional', 'technical', 'leadership', 'startup', 'concise']).default('professional'),
  rewriteIntensity: z.enum(['low', 'medium', 'high']).default('medium'),
  lockedSections: z.array(z.string()).default([]),
  bannedPhrases: z.array(z.string()).default([]),
  preserveMetrics: z.boolean().default(true)
});

export const ATSViolationSchema = z.object({
  type: z.enum(['format', 'content', 'structure', 'keyword']),
  severity: z.enum(['critical', 'warning', 'info']),
  description: z.string(),
  location: z.string(),
  suggestion: z.string(),
  fixable: z.boolean()
});

export const TruthGuardReportSchema = z.object({
  fabricatedClaims: z.array(z.object({
    claim: z.string(),
    location: z.string(),
    confidence: z.number(),
    reason: z.string()
  })),
  unsupportedMetrics: z.array(z.object({
    metric: z.string(),
    location: z.string(),
    originalValue: z.string(),
    suggestedValue: z.string()
  })),
  exaggerations: z.array(z.object({
    original: z.string(),
    tailored: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    reason: z.string()
  }))
});

export class ResumeTailorEngine {
  constructor() {
    this.atsAntiPatterns = this.initializeATSAntiPatterns();
    this.truthGuardPatterns = this.initializeTruthGuardPatterns();
    this.toneTemplates = this.initializeToneTemplates();
  }

  async tailorResume(request) {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validatedRequest = ResumeTailorRequestSchema.parse(request);
      
      logger.info('Resume tailoring started', {
        sections: validatedRequest.masterResume.sections.length,
        tone: validatedRequest.targetTone,
        intensity: validatedRequest.rewriteIntensity
      });

      // Extract keywords from job description
      const jobKeywords = this.extractKeywords(validatedRequest.jobDescription, validatedRequest.jobSkills);
      
      // Analyze keyword gaps
      const keywordAnalysis = this.analyzeKeywordGaps(validatedRequest.masterResume, jobKeywords);
      
      // Tailor each section
      const tailoredSections = await this.tailorSections(
        validatedRequest.masterResume.sections,
        jobKeywords,
        validatedRequest
      );
      
      // Generate ATS compliance score
      const atsScore = this.calculateATSScore(tailoredSections);
      
      // Detect ATS violations
      const atsViolations = this.detectATSViolations(tailoredSections);
      
      // Run truth guard analysis
      const truthGuardReport = this.runTruthGuard(
        validatedRequest.masterResume.sections,
        tailoredSections
      );
      
      // Generate diff metadata
      const diffMetadata = this.generateDiffMetadata(
        validatedRequest.masterResume.sections,
        tailoredSections
      );

      const result = {
        tailoredResume: {
          sections: tailoredSections,
          metadata: {
            ...validatedRequest.masterResume.metadata,
            tailoredAt: new Date().toISOString(),
            targetJob: {
              keywords: jobKeywords,
              requirements: validatedRequest.jobRequirements
            }
          }
        },
        atsCompliance: {
          score: atsScore,
          violations: atsViolations,
          recommendations: this.generateATSRecommendations(atsViolations)
        },
        keywordAnalysis,
        truthGuardReport,
        diffMetadata,
        safetyChecks: this.generateSafetyChecks(truthGuardReport, atsViolations),
        warnings: this.generateWarnings(atsViolations, keywordAnalysis),
        confidence: this.calculateConfidence(truthGuardReport, atsScore),
        metadata: {
          processingTime: Date.now() - startTime,
          correlationId: contextualEventEmitter.getCorrelationId()
        }
      };

      // Emit completion event
      contextualEventEmitter.emitByType('resume.tailored', {
        atsScore: result.atsCompliance.score,
        confidence: result.confidence,
        violationsCount: atsViolations.length,
        fabricatedClaimsCount: truthGuardReport.fabricatedClaims.length
      });

      logger.info('Resume tailoring completed', {
        atsScore: result.atsCompliance.score,
        confidence: result.confidence,
        violationsCount: atsViolations.length,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logger.error('Resume tailoring failed', { error: error.message }, error);
      throw new Error(`Resume tailoring failed: ${error.message}`);
    }
  }

  extractKeywords(jobDescription, jobSkills) {
    const text = jobDescription.toLowerCase();
    const keywords = new Set();
    
    // Add explicit job skills
    jobSkills.forEach(skill => keywords.add(skill.toLowerCase()));
    
    // Extract technical terms using patterns
    const technicalPatterns = [
      /\b(javascript|typescript|python|java|react|node\.js|angular|vue\.js|docker|kubernetes|aws|azure|gcp|sql|nosql|mongodb|postgresql|redis|graphql|rest|api|microservices|devops|ci\/cd|agile|scrum|git|github|gitlab|webpack|babel|eslint|jest|cypress)\b/gi,
      /\b(\d+\+?\s*years?\s*(?:of\s*)?experience|senior|lead|principal|staff|manager|director|vp|c-level|cto|cio|cfo|ceo|coo|founder)\b/gi,
      /\b(bachelor|master|phd|mba|computer science|software engineering|information technology|data science|machine learning|artificial intelligence)\b/gi
    ];

    technicalPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.add(match.toLowerCase()));
      }
    });

    // Extract requirements and qualifications
    const requirementPatterns = [
      /(?:requirement|qualification|must have|should have|essential|desired):\s*([^.]+)/gi,
      /(?:looking for|seeking|need):\s*([^.]+)/gi
    ];

    requirementPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const words = match.toLowerCase().split(/\s+/);
          words.forEach(word => {
            if (word.length > 3 && !this.isStopWord(word)) {
              keywords.add(word);
            }
          });
        });
      }
    });

    return Array.from(keywords);
  }

  analyzeKeywordGaps(masterResume, jobKeywords) {
    const resumeKeywords = new Set();
    
    // Extract keywords from resume sections
    masterResume.sections.forEach(section => {
      const text = section.content.toLowerCase();
      jobKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          resumeKeywords.add(keyword);
        }
      });
    });

    const missing = jobKeywords.filter(keyword => !resumeKeywords.has(keyword));
    const weak = jobKeywords.filter(keyword => {
      const text = masterResume.sections.map(s => s.content.toLowerCase()).join(' ');
      const occurrences = (text.match(new RegExp(keyword, 'g')) || []).length;
      return occurrences === 1; // Only mentioned once
    });
    const strong = jobKeywords.filter(keyword => {
      const text = masterResume.sections.map(s => s.content.toLowerCase()).join(' ');
      const occurrences = (text.match(new RegExp(keyword, 'g')) || []).length;
      return occurrences > 1;
    });

    return {
      total: jobKeywords.length,
      covered: resumeKeywords.size,
      missing: missing.map(keyword => ({
        keyword,
        suggestion: this.getKeywordSuggestion(keyword, masterResume)
      })),
      weak: weak.map(keyword => ({
        keyword,
        occurrences: 1,
        suggestion: `Consider emphasizing "${keyword}" more prominently`
      })),
      strong: strong.map(keyword => ({
        keyword,
        occurrences: (masterResume.sections.map(s => s.content.toLowerCase()).join(' ').match(new RegExp(keyword, 'g')) || []).length
      })),
      coveragePercentage: Math.round((resumeKeywords.size / jobKeywords.length) * 100)
    };
  }

  async tailorSections(sections, jobKeywords, request) {
    const tailoredSections = [];

    for (const section of sections) {
      if (request.lockedSections.includes(section.id)) {
        // Don't modify locked sections
        tailoredSections.push({
          ...section,
          locked: true,
          changes: []
        });
        continue;
      }

      const tailoredSection = await this.tailorSection(
        section,
        jobKeywords,
        request
      );
      tailoredSections.push(tailoredSection);
    }

    return tailoredSections;
  }

  async tailorSection(section, jobKeywords, request) {
    const originalContent = section.content;
    let tailoredContent = originalContent;
    const changes = [];

    // Apply tone transformation
    if (request.targetTone !== 'professional') {
      const toneResult = this.applyToneTransformation(
        tailoredContent,
        request.targetTone,
        request.rewriteIntensity
      );
      tailoredContent = toneResult.content;
      changes.push(...toneResult.changes);
    }

    // Enhance with job keywords
    const keywordResult = this.enhanceWithKeywords(
      tailoredContent,
      jobKeywords,
      request.rewriteIntensity
    );
    tailoredContent = keywordResult.content;
    changes.push(...keywordResult.changes);

    // Remove banned phrases
    const bannedResult = this.removeBannedPhrases(
      tailoredContent,
      request.bannedPhrases
    );
    tailoredContent = bannedResult.content;
    changes.push(...bannedResult.changes);

    // Preserve metrics if requested
    if (request.preserveMetrics) {
      const metricsResult = this.preserveOriginalMetrics(
        originalContent,
        tailoredContent
      );
      tailoredContent = metricsResult.content;
      changes.push(...metricsResult.changes);
    }

    return {
      ...section,
      content: tailoredContent,
      originalContent,
      changes,
      locked: false
    };
  }

  applyToneTransformation(content, targetTone, intensity) {
    const toneTemplate = this.toneTemplates[targetTone];
    const changes = [];
    let transformedContent = content;

    // Apply tone-specific transformations
    switch (targetTone) {
      case 'concise':
        transformedContent = this.makeConcise(content, intensity);
        changes.push({
          type: 'modify',
          position: 0,
          reason: 'Applied concise tone transformation'
        });
        break;
      
      case 'technical':
        transformedContent = this.enhanceTechnicalLanguage(content, intensity);
        changes.push({
          type: 'modify',
          position: 0,
          reason: 'Enhanced technical language'
        });
        break;
      
      case 'leadership':
        transformedContent = this.enhanceLeadershipLanguage(content, intensity);
        changes.push({
          type: 'modify',
          position: 0,
          reason: 'Enhanced leadership language'
        });
        break;
      
      case 'startup':
        transformedContent = this.enhanceStartupLanguage(content, intensity);
        changes.push({
          type: 'modify',
          position: 0,
          reason: 'Enhanced startup-focused language'
        });
        break;
    }

    return {
      content: transformedContent,
      changes
    };
  }

  enhanceWithKeywords(content, jobKeywords, intensity) {
    const changes = [];
    let enhancedContent = content;

    // Find opportunities to add missing keywords naturally
    jobKeywords.forEach(keyword => {
      if (!content.toLowerCase().includes(keyword.toLowerCase())) {
        const insertionPoint = this.findKeywordInsertionPoint(content, keyword, intensity);
        if (insertionPoint) {
          enhancedContent = this.insertKeyword(enhancedContent, keyword, insertionPoint);
          changes.push({
            type: 'add',
            position: insertionPoint,
            new: keyword,
            reason: `Added missing keyword: ${keyword}`
          });
        }
      }
    });

    return {
      content: enhancedContent,
      changes
    };
  }

  removeBannedPhrases(content, bannedPhrases) {
    const changes = [];
    let cleanedContent = content;

    bannedPhrases.forEach(phrase => {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const originalContent = cleanedContent;
      cleanedContent = cleanedContent.replace(regex, '');
      
      if (originalContent !== cleanedContent) {
        changes.push({
          type: 'remove',
          position: 0,
          original: phrase,
          reason: `Removed banned phrase: ${phrase}`
        });
      }
    });

    return {
      content: cleanedContent,
      changes
    };
  }

  preserveOriginalMetrics(originalContent, tailoredContent) {
    const changes = [];
    let preservedContent = tailoredContent;

    // Extract metrics from original content
    const originalMetrics = this.extractMetrics(originalContent);
    const tailoredMetrics = this.extractMetrics(tailoredContent);

    // Replace any modified metrics with original values
    Object.keys(originalMetrics).forEach(metric => {
      if (tailoredMetrics[metric] && originalMetrics[metric] !== tailoredMetrics[metric]) {
        const regex = new RegExp(tailoredMetrics[metric], 'g');
        preservedContent = preservedContent.replace(regex, originalMetrics[metric]);
        
        changes.push({
          type: 'modify',
          position: 0,
          original: tailoredMetrics[metric],
          new: originalMetrics[metric],
          reason: `Preserved original metric: ${metric}`
        });
      }
    });

    return {
      content: preservedContent,
      changes
    };
  }

  calculateATSScore(sections) {
    let score = 100;
    let deductions = 0;

    sections.forEach(section => {
      // Check for ATS-friendly formatting
      if (this.hasComplexFormatting(section.content)) {
        deductions += 5;
      }

      // Check for keyword optimization
      if (this.hasLowKeywordDensity(section.content)) {
        deductions += 3;
      }

      // Check for section structure
      if (!this.hasProperSectionStructure(section)) {
        deductions += 2;
      }
    });

    return Math.max(0, score - deductions);
  }

  detectATSViolations(sections) {
    const violations = [];

    sections.forEach(section => {
      // Check for common ATS anti-patterns
      this.atsAntiPatterns.forEach(pattern => {
        const matches = section.content.match(pattern.regex);
        if (matches) {
          violations.push({
            type: pattern.type,
            severity: pattern.severity,
            description: pattern.description,
            location: `${section.type}: ${section.title}`,
            suggestion: pattern.suggestion,
            fixable: pattern.fixable
          });
        }
      });
    });

    return violations;
  }

  runTruthGuard(originalSections, tailoredSections) {
    const fabricatedClaims = [];
    const unsupportedMetrics = [];
    const exaggerations = [];

    // Compare original and tailored sections
    originalSections.forEach((original, index) => {
      const tailored = tailoredSections[index];
      
      if (original.id !== tailored.id) return;

      // Check for fabricated claims
      const newClaims = this.detectFabricatedClaims(original.content, tailored.content);
      fabricatedClaims.push(...newClaims);

      // Check for unsupported metrics
      const newMetrics = this.detectUnsupportedMetrics(original.content, tailored.content);
      unsupportedMetrics.push(...newMetrics);

      // Check for exaggerations
      const newExaggerations = this.detectExaggerations(original.content, tailored.content);
      exaggerations.push(...newExaggerations);
    });

    return {
      fabricatedClaims,
      unsupportedMetrics,
      exaggerations
    };
  }

  generateDiffMetadata(originalSections, tailoredSections) {
    const diff = {
      sections: [],
      summary: {
        totalChanges: 0,
        sectionsModified: 0,
        additions: 0,
        removals: 0,
        modifications: 0
      }
    };

    originalSections.forEach((original, index) => {
      const tailored = tailoredSections[index];
      
      if (original.id !== tailored.id) return;

      const sectionDiff = {
        sectionId: original.id,
        sectionType: original.type,
        sectionTitle: original.title,
        locked: tailored.locked,
        changes: tailored.changes,
        changeCount: tailored.changes.length,
        contentLength: {
          original: original.content.length,
          tailored: tailored.content.length,
          difference: tailored.content.length - original.content.length
        }
      };

      diff.sections.push(sectionDiff);
      
      // Update summary
      if (sectionDiff.changeCount > 0) {
        diff.summary.sectionsModified++;
        diff.summary.totalChanges += sectionDiff.changeCount;
        
        sectionDiff.changes.forEach(change => {
          switch (change.type) {
            case 'add': diff.summary.additions++; break;
            case 'remove': diff.summary.removals++; break;
            case 'modify': diff.summary.modifications++; break;
          }
        });
      }
    });

    return diff;
  }

  generateSafetyChecks(truthGuardReport, atsViolations) {
    const checks = [];

    // Truth guard checks
    if (truthGuardReport.fabricatedClaims.length > 0) {
      checks.push({
        type: 'fabricated_claims',
        severity: 'critical',
        message: `${truthGuardReport.fabricatedClaims.length} potentially fabricated claims detected`,
        action: 'review_claims'
      });
    }

    if (truthGuardReport.unsupportedMetrics.length > 0) {
      checks.push({
        type: 'unsupported_metrics',
        severity: 'warning',
        message: `${truthGuardReport.unsupportedMetrics.length} metrics may be unsupported`,
        action: 'verify_metrics'
      });
    }

    // ATS compliance checks
    const criticalViolations = atsViolations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      checks.push({
        type: 'ats_critical_violations',
        severity: 'critical',
        message: `${criticalViolations.length} critical ATS violations detected`,
        action: 'fix_formatting'
      });
    }

    return checks;
  }

  generateWarnings(atsViolations, keywordAnalysis) {
    const warnings = [];

    // ATS warnings
    const warningViolations = atsViolations.filter(v => v.severity === 'warning');
    if (warningViolations.length > 0) {
      warnings.push({
        type: 'ats_warnings',
        message: `${warningViolations.length} ATS formatting warnings`,
        count: warningViolations.length
      });
    }

    // Keyword warnings
    if (keywordAnalysis.coveragePercentage < 70) {
      warnings.push({
        type: 'low_keyword_coverage',
        message: `Only ${keywordAnalysis.coveragePercentage}% of job keywords covered`,
        coverage: keywordAnalysis.coveragePercentage
      });
    }

    return warnings;
  }

  calculateConfidence(truthGuardReport, atsScore) {
    let confidence = 1.0;

    // Reduce confidence based on truth guard findings
    confidence -= truthGuardReport.fabricatedClaims.length * 0.2;
    confidence -= truthGuardReport.unsupportedMetrics.length * 0.1;
    confidence -= truthGuardReport.exaggerations.filter(e => e.severity === 'high').length * 0.15;

    // Reduce confidence based on ATS score
    if (atsScore < 80) {
      confidence -= 0.2;
    } else if (atsScore < 90) {
      confidence -= 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  // Helper methods
  initializeATSAntiPatterns() {
    return [
      {
        type: 'format',
        regex: /\|.*\|/g,
        severity: 'critical',
        description: 'Complex table formatting detected',
        suggestion: 'Use simple bullet points instead of tables',
        fixable: true
      },
      {
        type: 'format',
        regex: /[^\x00-\x7F]/g,
        severity: 'warning',
        description: 'Non-ASCII characters detected',
        suggestion: 'Use standard ASCII characters',
        fixable: true
      },
      {
        type: 'content',
        regex: /\b(\d+|\w+)\s*\n\s*\1\b/gi,
        severity: 'warning',
        description: 'Duplicate content detected',
        suggestion: 'Remove duplicate lines',
        fixable: true
      },
      {
        type: 'structure',
        regex: /^(?!.{1,100}$)/gm,
        severity: 'info',
        description: 'Very long lines detected',
        suggestion: 'Keep lines under 100 characters',
        fixable: true
      }
    ];
  }

  initializeTruthGuardPatterns() {
    return [
      {
        pattern: /\b(\d+)%\s+(?:increase|growth|improvement)/gi,
        type: 'metric',
        risk: 'high'
      },
      {
        pattern: /\b(\d+)\s+(?:million|billion|thousand)\s+(?:dollars?|users?|customers?)/gi,
        type: 'metric',
        risk: 'medium'
      },
      {
        pattern: /\b(led|managed|directed|oversaw)\s+(?:a\s+)?(?:team\s+)?(?:of\s+)?(\d+)\s+/gi,
        type: 'team_size',
        risk: 'medium'
      }
    ];
  }

  initializeToneTemplates() {
    return {
      professional: {
        characteristics: ['formal', 'structured', 'achievement-focused'],
        avoid: ['casual language', 'exaggeration', 'personal anecdotes']
      },
      technical: {
        characteristics: ['precise', 'detailed', 'technology-focused'],
        avoid: ['vague descriptions', 'business metrics without technical context']
      },
      leadership: {
        characteristics: ['strategic', 'team-focused', 'impact-oriented'],
        avoid: ['technical details without business context', 'individual contributions']
      },
      startup: {
        characteristics: ['dynamic', 'growth-focused', 'hands-on'],
        avoid: ['corporate language', 'rigid structure descriptions']
      },
      concise: {
        characteristics: ['brief', 'impact-focused', 'quantified'],
        avoid: ['long descriptions', 'unnecessary details']
      }
    };
  }

  isStopWord(word) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'
    ]);
    return stopWords.has(word);
  }

  getKeywordSuggestion(keyword, masterResume) {
    // Find the best section to add this keyword
    const sectionSuggestions = {
      'summary': 'Add to professional summary',
      'experience': 'Include in relevant experience description',
      'skills': 'Add to skills section'
    };

    // Simple logic - in production, this would be more sophisticated
    return sectionSuggestions.skills;
  }

  makeConcise(content, intensity) {
    // Remove filler words and redundant phrases
    const fillerWords = /\b(?:very|really|quite|rather|extremely|incredibly|amazingly|surprisingly)\s+/gi;
    let concise = content.replace(fillerWords, '');

    // Remove redundant phrases
    const redundantPhrases = /\b(?:in order to|for the purpose of|due to the fact that|in the event that)\s+/gi;
    concise = concise.replace(redundantPhrases, 'to ');

    return concise;
  }

  enhanceTechnicalLanguage(content, intensity) {
    // Enhance with more technical terms
    const enhancements = {
      'good': 'robust',
      'fast': 'high-performance',
      'big': 'scalable',
      'new': 'innovative',
      'simple': 'streamlined'
    };

    let enhanced = content;
    Object.entries(enhancements).forEach(([old, newWord]) => {
      const regex = new RegExp(`\\b${old}\\b`, 'gi');
      enhanced = enhanced.replace(regex, newWord);
    });

    return enhanced;
  }

  enhanceLeadershipLanguage(content, intensity) {
    // Add leadership-focused language
    const leadershipTerms = [
      'led', 'managed', 'directed', 'oversaw', 'coordinated', 'mentored',
      'strategic', 'initiative', 'ownership', 'accountability', 'vision'
    ];

    let enhanced = content;
    leadershipTerms.forEach(term => {
      if (!content.toLowerCase().includes(term)) {
        // In production, this would be more sophisticated
        enhanced += ` Demonstrated ${term} in project execution.`;
      }
    });

    return enhanced;
  }

  enhanceStartupLanguage(content, intensity) {
    // Add startup-focused language
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

  findKeywordInsertionPoint(content, keyword, intensity) {
    // Simple logic - find the end of the most relevant sentence
    const sentences = content.split('. ');
    for (let i = 0; i < sentences.length - 1; i++) {
      if (sentences[i].length > 50) {
        return sentences.slice(0, i + 1).join('. ').length + 2;
      }
    }
    return content.length;
  }

  insertKeyword(content, keyword, position) {
    const before = content.substring(0, position);
    const after = content.substring(position);
    return `${before} utilizing ${keyword} technologies${after}`;
  }

  extractMetrics(content) {
    const metrics = {};
    
    // Extract percentages
    const percentages = content.match(/\b(\d+)%\b/g);
    if (percentages) {
      percentages.forEach(p => {
        const value = p.replace('%', '');
        metrics[`percentage_${value}`] = p;
      });
    }

    // Extract monetary values
    const money = content.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
    if (money) {
      money.forEach(m => {
        metrics[`money_${m.replace(/\$\s*/, '')}`] = m;
      });
    }

    // Extract team sizes
    const teamSizes = content.match(/\b(\d+)\s+(?:people|person|team|member)s?\b/gi);
    if (teamSizes) {
      teamSizes.forEach(ts => {
        const size = ts.match(/\d+/)[0];
        metrics[`team_size_${size}`] = ts;
      });
    }

    return metrics;
  }

  hasComplexFormatting(content) {
    return /\|.*\|/.test(content) || /\t/.test(content);
  }

  hasLowKeywordDensity(content) {
    const words = content.split(/\s+/).length;
    const keywords = content.match(/\b(react|node|python|java|javascript|typescript|aws|docker|kubernetes)\b/gi);
    return !keywords || keywords.length / words < 0.02;
  }

  hasProperSectionStructure(section) {
    return section.title && section.content && section.type;
  }

  detectFabricatedClaims(original, tailored) {
    const claims = [];
    
    // Look for new claims that weren't in original
    const originalMetrics = this.extractMetrics(original);
    const tailoredMetrics = this.extractMetrics(tailored);
    
    Object.keys(tailoredMetrics).forEach(key => {
      if (!originalMetrics[key]) {
        claims.push({
          claim: tailoredMetrics[key],
          location: 'content',
          confidence: 0.7,
          reason: 'New metric appears in tailored version'
        });
      }
    });

    return claims;
  }

  detectUnsupportedMetrics(original, tailored) {
    const metrics = [];
    
    // Compare metrics between original and tailored
    const originalValues = this.extractMetrics(original);
    const tailoredValues = this.extractMetrics(tailored);
    
    Object.keys(tailoredValues).forEach(key => {
      if (originalValues[key] && originalValues[key] !== tailoredValues[key]) {
        metrics.push({
          metric: key,
          location: 'content',
          originalValue: originalValues[key],
          suggestedValue: originalValues[key]
        });
      }
    });

    return metrics;
  }

  detectExaggerations(original, tailored) {
    const exaggerations = [];
    
    // Look for increased metrics
    const originalNumbers = original.match(/\b(\d+)\b/g) || [];
    const tailoredNumbers = tailored.match(/\b(\d+)\b/g) || [];
    
    // Simple comparison - in production would be more sophisticated
    if (tailoredNumbers.length > originalNumbers.length) {
      exaggerations.push({
        original: original,
        tailored: tailored,
        severity: 'medium',
        reason: 'Additional numbers detected in tailored version'
      });
    }

    return exaggerations;
  }

  generateATSRecommendations(violations) {
    const recommendations = [];
    
    violations.forEach(violation => {
      if (violation.fixable) {
        recommendations.push({
          type: violation.type,
          severity: violation.severity,
          suggestion: violation.suggestion,
          location: violation.location
        });
      }
    });

    return recommendations;
  }
}

// Global resume tailor instance
export const resumeTailorEngine = new ResumeTailorEngine();
