import { z } from 'zod';
import { logger } from '../../shared/logger.js';
import { contextualEventEmitter } from '../../shared/context.js';

// Policy Engine Schemas
export const PolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  scope: z.enum(['user', 'organization', 'global']),
  level: z.enum(['info', 'warning', 'error', 'critical']),
  enabled: z.boolean().default(true),
  rules: z.array(z.object({
    type: z.enum(['application_limit', 'platform_restriction', 'salary_floor', 'location_constraint', 'visa_constraint', 'company_blacklist', 'industry_restriction']),
    parameters: z.record(z.any()),
    action: z.enum(['block', 'warn', 'log', 'require_approval'])
  }))
});

export const PolicyCheckRequestSchema = z.object({
  userId: z.string(),
  organizationId: z.string().optional(),
  application: z.object({
    jobId: z.string(),
    platform: z.string(),
    company: z.string(),
    industry: z.string(),
    location: z.string(),
    remote: z.boolean(),
    salary: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().default('USD')
    }),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance']),
    requiresVisaSponsorship: z.boolean().default(false)
  }),
  userProfile: z.object({
    experience: z.object({
      years: z.number(),
      level: z.string()
    }),
    location: z.object({
      city: z.string(),
      state: z.string(),
      country: z.string(),
      willingToRelocate: z.boolean()
    }),
    workAuthorization: z.object({
      citizen: z.boolean(),
      workVisa: z.boolean(),
      requiresSponsorship: z.boolean()
    }),
    preferences: z.object({
      minSalary: z.number().optional(),
      maxApplicationsPerDay: z.number().default(10),
      allowedPlatforms: z.array(z.string()).default([]),
      blacklistedCompanies: z.array(z.string()).default([]),
      blacklistedIndustries: z.array(z.string()).default([])
    })
  }),
  context: z.object({
    currentTime: z.string(),
    userApplicationCount: z.number().default(0),
    orgApplicationCount: z.number().default(0)
  })
});

export class PolicyEngine {
  constructor() {
    this.policies = new Map();
    this.userPolicies = new Map();
    this.organizationPolicies = new Map();
    this.loadDefaultPolicies();
  }

  loadDefaultPolicies() {
    // Global policies
    const globalPolicies = [
      {
        id: 'global_daily_limit',
        name: 'Daily Application Limit',
        description: 'Limit number of applications per day per user',
        scope: 'global',
        level: 'warning',
        enabled: true,
        rules: [
          {
            type: 'application_limit',
            parameters: {
              maxPerDay: 50,
              timeWindow: '24h'
            },
            action: 'warn'
          }
        ]
      },
      {
        id: 'global_platform_safety',
        name: 'Platform Safety Check',
        description: 'Block applications to suspicious platforms',
        scope: 'global',
        level: 'critical',
        enabled: true,
        rules: [
          {
            type: 'platform_restriction',
            parameters: {
              blockedPlatforms: ['scam-site', 'fake-jobs', 'suspicious-platform'],
              allowedPlatforms: ['linkedin', 'naukri', 'indeed', 'glassdoor', 'monster']
            },
            action: 'block'
          }
        ]
      },
      {
        id: 'global_visa_compliance',
        name: 'Work Visa Compliance',
        description: 'Ensure visa requirements are met',
        scope: 'global',
        level: 'error',
        enabled: true,
        rules: [
          {
            type: 'visa_constraint',
            parameters: {
              requireCitizenshipForGovJobs: true,
              blockSponsorshipRequired: false
            },
            action: 'warn'
          }
        ]
      }
    ];

    globalPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }

