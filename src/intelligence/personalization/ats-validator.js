import { z } from 'zod';
import { logger } from '../../shared/logger.js';
import { contextualEventEmitter } from '../../shared/context.js';

// ATS Validator Schemas
export const ATSValidationRequestSchema = z.object({
  content: z.string(),
  contentType: z.enum(['resume', 'cover_letter', 'both']),
  jobKeywords: z.array(z.string()).default([]),
  strictMode: z.boolean().default(false),
  autoFix: z.boolean().default(false)
});

export const ATSViolationSchema = z.object({
  id: z.string(),
  type: z.enum(['format', 'content', 'structure', 'keyword', 'length']),
  severity: z.enum(['critical', 'warning', 'info']),
  title: z.string(),
  description: z.string(),
  location: z.object({
    line: z.number(),
    column: z.number(),
    context: z.string()
  }),
  suggestion: z.string(),
  autoFixable: z.boolean(),
  fixedContent: z.string().optional()
});

export const ATSValidationResultSchema = z.object({
  score: z.number().min(0).max(100),
  violations: z.array(ATSViolationSchema),
  recommendations: z.array(z.object({
    type: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    description: z.string(),
    action: z.string()
  })),
  keywordAnalysis: z.object({
    total: z.number(),
    covered: z.number(),
    missing: z.array(z.string()),
    density: z.number()
  }),
  formattingScore: z.number().min(0).max(100),
  readabilityScore: z.number().min(0).max(100),
  fixedContent: z.string().optional(),
  metadata: z.object({
    wordCount: z.number(),
    characterCount: z.number(),
    lineCount: z.number(),
    paragraphCount: z.number(),
    processingTime: z.number()
  })
});

export class ATSValidator {
  constructor() {
    this.antiPatterns = this.initializeAntiPatterns();
    this.formattingRules = this.initializeFormattingRules();
    this.keywordRules = this.initializeKeywordRules();
    this.readabilityMetrics = this.initializeReadabilityMetrics();
  }

