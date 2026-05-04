class ApplicationConfigService {
  constructor() {
    this.defaultConfig = {
      // AIHawk-inspired configuration
      MINIMUM_WAIT_TIME_IN_SECONDS: 60,
      JOB_APPLICATIONS_DIR: "job_applications",
      JOB_SUITABILITY_SCORE: 7,
      JOB_MAX_APPLICATIONS: 5,
      JOB_MIN_APPLICATIONS: 1,
      
      // Additional configurations
      MAX_APPLICATIONS_PER_DAY: 50,
      MAX_APPLICATIONS_PER_HOUR: 10,
      BLACKLISTED_COMPANIES: [],
      PREFERRED_COMPANIES: [],
      AUTO_APPLY_ENABLED: false,
      REQUIRE_MANUAL_REVIEW: true,
      
      // Platform-specific limits
      PLATFORM_LIMITS: {
        linkedin: { maxPerDay: 20, cooldownMinutes: 30 },
        indeed: { maxPerDay: 15, cooldownMinutes: 45 },
        naukri: { maxPerDay: 10, cooldownMinutes: 60 },
        glassdoor: { maxPerDay: 8, cooldownMinutes: 90 }
      },
      
      // Application timing
      APPLICATION_HOURS: {
        start: 9, // 9 AM
        end: 18   // 6 PM
      },
      WEEKEND_APPLICATIONS: false,
      HOLIDAY_APPLICATIONS: false
    };

    this.loadConfig();
  }

  // Load configuration from environment and localStorage
  loadConfig() {
    this.config = { ...this.defaultConfig };
    
    // Override with environment variables
    if (process.env.MINIMUM_WAIT_TIME) {
      this.config.MINIMUM_WAIT_TIME_IN_SECONDS = parseInt(process.env.MINIMUM_WAIT_TIME);
    }
    
    if (process.env.MAX_APPLICATIONS_PER_DAY) {
      this.config.MAX_APPLICATIONS_PER_DAY = parseInt(process.env.MAX_APPLICATIONS_PER_DAY);
    }
    
    if (process.env.AUTO_APPLY_ENABLED) {
      this.config.AUTO_APPLY_ENABLED = process.env.AUTO_APPLY_ENABLED === 'true';
    }
    
    // Load user-specific config from localStorage (client-side)
    if (typeof window !== 'undefined') {
      try {
        const savedConfig = localStorage.getItem('application_config');
        if (savedConfig) {
          const userConfig = JSON.parse(savedConfig);
          this.config = { ...this.config, ...userConfig };
        }
      } catch (error) {
        console.error('Error loading user config:', error);
      }
    }
  }

  // Save configuration
  saveConfig(updates) {
    this.config = { ...this.config, ...updates };
    
    // Save to localStorage (client-side)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('application_config', JSON.stringify(this.config));
      } catch (error) {
        console.error('Error saving config:', error);
      }
    }
  }

  // Get current configuration
  getConfig() {
    return { ...this.config };
  }

  // Check if application is allowed
  canApply(platform = null) {
    const now = new Date();
    
    // Check time restrictions
    if (!this.isWithinApplicationHours(now)) {
      return { allowed: false, reason: 'Outside application hours' };
    }
    
    if (!this.isWithinDateRestrictions(now)) {
      return { allowed: false, reason: 'Date restrictions apply' };
    }
    
    // Check daily limits
    const dailyCount = this.getTodayApplicationCount();
    if (dailyCount >= this.config.MAX_APPLICATIONS_PER_DAY) {
      return { allowed: false, reason: 'Daily application limit reached' };
    }
    
    // Check hourly limits
    const hourlyCount = this.getHourlyApplicationCount();
    if (hourlyCount >= this.config.MAX_APPLICATIONS_PER_HOUR) {
      return { allowed: false, reason: 'Hourly application limit reached' };
    }
    
    // Check platform-specific limits
    if (platform) {
      const platformLimit = this.config.PLATFORM_LIMITS[platform];
      if (platformLimit) {
        const platformDailyCount = this.getPlatformApplicationCount(platform);
        if (platformDailyCount >= platformLimit.maxPerDay) {
          return { allowed: false, reason: `Platform ${platform} daily limit reached` };
        }
        
        // Check cooldown period
        const lastApplication = this.getLastPlatformApplication(platform);
        if (lastApplication) {
          const timeDiff = (now - new Date(lastApplication)) / 1000 / 60; // minutes
          if (timeDiff < platformLimit.cooldownMinutes) {
            return { allowed: false, reason: `Platform ${platform} cooldown period active` };
          }
        }
      }
    }
    
    return { allowed: true };
  }

  // Check if current time is within application hours
  isWithinApplicationHours(date) {
    const currentHour = date.getHours();
    return currentHour >= this.config.APPLICATION_HOURS.start && 
           currentHour <= this.config.APPLICATION_HOURS.end;
  }

  // Check if date allows applications
  isWithinDateRestrictions(date) {
    const dayOfWeek = date.getDay();
    
    // Check weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      return this.config.WEEKEND_APPLICATIONS;
    }
    
    // Check holidays (simplified - would need holiday calendar)
    // For now, just return true
    return this.config.HOLIDAY_APPLICATIONS !== false;
  }

  // Get today's application count
  getTodayApplicationCount() {
    if (typeof window === 'undefined') return 0;
    
    try {
      const applications = JSON.parse(localStorage.getItem('job_applications') || '[]');
      const today = new Date().toDateString();
      return applications.filter(app => 
        new Date(app.appliedAt).toDateString() === today
      ).length;
    } catch (error) {
      return 0;
    }
  }

  // Get hourly application count
  getHourlyApplicationCount() {
    if (typeof window === 'undefined') return 0;
    
    try {
      const applications = JSON.parse(localStorage.getItem('job_applications') || '[]');
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return applications.filter(app => 
        new Date(app.appliedAt) > oneHourAgo
      ).length;
    } catch (error) {
      return 0;
    }
  }

  // Get platform-specific application count
  getPlatformApplicationCount(platform) {
    if (typeof window === 'undefined') return 0;
    
    try {
      const applications = JSON.parse(localStorage.getItem('job_applications') || '[]');
      const today = new Date().toDateString();
      return applications.filter(app => 
        app.platform === platform && 
        new Date(app.appliedAt).toDateString() === today
      ).length;
    } catch (error) {
      return 0;
    }
  }

  // Get last application time for platform
  getLastPlatformApplication(platform) {
    if (typeof window === 'undefined') return null;
    
    try {
      const applications = JSON.parse(localStorage.getItem('job_applications') || '[]');
      const platformApps = applications
        .filter(app => app.platform === platform)
        .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      
      return platformApps.length > 0 ? platformApps[0].appliedAt : null;
    } catch (error) {
      return null;
    }
  }

  // Record application
  recordApplication(application) {
    if (typeof window === 'undefined') return;
    
    try {
      const applications = JSON.parse(localStorage.getItem('job_applications') || '[]');
      const newApplication = {
        ...application,
        appliedAt: new Date().toISOString(),
        id: Date.now().toString()
      };
      
      applications.push(newApplication);
      localStorage.setItem('job_applications', JSON.stringify(applications));
      
      console.log('Application recorded:', newApplication);
    } catch (error) {
      console.error('Error recording application:', error);
    }
  }

  // Check if job meets minimum score requirements
  meetsScoreRequirements(job) {
    const score = job.score || job.matchScore || 0;
    return score >= this.config.JOB_SUITABILITY_SCORE;
  }

  // Check if company is blacklisted
  isCompanyBlacklisted(company) {
    return this.config.BLACKLISTED_COMPANIES.some(
      blacklisted => company.toLowerCase().includes(blacklisted.toLowerCase())
    );
  }

  // Check if company is preferred
  isCompanyPreferred(company) {
    return this.config.PREFERRED_COMPANIES.some(
      preferred => company.toLowerCase().includes(preferred.toLowerCase())
    );
  }

  // Get application statistics
  getApplicationStats() {
    if (typeof window === 'undefined') return null;
    
    try {
      const applications = JSON.parse(localStorage.getItem('job_applications') || '[]');
      const today = new Date().toDateString();
      const thisWeek = this.getWeekStart(new Date());
      const thisMonth = new Date().getMonth();
      
      const stats = {
        today: applications.filter(app => new Date(app.appliedAt).toDateString() === today).length,
        thisWeek: applications.filter(app => new Date(app.appliedAt) >= thisWeek).length,
        thisMonth: applications.filter(app => new Date(app.appliedAt).getMonth() === thisMonth).length,
        total: applications.length,
        byPlatform: {},
        byStatus: {},
        averageScore: 0
      };

      // Calculate platform breakdown
      applications.forEach(app => {
        const platform = app.platform || 'unknown';
        stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;
        
        const status = app.status || 'pending';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      });

      // Calculate average score
      const scoredApplications = applications.filter(app => app.score);
      if (scoredApplications.length > 0) {
        stats.averageScore = scoredApplications.reduce((sum, app) => sum + app.score, 0) / scoredApplications.length;
      }

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }

  // Get week start date
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Reset daily counters
  resetDailyCounters() {
    if (typeof window === 'undefined') return;
    
    try {
      // This would typically be called at midnight
      const today = new Date().toDateString();
      const lastReset = localStorage.getItem('last_counter_reset');
      
      if (lastReset !== today) {
        localStorage.setItem('last_counter_reset', today);
        console.log('Daily counters reset');
      }
    } catch (error) {
      console.error('Error resetting counters:', error);
    }
  }

  // Validate configuration
  validateConfig(config) {
    const errors = [];
    
    if (config.MAX_APPLICATIONS_PER_DAY < 1 || config.MAX_APPLICATIONS_PER_DAY > 100) {
      errors.push('MAX_APPLICATIONS_PER_DAY must be between 1 and 100');
    }
    
    if (config.MAX_APPLICATIONS_PER_HOUR < 1 || config.MAX_APPLICATIONS_PER_HOUR > 20) {
      errors.push('MAX_APPLICATIONS_PER_HOUR must be between 1 and 20');
    }
    
    if (config.JOB_SUITABILITY_SCORE < 0 || config.JOB_SUITABILITY_SCORE > 10) {
      errors.push('JOB_SUITABILITY_SCORE must be between 0 and 10');
    }
    
    if (config.MINIMUM_WAIT_TIME_IN_SECONDS < 30 || config.MINIMUM_WAIT_TIME_IN_SECONDS > 3600) {
      errors.push('MINIMUM_WAIT_TIME_IN_SECONDS must be between 30 and 3600');
    }
    
    return errors;
  }

  // Export configuration
  exportConfig() {
    return {
      config: this.config,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import configuration
  importConfig(configData) {
    try {
      const errors = this.validateConfig(configData.config);
      
      if (errors.length > 0) {
        return { success: false, errors };
      }
      
      this.saveConfig(configData.config);
      return { success: true };
    } catch (error) {
      return { success: false, errors: [error.message] };
    }
  }
}

export const applicationConfigService = new ApplicationConfigService();