  async checkPolicies(request) {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validatedRequest = PolicyCheckRequestSchema.parse(request);
      
      logger.info('Policy check started', {
        userId: validatedRequest.userId,
        organizationId: validatedRequest.organizationId,
        platform: validatedRequest.application.platform
      });

      const violations = [];
      const warnings = [];
      const approvals = [];

      // Get applicable policies
      const applicablePolicies = this.getApplicablePolicies(validatedRequest);

      // Check each policy
      for (const policy of applicablePolicies) {
        if (!policy.enabled) continue;

        for (const rule of policy.rules) {
          const result = await this.checkRule(rule, validatedRequest);
          
          if (result.violated) {
            const policyResult = {
              policyId: policy.id,
              policyName: policy.name,
              policyLevel: policy.level,
              ruleType: rule.type,
              action: rule.action,
              message: result.message,
              details: result.details
            };

            switch (rule.action) {
              case 'block':
                violations.push(policyResult);
                break;
              case 'warn':
                warnings.push(policyResult);
                break;
              case 'require_approval':
                approvals.push(policyResult);
                break;
              case 'log':
                logger.warn('Policy violation logged', policyResult);
                break;
            }
          }
        }
      }

      const result = {
        compliant: violations.length === 0,
        violations,
        warnings,
        requiredApprovals: approvals,
        summary: {
          totalPolicies: applicablePolicies.length,
          violationsCount: violations.length,
          warningsCount: warnings.length,
          approvalsCount: approvals.length
        },
        processingTime: Date.now() - startTime
      };

      // Emit policy check event
      contextualEventEmitter.emitByType('policy.check_completed', {
        userId: validatedRequest.userId,
        compliant: result.compliant,
        violationsCount: violations.length,
        warningsCount: warnings.length
      }, validatedRequest.userId);

      logger.info('Policy check completed', {
        userId: validatedRequest.userId,
        compliant: result.compliant,
        violationsCount: violations.length,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logger.error('Policy check failed', { error: error.message }, error);
      throw new Error(`Policy check failed: ${error.message}`);
    }
  }

  getApplicablePolicies(request) {
    const applicable = [];

    // Add global policies
    this.policies.forEach(policy => {
      if (policy.scope === 'global' && policy.enabled) {
        applicable.push(policy);
      }
    });

    // Add user-specific policies
    const userPolicyIds = this.userPolicies.get(request.userId) || [];
    userPolicyIds.forEach(policyId => {
      const policy = this.policies.get(policyId);
      if (policy && policy.enabled) {
        applicable.push(policy);
      }
    });

    // Add organization-specific policies
    if (request.organizationId) {
      const orgPolicyIds = this.organizationPolicies.get(request.organizationId) || [];
      orgPolicyIds.forEach(policyId => {
        const policy = this.policies.get(policyId);
        if (policy && policy.enabled) {
          applicable.push(policy);
        }
      });
    }

    return applicable;
  }

  async checkRule(rule, request) {
    switch (rule.type) {
      case 'application_limit':
        return this.checkApplicationLimit(rule, request);
      case 'platform_restriction':
        return this.checkPlatformRestriction(rule, request);
      case 'salary_floor':
        return this.checkSalaryFloor(rule, request);
      case 'location_constraint':
        return this.checkLocationConstraint(rule, request);
      case 'visa_constraint':
        return this.checkVisaConstraint(rule, request);
      case 'company_blacklist':
        return this.checkCompanyBlacklist(rule, request);
      case 'industry_restriction':
        return this.checkIndustryRestriction(rule, request);
      default:
        return { violated: false, message: 'Unknown rule type' };
    }
  }

  checkApplicationLimit(rule, request) {
    const { maxPerDay, timeWindow } = rule.parameters;
    const userCount = request.context.userApplicationCount;

    if (userCount >= maxPerDay) {
      return {
        violated: true,
        message: `Daily application limit (${maxPerDay}) exceeded`,
        details: {
          currentCount: userCount,
          limit: maxPerDay,
          timeWindow
        }
      };
    }

    return { violated: false };
  }

  checkPlatformRestriction(rule, request) {
    const { blockedPlatforms, allowedPlatforms } = rule.parameters;
    const platform = request.application.platform;

    // Check blocked platforms
    if (blockedPlatforms && blockedPlatforms.includes(platform)) {
      return {
        violated: true,
        message: `Platform "${platform}" is blocked`,
        details: {
          platform,
          reason: 'Platform is on blocked list'
        }
      };
    }

    // Check allowed platforms (if specified)
    if (allowedPlatforms && allowedPlatforms.length > 0 && !allowedPlatforms.includes(platform)) {
      return {
        violated: true,
        message: `Platform "${platform}" is not allowed`,
        details: {
          platform,
          allowedPlatforms
        }
      };
    }

    return { violated: false };
  }

  checkSalaryFloor(rule, request) {
    const { minSalary, currency } = rule.parameters;
    const jobSalary = request.application.salary;

    if (!minSalary || !jobSalary.min) {
      return { violated: false };
    }

    // Simple currency check (in production, use proper currency conversion)
    if (jobSalary.currency !== currency) {
      return {
        violated: true,
        message: `Currency mismatch for salary check`,
        details: {
          jobCurrency: jobSalary.currency,
          requiredCurrency: currency
        }
      };
    }

    if (jobSalary.min < minSalary) {
      return {
        violated: true,
        message: `Job salary below minimum threshold`,
        details: {
          jobSalary: jobSalary.min,
          minSalary,
          currency
        }
      };
    }

    return { violated: false };
  }

  checkLocationConstraint(rule, request) {
    const { allowedLocations, blockedLocations, requireRemote, allowRelocation } = rule.parameters;
    const jobLocation = request.application.location;
    const userProfile = request.userProfile;

    // Check if remote is required but job is not remote
    if (requireRemote && !request.application.remote) {
      return {
        violated: true,
        message: 'Only remote positions are allowed',
        details: {
          jobLocation,
          requirement: 'Remote only'
        }
      };
    }

    // Check blocked locations
    if (blockedLocations && blockedLocations.includes(jobLocation)) {
      return {
        violated: true,
        message: `Location "${jobLocation}" is blocked`,
        details: {
          jobLocation,
          reason: 'Location is on blocked list'
        }
      };
    }

    // Check allowed locations (if specified)
    if (allowedLocations && allowedLocations.length > 0 && !allowedLocations.includes(jobLocation)) {
      // Allow if user is willing to relocate and relocation is allowed
      if (!userProfile.location.willingToRelocate || !allowRelocation) {
        return {
          violated: true,
          message: `Location "${jobLocation}" is not allowed`,
          details: {
            jobLocation,
            allowedLocations,
            willingToRelocate: userProfile.location.willingToRelocate
          }
        };
      }
    }

    return { violated: false };
  }

  checkVisaConstraint(rule, request) {
    const { requireCitizenshipForGovJobs, blockSponsorshipRequired } = rule.parameters;
    const userProfile = request.userProfile;
    const jobRequiresSponsorship = request.application.requiresVisaSponsorship;

    // Check government jobs requiring citizenship
    if (requireCitizenshipForGovJobs && this.isGovernmentJob(request.application)) {
      if (!userProfile.workAuthorization.citizen) {
        return {
          violated: true,
          message: 'Government jobs require citizenship',
          details: {
            jobType: 'government',
            userCitizen: userProfile.workAuthorization.citizen
          }
        };
      }
    }

    // Check sponsorship requirements
    if (blockSponsorshipRequired && jobRequiresSponsorship) {
      if (!userProfile.workAuthorization.workVisa && !userProfile.workAuthorization.citizen) {
        return {
          violated: true,
          message: 'Job requires visa sponsorship which is not available',
          details: {
            jobRequiresSponsorship,
            userWorkVisa: userProfile.workAuthorization.workVisa,
            userCitizen: userProfile.workAuthorization.citizen
          }
        };
      }
    }

    return { violated: false };
  }

  checkCompanyBlacklist(rule, request) {
    const { blacklistedCompanies } = rule.parameters;
    const company = request.application.company;

    // Check global blacklist
    if (blacklistedCompanies && blacklistedCompanies.includes(company)) {
      return {
        violated: true,
        message: `Company "${company}" is blacklisted`,
        details: {
          company,
          reason: 'Company is on global blacklist'
        }
      };
    }

    // Check user preferences
    if (request.userProfile.preferences.blacklistedCompanies.includes(company)) {
      return {
        violated: true,
        message: `Company "${company}" is in user blacklist`,
        details: {
          company,
          reason: 'User has blacklisted this company'
        }
      };
    }

    return { violated: false };
  }

  checkIndustryRestriction(rule, request) {
    const { restrictedIndustries } = rule.parameters;
    const industry = request.application.industry;

    // Check global restrictions
    if (restrictedIndustries && restrictedIndustries.includes(industry)) {
      return {
        violated: true,
        message: `Industry "${industry}" is restricted`,
        details: {
          industry,
          reason: 'Industry is on restricted list'
        }
      };
    }

    // Check user preferences
    if (request.userProfile.preferences.blacklistedIndustries.includes(industry)) {
      return {
        violated: true,
        message: `Industry "${industry}" is in user blacklist`,
        details: {
          industry,
          reason: 'User has blacklisted this industry'
        }
      };
    }

    return { violated: false };
  }

  isGovernmentJob(application) {
    // Simple heuristic for government jobs
    const governmentKeywords = ['government', 'federal', 'state', 'municipal', 'public sector', 'civil service'];
    const companyLower = application.company.toLowerCase();
    const titleLower = application.jobTitle.toLowerCase();
    
    return governmentKeywords.some(keyword => 
      companyLower.includes(keyword) || titleLower.includes(keyword)
    );
  }

  // Policy management methods
  addPolicy(policy) {
    const validatedPolicy = PolicySchema.parse(policy);
    this.policies.set(validatedPolicy.id, validatedPolicy);
    
    logger.info('Policy added', {
      policyId: validatedPolicy.id,
      name: validatedPolicy.name,
      scope: validatedPolicy.scope
    });
  }

  removePolicy(policyId) {
    const removed = this.policies.delete(policyId);
    
    if (removed) {
      logger.info('Policy removed', { policyId });
    }
    
    return removed;
  }

  enablePolicy(policyId) {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.enabled = true;
      logger.info('Policy enabled', { policyId });
      return true;
    }
    return false;
  }

