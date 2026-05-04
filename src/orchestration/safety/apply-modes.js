import { z } from 'zod';
import { logger } from '../../shared/logger.js';
import { contextualEventEmitter } from '../../shared/context.js';

// Apply Mode Schemas
export const ApplyModeSchema = z.enum(['FULL_AUTO', 'REVIEW_REQUIRED', 'DRAFT_ONLY']);

export const ApplyRequestSchema = z.object({
  mode: ApplyModeSchema.default('REVIEW_REQUIRED'),
  jobId: z.string(),
  userId: z.string(),
  resumeId: z.string(),
  coverLetterId: z.string().optional(),
  matchScore: z.number(),
  atsScore: z.number(),
  riskFlags: z.array(z.string()),
  jobInfo: z.object({
    title: z.string(),
    company: z.string(),
    platform: z.string(),
    applicationDeadline: z.string().optional()
  }),
  userProfile: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    experience: z.object({
      years: z.number(),
      level: z.string()
    })
  }),
  qualityThresholds: z.object({
    minMatchScore: z.number().default(60),
    minAtsScore: z.number().default(70),
    maxRiskFlags: z.number().default(3)
  }).optional()
});

export class ApplyModeManager {
  constructor() {
    this.activeApplications = new Map();
    this.pendingApprovals = new Map();
    this.cancelWindow = 300000; // 5 minutes
    this.maxConcurrentApplications = 5;
  }

