import { z } from 'zod';
import { logger } from '../shared/logger.js';
import { contextualEventEmitter } from '../shared/context.js';

// Application Tracking Schemas
export const ApplicationRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  jobId: z.string(),
  platform: z.string(),
  jobInfo: z.object({
    title: z.string(),
    company: z.string(),
    location: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
    salary: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().default('USD')
    }),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance']),
    remote: z.boolean().default(false)
  }),
  userProfile: z.object({
    name: z.string(),
    email: z.string(),
    experience: z.object({
      years: z.number(),
      level: z.string()
    }),
    skills: z.array(z.string())
  }),
  applicationData: z.object({
    resumeId: z.string(),
    coverLetterId: z.string().optional(),
    tailoredResume: z.boolean().default(false),
    tailoredCoverLetter: z.boolean().default(false),
    matchScore: z.number(),
    atsScore: z.number(),
    riskFlags: z.array(z.string()),
    qualityScores: z.object({
      match: z.number(),
      ats: z.number(),
      risk: z.number()
    })
  }),
  status: z.enum([
    'draft', 'pending_approval', 'approved', 'submitted', 
    'under_review', 'interview_scheduled', 'interview_completed',
    'offer_received', 'offer_accepted', 'offer_declined', 
    'rejected', 'withdrawn', 'expired'
  ]),
  submissionData: z.object({
    submittedAt: z.string().optional(),
    submittedBy: z.enum(['user', 'auto', 'manual']).optional(),
    platformApplicationId: z.string().optional(),
    confirmationNumber: z.string().optional(),
    submissionMethod: z.enum(['api', 'manual', 'bulk']).optional()
  }),
  timeline: z.array(z.object({
    timestamp: z.string(),
    status: z.string(),
    action: z.string(),
    details: z.string(),
    actor: z.enum(['user', 'system', 'recruiter', 'hiring_manager']),
    metadata: z.record(z.any()).optional()
  })).default([]),
  interactions: z.array(z.object({
    type: z.enum(['email', 'phone', 'interview', 'assessment', 'other']),
    timestamp: z.string(),
    details: z.string(),
    outcome: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })).default([]),
  analytics: z.object({
    views: z.number().default(0),
    clicks: z.number().default(0),
    responseTime: z.number().optional(), // Time to first response in hours
    conversionStage: z.enum(['applied', 'screened', 'interviewed', 'offered', 'hired']).optional(),
    source: z.string().optional(), // Where the application came from
    campaign: z.string().optional()
  }).default({}),
  notes: z.array(z.object({
    id: z.string(),
    content: z.string(),
    createdAt: z.string(),
    createdBy: z.enum(['user', 'system']),
    tags: z.array(z.string()).default([])
  })).default([]),
  tags: z.array(z.string()).default([]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  reminders: z.array(z.object({
    id: z.string(),
    timestamp: z.string(),
    message: z.string(),
    type: z.enum(['follow_up', 'interview', 'deadline', 'other']),
    completed: z.boolean().default(false)
  })).default([]),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString())
});

export class ApplicationTracker {
  constructor() {
    this.applications = new Map();
    this.userApplications = new Map(); // userId -> Set of applicationIds
    this.statusWorkflows = this.initializeStatusWorkflows();
  }

  async createApplication(applicationData) {
    const startTime = Date.now();
    
    try {
      // Validate application data
      const validatedData = ApplicationRecordSchema.parse({
        ...applicationData,
        id: this.generateApplicationId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [{
          timestamp: new Date().toISOString(),
          status: 'draft',
          action: 'application_created',
          details: 'Application draft created',
          actor: 'user'
        }]
      });

      // Store application
      this.applications.set(validatedData.id, validatedData);

      // Update user application index
      if (!this.userApplications.has(validatedData.userId)) {
        this.userApplications.set(validatedData.userId, new Set());
      }
      this.userApplications.get(validatedData.userId).add(validatedData.id);

      // Emit creation event
      contextualEventEmitter.emitByType('application.created', {
        applicationId: validatedData.id,
        userId: validatedData.userId,
        jobId: validatedData.jobId,
        platform: validatedData.platform
      }, validatedData.userId);

      logger.info('Application created', {
        applicationId: validatedData.id,
        userId: validatedData.userId,
        jobId: validatedData.jobId,
        processingTime: Date.now() - startTime
      });

      return validatedData;

    } catch (error) {
      logger.error('Application creation failed', { error: error.message }, error);
      throw new Error(`Application creation failed: ${error.message}`);
    }
  }