  disablePolicy(policyId) {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.enabled = false;
      logger.info('Policy disabled', { policyId });
      return true;
    }
    return false;
  }

  assignPolicyToUser(policyId, userId) {
    if (!this.userPolicies.has(userId)) {
      this.userPolicies.set(userId, []);
    }
    this.userPolicies.get(userId).push(policyId);
    
    logger.info('Policy assigned to user', { policyId, userId });
  }

  removePolicyFromUser(policyId, userId) {
    const userPolicies = this.userPolicies.get(userId) || [];
    const index = userPolicies.indexOf(policyId);
    if (index > -1) {
      userPolicies.splice(index, 1);
      logger.info('Policy removed from user', { policyId, userId });
      return true;
    }
    return false;
  }

  assignPolicyToOrganization(policyId, organizationId) {
    if (!this.organizationPolicies.has(organizationId)) {
      this.organizationPolicies.set(organizationId, []);
    }
    this.organizationPolicies.get(organizationId).push(policyId);
    
    logger.info('Policy assigned to organization', { policyId, organizationId });
  }

  removePolicyFromOrganization(policyId, organizationId) {
    const orgPolicies = this.organizationPolicies.get(organizationId) || [];
    const index = orgPolicies.indexOf(policyId);
    if (index > -1) {
      orgPolicies.splice(index, 1);
      logger.info('Policy removed from organization', { policyId, organizationId });
      return true;
    }
    return false;
  }

  getPolicy(policyId) {
    return this.policies.get(policyId);
  }

  getAllPolicies() {
    return Array.from(this.policies.values());
  }

  getUserPolicies(userId) {
    const policyIds = this.userPolicies.get(userId) || [];
    return policyIds.map(id => this.policies.get(id)).filter(Boolean);
  }

  getOrganizationPolicies(organizationId) {
    const policyIds = this.organizationPolicies.get(organizationId) || [];
    return policyIds.map(id => this.policies.get(id)).filter(Boolean);
  }
}

// Global policy engine instance
export const policyEngine = new PolicyEngine();