  async submitApplication(request) {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validatedRequest = ApplyRequestSchema.parse(request);
      
      logger.info('Application submission started', {
        mode: validatedRequest.mode,
        jobId: validatedRequest.jobId,
        userId: validatedRequest.userId,
        matchScore: validatedRequest.matchScore,
        atsScore: validatedRequest.atsScore
      });

      // Check concurrent application limits
      await this.checkConcurrentLimits(validatedRequest.userId);

      // Run quality gate
      const qualityGateResult = await this.runQualityGate(validatedRequest);
      
      if (!qualityGateResult.passed) {
        contextualEventEmitter.emitByType('apply_gate_blocked', {
          mode: validatedRequest.mode,
          jobId: validatedRequest.jobId,
          userId: validatedRequest.userId,
          reasons: qualityGateResult.reasons
        }, validatedRequest.userId);

        throw new Error(`Application blocked by quality gate: ${qualityGateResult.reasons.join(', ')}`);
      }

      // Handle based on mode
      let result;
      switch (validatedRequest.mode) {
        case 'FULL_AUTO':
          result = await this.handleFullAuto(validatedRequest);
          break;
        case 'REVIEW_REQUIRED':
          result = await this.handleReviewRequired(validatedRequest);
          break;
        case 'DRAFT_ONLY':
          result = await this.handleDraftOnly(validatedRequest);
          break;
        default:
          throw new Error(`Unknown apply mode: ${validatedRequest.mode}`);
      }

      // Emit success event
      contextualEventEmitter.emitByType('apply_gate_passed', {
        mode: validatedRequest.mode,
        jobId: validatedRequest.jobId,
        userId: validatedRequest.userId,
        applicationId: result.applicationId,
        processingTime: Date.now() - startTime
      }, validatedRequest.userId);

      logger.info('Application submission completed', {
        mode: validatedRequest.mode,
        applicationId: result.applicationId,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logger.error('Application submission failed', {
        mode: request.mode,
        jobId: request.jobId,
        userId: request.userId,
        error: error.message
      }, error);
      
      throw error;
    }
  }

  async checkConcurrentLimits(userId) {
    const userApplications = Array.from(this.activeApplications.values())
      .filter(app => app.userId === userId && app.status === 'active');

    if (userApplications.length >= this.maxConcurrentApplications) {
      throw new Error(`Maximum concurrent applications (${this.maxConcurrentApplications}) exceeded`);
    }
  }

  async runQualityGate(request) {
    const reasons = [];
    const thresholds = request.qualityThresholds || {
      minMatchScore: 60,
      minAtsScore: 70,
      maxRiskFlags: 3
    };

    // Check match score
    if (request.matchScore < thresholds.minMatchScore) {
      reasons.push(`Match score ${request.matchScore} below threshold ${thresholds.minMatchScore}`);
    }

    // Check ATS score
    if (request.atsScore < thresholds.minAtsScore) {
      reasons.push(`ATS score ${request.atsScore} below threshold ${thresholds.minAtsScore}`);
    }

    // Check risk flags
    if (request.riskFlags.length > thresholds.maxRiskFlags) {
      reasons.push(`Risk flags ${request.riskFlags.length} exceed threshold ${thresholds.maxRiskFlags}`);
    }

    // Check for suspicious posting
    const suspiciousCheck = await this.checkSuspiciousPosting(request.jobInfo);
    if (suspiciousCheck.isSuspicious) {
      reasons.push(`Suspicious job posting: ${suspiciousCheck.reason}`);
    }

    // Check required fields
    const missingFields = this.checkRequiredFields(request);
    if (missingFields.length > 0) {
      reasons.push(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check policy compliance
    const policyCheck = await this.checkPolicyCompliance(request);
    if (!policyCheck.compliant) {
      reasons.push(...policyCheck.violations);
    }

    return {
      passed: reasons.length === 0,
      reasons,
      thresholds
    };
  }

  async handleFullAuto(request) {
    const applicationId = this.generateApplicationId();
    
    // Create application record
    const application = {
      id: applicationId,
      userId: request.userId,
      jobId: request.jobId,
      mode: request.mode,
      status: 'submitting',
      submittedAt: new Date().toISOString(),
      qualityScores: {
        match: request.matchScore,
        ats: request.atsScore,
        risk: request.riskFlags.length
      },
      cancelDeadline: Date.now() + this.cancelWindow
    };

    this.activeApplications.set(applicationId, application);

    try {
      // Submit application immediately
      const submissionResult = await this.executeApplication(request, applicationId);
      
      // Update application status
      application.status = 'submitted';
      application.submittedAt = new Date().toISOString();
      application.submissionResult = submissionResult;

      contextualEventEmitter.emitByType('apply_submitted', {
        applicationId,
        mode: request.mode,
        jobId: request.jobId,
        userId: request.userId
      }, request.userId);

      return {
        applicationId,
        status: 'submitted',
        submittedAt: application.submittedAt,
        submissionResult
      };

    } catch (error) {
      application.status = 'failed';
      application.error = error.message;
      
      contextualEventEmitter.emitByType('apply_failed', {
        applicationId,
        mode: request.mode,
        jobId: request.jobId,
        userId: request.userId,
        error: error.message
      }, request.userId);

      throw error;
    }
  }

  async handleReviewRequired(request) {
    const applicationId = this.generateApplicationId();
    
    // Create pending approval record
    const approval = {
      id: applicationId,
      userId: request.userId,
      jobId: request.jobId,
      mode: request.mode,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      qualityScores: {
        match: request.matchScore,
        ats: request.atsScore,
        risk: request.riskFlags.length
      },
      request: {
        resumeId: request.resumeId,
        coverLetterId: request.coverLetterId,
        jobInfo: request.jobInfo,
        userProfile: request.userProfile
      },
      cancelDeadline: Date.now() + this.cancelWindow
    };

    this.pendingApprovals.set(applicationId, approval);

    contextualEventEmitter.emitByType('apply_pending_approval', {
      applicationId,
      mode: request.mode,
      jobId: request.jobId,
      userId: request.userId
    }, request.userId);

    return {
      applicationId,
      status: 'pending_approval',
      expiresAt: approval.expiresAt,
      qualityScores: approval.qualityScores
    };
  }

  async handleDraftOnly(request) {
    const applicationId = this.generateApplicationId();
    
    // Create draft record
    const draft = {
      id: applicationId,
      userId: request.userId,
      jobId: request.jobId,
      mode: request.mode,
      status: 'draft',
      createdAt: new Date().toISOString(),
      qualityScores: {
        match: request.matchScore,
        ats: request.atsScore,
        risk: request.riskFlags.length
      },
      request: {
        resumeId: request.resumeId,
        coverLetterId: request.coverLetterId,
        jobInfo: request.jobInfo,
        userProfile: request.userProfile
      }
    };

    this.activeApplications.set(applicationId, draft);

    contextualEventEmitter.emitByType('apply_draft_created', {
      applicationId,
      mode: request.mode,
      jobId: request.jobId,
      userId: request.userId
    }, request.userId);

    return {
      applicationId,
      status: 'draft',
      createdAt: draft.createdAt,
      qualityScores: draft.qualityScores
    };
  }

  async approveApplication(applicationId, userId, reason) {
    const approval = this.pendingApprovals.get(applicationId);
    
    if (!approval) {
      throw new Error('Application not found or not pending approval');
    }

    if (approval.userId !== userId) {
      throw new Error('Access denied');
    }

    if (approval.status !== 'pending_approval') {
      throw new Error('Application is not pending approval');
    }

    // Move from pending to active
    this.pendingApprovals.delete(applicationId);
    
    const application = {
      ...approval,
      status: 'submitting',
      approvedAt: new Date().toISOString(),
      approvalReason: reason
    };

    this.activeApplications.set(applicationId, application);

    try {
      // Execute the application
      const submissionResult = await this.executeApplication(approval.request, applicationId);
      
      // Update status
      application.status = 'submitted';
      application.submittedAt = new Date().toISOString();
      application.submissionResult = submissionResult;

      contextualEventEmitter.emitByType('apply_approved', {
        applicationId,
        userId,
        reason,
        jobId: approval.jobId
      }, userId);

      contextualEventEmitter.emitByType('apply_submitted', {
        applicationId,
        mode: approval.mode,
        jobId: approval.jobId,
        userId
      }, userId);

      return {
        applicationId,
        status: 'submitted',
        submittedAt: application.submittedAt,
        submissionResult
      };

    } catch (error) {
      application.status = 'failed';
      application.error = error.message;
      
      contextualEventEmitter.emitByType('apply_failed', {
        applicationId,
        mode: approval.mode,
        jobId: approval.jobId,
        userId,
        error: error.message
      }, userId);

      throw error;
    }
  }

  async rejectApplication(applicationId, userId, reason) {
    const approval = this.pendingApprovals.get(applicationId);
    
    if (!approval) {
      throw new Error('Application not found or not pending approval');
    }

    if (approval.userId !== userId) {
      throw new Error('Access denied');
    }

    if (approval.status !== 'pending_approval') {
      throw new Error('Application is not pending approval');
    }

    // Update status
    approval.status = 'rejected';
    approval.rejectedAt = new Date().toISOString();
    approval.rejectionReason = reason;

    contextualEventEmitter.emitByType('apply_rejected', {
      applicationId,
      userId,
      reason,
      jobId: approval.jobId
    }, userId);

    // Remove from pending approvals
    this.pendingApprovals.delete(applicationId);

    return {
      applicationId,
      status: 'rejected',
      rejectedAt: approval.rejectedAt,
      reason
    };
  }

  async cancelApplication(applicationId, userId, reason) {
    // Check active applications
    let application = this.activeApplications.get(applicationId);
    
    if (!application) {
      // Check pending approvals
      application = this.pendingApprovals.get(applicationId);
    }

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.userId !== userId) {
      throw new Error('Access denied');
    }

    // Check if cancellation is still allowed
    if (application.cancelDeadline && Date.now() > application.cancelDeadline) {
      throw new Error('Cancellation window has expired');
    }

    // Create audit snapshot
    const auditSnapshot = {
      applicationId,
      originalStatus: application.status,
      cancelledAt: new Date().toISOString(),
      cancelReason: reason,
      application: JSON.parse(JSON.stringify(application))
    };

    // Update status
    application.status = 'cancelled';
    application.cancelledAt = new Date().toISOString();
    application.cancelReason = reason;
    application.auditSnapshot = auditSnapshot;

    // Remove from active/pending collections
    this.activeApplications.delete(applicationId);
    this.pendingApprovals.delete(applicationId);

    contextualEventEmitter.emitByType('apply_cancelled', {
      applicationId,
      userId,
      reason,
      originalStatus: auditSnapshot.originalStatus,
      jobId: application.jobId
    }, userId);

    return {
      applicationId,
      status: 'cancelled',
      cancelledAt: application.cancelledAt,
      reason,
      auditSnapshot
    };
  }

  async getPendingApplications(userId) {
    const userPending = Array.from(this.pendingApprovals.values())
      .filter(app => app.userId === userId && app.status === 'pending_approval');

    return userPending.map(app => ({
      applicationId: app.id,
      jobId: app.jobId,
      jobTitle: app.request.jobInfo.title,
      company: app.request.jobInfo.company,
      platform: app.request.jobInfo.platform,
      qualityScores: app.qualityScores,
      createdAt: app.createdAt,
      expiresAt: app.expiresAt
    }));
  }

  async getApplicationStatus(applicationId, userId) {
    // Check active applications
    let application = this.activeApplications.get(applicationId);
    
    if (!application) {
      // Check pending approvals
      application = this.pendingApprovals.get(applicationId);
    }

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.userId !== userId) {
      throw new Error('Access denied');
    }

    return {
      applicationId: application.id,
      status: application.status,
      jobId: application.jobId,
      mode: application.mode,
      qualityScores: application.qualityScores,
      createdAt: application.createdAt,
      submittedAt: application.submittedAt,
      approvedAt: application.approvedAt,
      rejectedAt: application.rejectedAt,
      cancelledAt: application.cancelledAt,
      cancelDeadline: application.cancelDeadline && new Date(application.cancelDeadline).toISOString()
    };
  }

  async executeApplication(request, applicationId) {
    // In production, this would integrate with actual job platform APIs
    logger.info('Executing application', {
      applicationId,
      jobId: request.jobId,
      platform: request.jobInfo.platform
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      platformApplicationId: `platform_${applicationId}`,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      confirmationNumber: `APP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
  }

  async checkSuspiciousPosting(jobInfo) {
    // Simple suspicious posting detection
    const suspiciousIndicators = [];

    // Check for very old postings
    if (jobInfo.applicationDeadline) {
      const deadline = new Date(jobInfo.applicationDeadline);
      const now = new Date();
      const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24);
      
      if (daysUntilDeadline < 0) {
        suspiciousIndicators.push('Expired job posting');
      }
    }

    // Check for missing essential information
    if (!jobInfo.title || jobInfo.title.length < 3) {
      suspiciousIndicators.push('Missing or invalid job title');
    }

    if (!jobInfo.company || jobInfo.company.length < 2) {
      suspiciousIndicators.push('Missing or invalid company name');
    }

    return {
      isSuspicious: suspiciousIndicators.length > 0,
      reason: suspiciousIndicators.join(', ')
    };
  }

  checkRequiredFields(request) {
    const missing = [];
    
    if (!request.resumeId) missing.push('resume');
    if (!request.userProfile.email) missing.push('email');
    if (!request.userProfile.phone) missing.push('phone');
    if (!request.userProfile.name) missing.push('name');
    
    return missing;
  }

  async checkPolicyCompliance(request) {
    const violations = [];
    
    // In production, this would check against actual policy engine
    // For now, implement basic checks
    
    // Check application frequency
    const userApplications = Array.from(this.activeApplications.values())
      .filter(app => app.userId === request.userId && 
                     app.status === 'submitted' && 
                     new Date(app.submittedAt) > new Date(Date.now() - 86400000)); // Last 24 hours

    if (userApplications.length >= 10) {
      violations.push('Daily application limit exceeded');
    }

    // Check platform restrictions
    const restrictedPlatforms = ['scam-platform', 'fake-company'];
    if (restrictedPlatforms.includes(request.jobInfo.platform)) {
      violations.push(`Platform ${request.jobInfo.platform} is restricted`);
    }

    return {
      compliant: violations.length === 0,
      violations
    };
  }

  generateApplicationId() {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup expired applications
  cleanupExpiredApplications() {
    const now = Date.now();
    
    // Clean up expired pending approvals
    for (const [id, approval] of this.pendingApprovals) {
      if (new Date(approval.expiresAt).getTime() < now) {
        approval.status = 'expired';
        this.pendingApprovals.delete(id);
        
        contextualEventEmitter.emitByType('apply_expired', {
          applicationId: id,
          userId: approval.userId,
          jobId: approval.jobId
        }, approval.userId);
      }
    }

    // Clean up cancelled applications older than 7 days
    for (const [id, application] of this.activeApplications) {
      if (application.status === 'cancelled' && 
          application.cancelledAt && 
          new Date(application.cancelledAt).getTime() < now - (7 * 24 * 60 * 60 * 1000)) {
        this.activeApplications.delete(id);
      }
    }
  }
}

// Global apply mode manager instance
export const applyModeManager = new ApplyModeManager();