  async validateContent(request) {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validatedRequest = ATSValidationRequestSchema.parse(request);
      
      logger.info('ATS validation started', {
        contentType: validatedRequest.contentType,
        strictMode: validatedRequest.strictMode,
        autoFix: validatedRequest.autoFix,
        contentLength: validatedRequest.content.length
      });

      // Extract content metadata
      const contentMetadata = this.extractContentMetadata(validatedRequest.content);
      
      // Detect violations
      const violations = this.detectViolations(validatedRequest);
      
      // Analyze keywords
      const keywordAnalysis = this.analyzeKeywords(validatedRequest.content, validatedRequest.jobKeywords);
      
      // Calculate scores
      const formattingScore = this.calculateFormattingScore(validatedRequest.content, violations);
      const readabilityScore = this.calculateReadabilityScore(validatedRequest.content);
      const overallScore = this.calculateOverallScore(violations, formattingScore, readabilityScore, keywordAnalysis);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(violations, keywordAnalysis);
      
      // Auto-fix if requested
      let fixedContent;
      if (validatedRequest.autoFix) {
        fixedContent = this.autoFixContent(validatedRequest.content, violations);
      }

      const result = {
        score: overallScore,
        violations,
        recommendations,
        keywordAnalysis,
        formattingScore,
        readabilityScore,
        fixedContent,
        metadata: {
          ...contentMetadata,
          processingTime: Date.now() - startTime
        }
      };

      // Emit completion event
      contextualEventEmitter.emitByType('ats.validation.completed', {
        contentType: validatedRequest.contentType,
        score: overallScore,
        violationsCount: violations.length,
        autoFix: validatedRequest.autoFix
      });

      logger.info('ATS validation completed', {
        score: overallScore,
        violationsCount: violations.length,
        formattingScore,
        readabilityScore,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logger.error('ATS validation failed', { error: error.message }, error);
      throw new Error(`ATS validation failed: ${error.message}`);
    }
  }

  extractContentMetadata(content) {
    return {
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      lineCount: content.split('\n').length,
      paragraphCount: content.split('\n\n').filter(p => p.trim()).length
    };
  }

  detectViolations(request) {
    const violations = [];
    const { content, strictMode } = request;
    const lines = content.split('\n');

    // Check each anti-pattern
    this.antiPatterns.forEach(pattern => {
      const matches = this.findPatternMatches(content, pattern, lines);
      matches.forEach(match => {
        violations.push({
          id: `${pattern.type}_${match.line}_${match.column}`,
          type: pattern.type,
          severity: strictMode ? this.upgradeSeverity(pattern.severity) : pattern.severity,
          title: pattern.title,
          description: pattern.description,
          location: {
            line: match.line,
            column: match.column,
            context: match.context
          },
          suggestion: pattern.suggestion,
          autoFixable: pattern.autoFixable
        });
      });
    });

    // Check formatting rules
    const formattingViolations = this.checkFormattingRules(content, lines);
    violations.push(...formattingViolations);

    // Check structure rules
    const structureViolations = this.checkStructureRules(content, lines);
    violations.push(...structureViolations);

    // Check length rules
    const lengthViolations = this.checkLengthRules(content);
    violations.push(...lengthViolations);

    return violations.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  findPatternMatches(content, pattern, lines) {
    const matches = [];
    const regex = new RegExp(pattern.regex, pattern.flags || 'gi');
    let match;

    while ((match = regex.exec(content)) !== null) {
      const lineIndex = content.substring(0, match.index).split('\n').length - 1;
      const columnIndex = match.index - content.lastIndexOf('\n', match.index - 1) - 1;
      const context = lines[lineIndex] || '';

      matches.push({
        line: lineIndex + 1,
        column: columnIndex + 1,
        context: context.substring(Math.max(0, columnIndex - 20), columnIndex + 20),
        match: match[0]
      });
    }

    return matches;
  }

  checkFormattingRules(content, lines) {
    const violations = [];

    // Check for complex tables
    const tableMatches = content.match(/\|.*\|/g);
    if (tableMatches && tableMatches.length > 0) {
      tableMatches.forEach((table, index) => {
        const lineIndex = content.substring(0, content.indexOf(table)).split('\n').length - 1;
        violations.push({
          id: `format_table_${index}`,
          type: 'format',
          severity: 'critical',
          title: 'Complex Table Formatting',
          description: 'Tables can confuse ATS systems',
          location: {
            line: lineIndex + 1,
            column: 1,
            context: table.substring(0, 50)
          },
          suggestion: 'Convert tables to bullet points or simple text',
          autoFixable: true
        });
      });
    }

    // Check for non-ASCII characters
    const nonAsciiMatches = content.match(/[^\x00-\x7F]/g);
    if (nonAsciiMatches && nonAsciiMatches.length > 0) {
      violations.push({
        id: 'format_non_ascii',
        type: 'format',
        severity: 'warning',
        title: 'Non-ASCII Characters',
        description: 'Non-ASCII characters may not be processed correctly',
        location: {
          line: 1,
          column: 1,
          context: 'Multiple locations'
        },
        suggestion: 'Use standard ASCII characters',
        autoFixable: true
      });
    }

    // Check for very long lines
    lines.forEach((line, index) => {
      if (line.length > 100) {
        violations.push({
          id: `format_long_line_${index}`,
          type: 'format',
          severity: 'info',
          title: 'Very Long Line',
          description: 'Long lines may be truncated by ATS',
          location: {
            line: index + 1,
            column: 1,
            context: line.substring(0, 50) + '...'
          },
          suggestion: 'Break long lines into shorter ones',
          autoFixable: true
        });
      }
    });

    return violations;
  }

  checkStructureRules(content, lines) {
    const violations = [];

    // Check for proper section headers
    const sectionHeaders = lines.filter(line => 
      /^(Summary|Experience|Education|Skills|Projects|Certifications|Objective)/i.test(line.trim())
    );

    if (sectionHeaders.length === 0) {
      violations.push({
        id: 'structure_no_headers',
        type: 'structure',
        severity: 'critical',
        title: 'Missing Section Headers',
        description: 'ATS systems look for standard section headers',
        location: {
          line: 1,
          column: 1,
          context: 'No standard headers found'
        },
        suggestion: 'Add standard section headers (Summary, Experience, etc.)',
        autoFixable: false
      });
    }

    // Check for contact information
    const hasContactInfo = lines.some(line => 
      /\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/.test(line)
    );

    if (!hasContactInfo) {
      violations.push({
        id: 'structure_no_contact',
        type: 'structure',
        severity: 'warning',
        title: 'Missing Contact Information',
        description: 'Contact information should be clearly visible',
        location: {
          line: 1,
          column: 1,
          context: 'No phone or email found'
        },
        suggestion: 'Add phone number and email at the top',
        autoFixable: false
      });
    }

    // Check for proper date formatting
    const dateFormats = lines.filter(line => 
      /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(line)
    );

    const inconsistentDates = dateFormats.some(date => 
      !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date.trim()) &&
      !/^\d{1,2}-\d{1,2}-\d{4}$/.test(date.trim())
    );

    if (inconsistentDates) {
      violations.push({
        id: 'structure_inconsistent_dates',
        type: 'structure',
        severity: 'info',
        title: 'Inconsistent Date Formatting',
        description: 'Use consistent date format (MM/DD/YYYY)',
        location: {
          line: 1,
          column: 1,
          context: 'Multiple date formats detected'
        },
        suggestion: 'Standardize all dates to MM/DD/YYYY format',
        autoFixable: true
      });
    }

    return violations;
  }

  checkLengthRules(content) {
    const violations = [];
    const wordCount = content.split(/\s+/).length;

    // Check minimum length
    if (wordCount < 50) {
      violations.push({
        id: 'length_too_short',
        type: 'length',
        severity: 'critical',
        title: 'Content Too Short',
        description: 'Content should be at least 50 words for ATS processing',
        location: {
          line: 1,
          column: 1,
          context: `Word count: ${wordCount}`
        },
        suggestion: 'Add more detail to reach at least 50 words',
        autoFixable: false
      });
    }

    // Check maximum length
    if (wordCount > 1000) {
      violations.push({
        id: 'length_too_long',
        type: 'length',
        severity: 'warning',
        title: 'Content Too Long',
        description: 'Very long content may be truncated by ATS',
        location: {
          line: 1,
          column: 1,
          context: `Word count: ${wordCount}`
        },
        suggestion: 'Consider condensing to under 1000 words',
        autoFixable: false
      });
    }

    return violations;
  }

  analyzeKeywords(content, jobKeywords) {
    const contentLower = content.toLowerCase();
    const foundKeywords = new Set();

    jobKeywords.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        foundKeywords.add(keyword);
      }
    });

    const total = jobKeywords.length;
    const covered = foundKeywords.size;
    const missing = jobKeywords.filter(keyword => !foundKeywords.has(keyword));
    const density = total > 0 ? covered / total : 0;

    return {
      total,
      covered,
      missing,
      density: Math.round(density * 100)
    };
  }

  calculateFormattingScore(content, violations) {
    let score = 100;

    // Deduct points for formatting violations
    const formatViolations = violations.filter(v => v.type === 'format');
    score -= formatViolations.filter(v => v.severity === 'critical').length * 20;
    score -= formatViolations.filter(v => v.severity === 'warning').length * 10;
    score -= formatViolations.filter(v => v.severity === 'info').length * 5;

    // Check for ATS-friendly formatting
    if (this.hasATSFriendlyFormatting(content)) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  calculateReadabilityScore(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/);
    const syllables = this.countSyllables(content);

    // Flesch Reading Ease Score
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

    // Convert to 0-100 scale
    const readabilityScore = Math.max(0, Math.min(100, fleschScore));

    return Math.round(readabilityScore);
  }

  calculateOverallScore(violations, formattingScore, readabilityScore, keywordAnalysis) {
    let score = 100;

    // Deduct for violations
    score -= violations.filter(v => v.severity === 'critical').length * 15;
    score -= violations.filter(v => v.severity === 'warning').length * 8;
    score -= violations.filter(v => v.severity === 'info').length * 3;

    // Factor in other scores
    score = (score * 0.4) + (formattingScore * 0.3) + (readabilityScore * 0.2) + (keywordAnalysis.density * 10);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateRecommendations(violations, keywordAnalysis) {
    const recommendations = [];

    // Generate recommendations for violations
    violations.forEach(violation => {
      if (violation.autoFixable) {
        recommendations.push({
          type: 'auto_fix',
          priority: violation.severity === 'critical' ? 'high' : 'medium',
          description: `Auto-fix available: ${violation.title}`,
          action: violation.suggestion
        });
      } else {
        recommendations.push({
          type: 'manual_fix',
          priority: violation.severity === 'critical' ? 'high' : 'medium',
          description: `Manual fix required: ${violation.title}`,
          action: violation.suggestion
        });
      }
    });

    // Generate keyword recommendations
    if (keywordAnalysis.density < 50) {
      recommendations.push({
        type: 'keyword_optimization',
        priority: 'high',
        description: `Low keyword density: ${keywordAnalysis.density}%`,
        action: `Add missing keywords: ${keywordAnalysis.missing.slice(0, 3).join(', ')}`
      });
    }

    // Remove duplicates
    const uniqueRecommendations = recommendations.filter((rec, index, self) =>
      index === self.findIndex(r => r.description === rec.description)
    );

    return uniqueRecommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  autoFixContent(content, violations) {
    let fixedContent = content;

    // Apply auto-fixes for fixable violations
    violations.filter(v => v.autoFixable).forEach(violation => {
      switch (violation.type) {
        case 'format':
          fixedContent = this.fixFormattingViolation(fixedContent, violation);
          break;
        case 'structure':
          fixedContent = this.fixStructureViolation(fixedContent, violation);
          break;
        case 'keyword':
          fixedContent = this.fixKeywordViolation(fixedContent, violation);
          break;
      }
    });

    return fixedContent;
  }

  fixFormattingViolation(content, violation) {
    switch (violation.id) {
      case 'format_non_ascii':
        // Replace non-ASCII characters
        return content.replace(/[^\x00-\x7F]/g, '');
      
      default:
        return content;
    }
  }

  fixStructureViolation(content, violation) {
    switch (violation.id) {
      case 'structure_inconsistent_dates':
        // Standardize date formats
        return content.replace(/\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})\b/g, (match, month, day, year) => {
          const normalizedYear = year.length === 2 ? '20' + year : year;
          return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${normalizedYear}`;
        });
      
      default:
        return content;
    }
  }

  fixKeywordViolation(content, violation) {
    // Keyword-specific fixes would go here
    return content;
  }

  upgradeSeverity(severity) {
    switch (severity) {
      case 'info': return 'warning';
      case 'warning': return 'critical';
      case 'critical': return 'critical';
      default: return severity;
    }
  }

  hasATSFriendlyFormatting(content) {
    // Check for ATS-friendly formatting indicators
    const hasStandardHeaders = /^(Summary|Experience|Education|Skills)/im.test(content);
    const hasSimpleFormatting = !/\|.*\|/.test(content); // No complex tables
    const hasReasonableLength = content.split(/\s+/).length >= 50;

    return hasStandardHeaders && hasSimpleFormatting && hasReasonableLength;
  }

  countSyllables(text) {
    // Simple syllable counting algorithm
    return text.toLowerCase()
      .replace(/(?:[^laeiouy]es|ed|le|[^laeiouy]e)$/, '')
      .replace(/^y/, '')
      .match(/[aeiouy]{1,2}/g)?.length || 0;
  }

  // Initialize helper methods
  initializeAntiPatterns() {
    return [
      {
        type: 'format',
        regex: /\|.*\|/,
        flags: 'g',
        title: 'Complex Table Formatting',
        description: 'Tables can confuse ATS systems',
        suggestion: 'Convert tables to bullet points or simple text',
        autoFixable: true,
        severity: 'critical'
      },
      {
        type: 'format',
        regex: /[^\x00-\x7F]/,
        flags: 'g',
        title: 'Non-ASCII Characters',
        description: 'Non-ASCII characters may not be processed correctly',
        suggestion: 'Use standard ASCII characters',
        autoFixable: true,
        severity: 'warning'
      },
      {
        type: 'format',
        regex: /\t/,
        flags: 'g',
        title: 'Tab Characters',
        description: 'Tab characters can cause formatting issues',
        suggestion: 'Use spaces instead of tabs',
        autoFixable: true,
        severity: 'warning'
      },
      {
        type: 'content',
        regex: /\b(\d+)%\s+(?:increase|growth|improvement)\b/gi,
        flags: 'gi',
        title: 'Unsubstantiated Metrics',
        description: 'Metrics without context may appear fabricated',
        suggestion: 'Provide context for all metrics',
        autoFixable: false,
        severity: 'warning'
      },
      {
        type: 'structure',
        regex: /^(?!.{1,100}$)/gm,
        flags: 'gm',
        title: 'Very Long Lines',
        description: 'Long lines may be truncated by ATS',
        suggestion: 'Keep lines under 100 characters',
        autoFixable: true,
        severity: 'info'
      }
    ];
  }

  initializeFormattingRules() {
    return {
      maxLineLength: 100,
      maxWordCount: 1000,
      minWordCount: 50,
      requiredSections: ['Summary', 'Experience', 'Education'],
      dateFormat: 'MM/DD/YYYY'
    };
  }

  initializeKeywordRules() {
    return {
      minDensity: 0.3,
      maxDensity: 0.8,
      importantKeywords: [
        'react', 'node', 'python', 'java', 'javascript', 'typescript',
        'aws', 'docker', 'kubernetes', 'sql', 'nosql', 'mongodb',
        'agile', 'scrum', 'devops', 'ci/cd', 'git'
      ]
    };
  }

  initializeReadabilityMetrics() {
    return {
      targetScore: 60, // Flesch Reading Ease
      minScore: 30,
      maxScore: 100
    };
  }
}

// Global ATS validator instance
export const atsValidator = new ATSValidator();