  async updateApplicationStatus(applicationId, newStatus, action, details, actor = 'user', metadata = {}) {
    const application = this.applications.get(applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    const oldStatus = application.status;
    
    // Validate status transition
    if (!this.isValidStatusTransition(oldStatus, newStatus)) {
      throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`);
    }

    // Update status
    application.status = newStatus;
    application.updatedAt = new Date().toISOString();

    // Add timeline entry
    const timelineEntry = {
      timestamp: new Date().toISOString(),
      status: newStatus,
      action,
      details,
      actor,
      metadata
    };

    application.timeline.push(timelineEntry);

    // Update analytics if needed
    this.updateAnalytics(application, newStatus, action);

    // Emit status change event
    contextualEventEmitter.emitByType('application.status_changed', {
      applicationId,
      oldStatus,
      newStatus,
      action,
      actor,
      userId: application.userId
    }, application.userId);

    logger.info('Application status updated', {
      applicationId,
      oldStatus,
      newStatus,
      action,
      actor
    });

    return application;
  }

  async addInteraction(applicationId, interactionData) {
    const application = this.applications.get(applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    const interaction = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...interactionData
    };

    application.interactions.push(interaction);
    application.updatedAt = new Date().toISOString();

    // Update analytics
    if (interaction.type === 'email' && interaction.outcome) {
      if (!application.analytics.responseTime) {
        const submittedTime = new Date(application.submissionData.submittedAt).getTime();
        const responseTime = new Date(interaction.timestamp).getTime();
        application.analytics.responseTime = Math.round((responseTime - submittedTime) / (1000 * 60 * 60)); // hours
      }
    }

    contextualEventEmitter.emitByType('application.interaction_added', {
      applicationId,
      interactionType: interaction.type,
      userId: application.userId
    }, application.userId);

    return application;
  }

  async addNote(applicationId, noteContent, tags = [], createdBy = 'user') {
    const application = this.applications.get(applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    const note = {
      id: this.generateId(),
      content: noteContent,
      createdAt: new Date().toISOString(),
      createdBy,
      tags
    };

    application.notes.push(note);
    application.updatedAt = new Date().toISOString();

    contextualEventEmitter.emitByType('application.note_added', {
      applicationId,
      noteId: note.id,
      userId: application.userId
    }, application.userId);

    return application;
  }

  async addReminder(applicationId, reminderData) {
    const application = this.applications.get(applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    const reminder = {
      id: this.generateId(),
      timestamp: reminderData.timestamp,
      message: reminderData.message,
      type: reminderData.type || 'follow_up',
      completed: false
    };

    application.reminders.push(reminder);
    application.updatedAt = new Date().toISOString();

    contextualEventEmitter.emitByType('application.reminder_added', {
      applicationId,
      reminderId: reminder.id,
      reminderType: reminder.type,
      userId: application.userId
    }, application.userId);

    return application;
  }

  async completeReminder(applicationId, reminderId) {
    const application = this.applications.get(applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    const reminder = application.reminders.find(r => r.id === reminderId);
    if (!reminder) {
      throw new Error('Reminder not found');
    }

    reminder.completed = true;
    application.updatedAt = new Date().toISOString();

    contextualEventEmitter.emitByType('application.reminder_completed', {
      applicationId,
      reminderId,
      userId: application.userId
    }, application.userId);

    return application;
  }

  async updateTags(applicationId, tags) {
    const application = this.applications.get(applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    application.tags = tags;
    application.updatedAt = new Date().toISOString();

    return application;
  }

  async updatePriority(applicationId, priority) {
    const application = this.applications.get(applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    application.priority = priority;
    application.updatedAt = new Date().toISOString();

    return application;
  }

  async updateAnalytics(applicationId, analyticsData) {
    const application = this.applications.get(applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    application.analytics = {
      ...application.analytics,
      ...analyticsData
    };
    application.updatedAt = new Date().toISOString();

    return application;
  }

  async getApplication(applicationId, userId) {
    const application = this.applications.get(applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    if (application.userId !== userId) {
      throw new Error('Access denied');
    }

    return application;
  }

  async getUserApplications(userId, filters = {}) {
    const userAppIds = this.userApplications.get(userId) || new Set();
    const applications = Array.from(userAppIds)
      .map(id => this.applications.get(id))
      .filter(Boolean);

    // Apply filters
    let filteredApplications = applications;

    if (filters.status) {
      filteredApplications = filteredApplications.filter(app => app.status === filters.status);
    }

    if (filters.platform) {
      filteredApplications = filteredApplications.filter(app => app.platform === filters.platform);
    }

    if (filters.priority) {
      filteredApplications = filteredApplications.filter(app => app.priority === filters.priority);
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredApplications = filteredApplications.filter(app => 
        filters.tags.some(tag => app.tags.includes(tag))
      );
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filteredApplications = filteredApplications.filter(app => {
        const appDate = new Date(app.createdAt);
        return appDate >= new Date(start) && appDate <= new Date(end);
      });
    }

    // Sort
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    
    filteredApplications.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'matchScore':
          aValue = a.applicationData.matchScore;
          bValue = b.applicationData.matchScore;
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return filteredApplications;
  }

  async getApplicationStats(userId) {
    const userApplications = await this.getUserApplications(userId);
    
    const stats = {
      total: userApplications.length,
      byStatus: {},
      byPlatform: {},
      byPriority: {},
      averageMatchScore: 0,
      averageAtsScore: 0,
      totalInteractions: 0,
      responseRate: 0,
      interviewRate: 0,
      offerRate: 0
    };

    let totalMatchScore = 0;
    let totalAtsScore = 0;
    let respondedApplications = 0;
    let interviewedApplications = 0;
    let offeredApplications = 0;

    userApplications.forEach(app => {
      // Status stats
      stats.byStatus[app.status] = (stats.byStatus[app.status] || 0) + 1;
      
      // Platform stats
      stats.byPlatform[app.platform] = (stats.byPlatform[app.platform] || 0) + 1;
      
      // Priority stats
      stats.byPriority[app.priority] = (stats.byPriority[app.priority] || 0) + 1;
      
      // Score averages
      totalMatchScore += app.applicationData.matchScore;
      totalAtsScore += app.applicationData.atsScore;
      
      // Interaction stats
      stats.totalInteractions += app.interactions.length;
      
      // Response rate (any interaction after submission)
      if (app.interactions.length > 0 && app.status !== 'draft') {
        respondedApplications++;
      }
      
      // Interview rate
      if (['interview_scheduled', 'interview_completed', 'offer_received', 'offer_accepted', 'offer_declined'].includes(app.status)) {
        interviewedApplications++;
      }
      
      // Offer rate
      if (['offer_received', 'offer_accepted', 'offer_declined'].includes(app.status)) {
        offeredApplications++;
      }
    });

    const submittedApplications = userApplications.filter(app => app.status !== 'draft').length;
    
    stats.averageMatchScore = userApplications.length > 0 ? Math.round(totalMatchScore / userApplications.length) : 0;
    stats.averageAtsScore = userApplications.length > 0 ? Math.round(totalAtsScore / userApplications.length) : 0;
    stats.responseRate = submittedApplications > 0 ? Math.round((respondedApplications / submittedApplications) * 100) : 0;
    stats.interviewRate = submittedApplications > 0 ? Math.round((interviewedApplications / submittedApplications) * 100) : 0;
    stats.offerRate = submittedApplications > 0 ? Math.round((offeredApplications / submittedApplications) * 100) : 0;

    return stats;
  }

  async searchApplications(userId, query) {
    const userApplications = await this.getUserApplications(userId);
    
    const searchResults = userApplications.filter(app => {
      const searchText = [
        app.jobInfo.title,
        app.jobInfo.company,
        app.jobInfo.description,
        app.platform,
        app.notes.map(note => note.content).join(' '),
        app.tags.join(' ')
      ].join(' ').toLowerCase();

      return searchText.includes(query.toLowerCase());
    });

    return searchResults;
  }

  async getUpcomingReminders(userId) {
    const userApplications = await this.getUserApplications(userId);
    const now = new Date();
    const upcomingReminders = [];

    userApplications.forEach(app => {
      app.reminders.forEach(reminder => {
        if (!reminder.completed && new Date(reminder.timestamp) > now) {
          upcomingReminders.push({
            ...reminder,
            applicationId: app.id,
            jobTitle: app.jobInfo.title,
            company: app.jobInfo.company,
            status: app.status
          });
        }
      });
    });

    // Sort by timestamp
    upcomingReminders.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return upcomingReminders;
  }

  isValidStatusTransition(fromStatus, toStatus) {
    const validTransitions = {
      'draft': ['pending_approval', 'submitted', 'withdrawn'],
      'pending_approval': ['approved', 'rejected', 'withdrawn'],
      'approved': ['submitted', 'withdrawn'],
      'submitted': ['under_review', 'withdrawn'],
      'under_review': ['interview_scheduled', 'rejected', 'withdrawn'],
      'interview_scheduled': ['interview_completed', 'withdrawn'],
      'interview_completed': ['offer_received', 'rejected', 'withdrawn'],
      'offer_received': ['offer_accepted', 'offer_declined', 'withdrawn'],
      'offer_accepted': [],
      'offer_declined': [],
      'rejected': [],
      'withdrawn': [],
      'expired': []
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  updateAnalytics(application, newStatus, action) {
    // Update conversion stage based on status
    const stageMapping = {
      'submitted': 'applied',
      'under_review': 'screened',
      'interview_scheduled': 'interviewed',
      'interview_completed': 'interviewed',
      'offer_received': 'offered',
      'offer_accepted': 'hired'
    };

    const newStage = stageMapping[newStatus];
    if (newStage) {
      application.analytics.conversionStage = newStage;
    }

    // Increment views if action indicates viewing
    if (action === 'viewed_by_recruiter') {
      application.analytics.views++;
    }

    // Increment clicks if action indicates clicking
    if (action === 'clicked_by_recruiter') {
      application.analytics.clicks++;
    }
  }

  initializeStatusWorkflows() {
    return {
      'application_flow': [
        'draft',
        'pending_approval',
        'approved',
        'submitted',
        'under_review',
        'interview_scheduled',
        'interview_completed',
        'offer_received',
        'offer_accepted'
      ],
      'rejection_flow': [
        'draft',
        'pending_approval',
        'rejected'
      ],
      'withdrawal_flow': [
        'draft',
        'pending_approval',
        'approved',
        'submitted',
        'withdrawn'
      ]
    };
  }

  generateApplicationId() {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global application tracker instance
export const applicationTracker = new ApplicationTracker();
