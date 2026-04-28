import axios from 'axios';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

export const jobQueueService = {
  queue: [] as any[],
  processing: false,
  isPaused: false,
  rateLimit: { current: 0, max: 50, window: 24 * 60 * 60 * 1000 },
  
  async addToQueue(job: any) {
    this.queue.push({
      ...job,
      status: 'queued',
      queuedAt: new Date().toISOString(),
      retryCount: 0
    });
    this.emitEvent('job.queued', { job });
    this.processNext();
  },

  async addBatch(jobs: any[]) {
    for (const job of jobs) {
      this.queue.push({
        ...job,
        status: 'queued',
        queuedAt: new Date().toISOString(),
        retryCount: 0
      });
    }
    this.emitEvent('job.batch_queued', { count: jobs.length });
    this.processNext();
  },

  async processNext() {
    if (this.processing || this.isPaused || this.queue.length === 0) return;
    if (this.rateLimit.current >= this.rateLimit.max) {
      console.log('Rate limit reached, pausing...');
      return;
    }

    this.processing = true;
    const job = this.queue[0];

    try {
      this.emitEvent('job.applying', { job });
      
      const response = await api.post('/apply', { job });
      
      if (response.data.success) {
        this.queue.shift();
        this.rateLimit.current++;
        this.emitEvent('job.applied', { job, remaining: this.getRemaining() });
        
        if (supabaseUrl && supabaseKey) {
          await this.logToSupabase(job, 'applied');
        }
      } else {
        await this.handleFailure(job, response.data.error);
      }
    } catch (error: any) {
      await this.handleFailure(job, error.message);
    }

    this.processing = false;
    setTimeout(() => this.processNext(), 2000);
  },

  async handleFailure(job: any, error: string) {
    job.retryCount++;
    
    if (job.retryCount < 3) {
      job.status = 'retrying';
      job.lastError = error;
      this.emitEvent('job.retrying', { job, retryCount: job.retryCount });
      setTimeout(() => this.processNext(), 5000);
    } else {
      job.status = 'failed';
      job.lastError = error;
      this.queue.shift();
      this.emitEvent('job.failed', { job, error });
      
      if (supabaseUrl && supabaseKey) {
        await this.logToSupabase(job, 'failed', error);
      }
    }
  },

  pause() {
    this.isPaused = true;
    this.emitEvent('queue.paused', {});
  },

  resume() {
    this.isPaused = false;
    this.processNext();
    this.emitEvent('queue.resumed', {});
  },

  clear() {
    this.queue = [];
    this.emitEvent('queue.cleared', {});
  },

  getRemaining() {
    return this.rateLimit.max - this.rateLimit.current;
  },

  getQueue() {
    return this.queue;
  },

  getStats() {
    return {
      queued: this.queue.filter(j => j.status === 'queued').length,
      processing: this.queue.filter(j => j.status === 'processing').length,
      failed: this.queue.filter(j => j.status === 'failed').length,
      rateLimit: this.getRemaining(),
      isPaused: this.isPaused
    };
  },

  async logToSupabase(job: any, status: string, error?: string) {
    try {
      await axios.post('/api/sheet', {
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        platform: job.platform,
        appliedAt: new Date().toISOString(),
        status,
        notes: error || null
      });
    } catch (e) {
      console.error('Log failed:', e);
    }
  },

  emitEvent(type: string, detail: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(type, { detail }));
    }
  }
};

export const autoApplyService = {
  enabled: false,
  minScore: 6,
  maxPerHour: 10,
  appliedThisHour: 0,
  hourResetTime: Date.now(),

  enable(config: { minScore?: number; maxPerHour?: number }) {
    this.enabled = true;
    if (config.minScore) this.minScore = config.minScore;
    if (config.maxPerHour) this.maxPerHour = config.maxPerHour;
    jobQueueService.emitEvent('autoapply.enabled', { minScore: this.minScore, maxPerHour: this.maxPerHour });
  },

  disable() {
    this.enabled = false;
    jobQueueService.emitEvent('autoapply.disabled', {});
  },

  shouldAutoApply(job: any): boolean {
    if (!this.enabled) return false;
    
    this.checkHourReset();
    
    if (this.appliedThisHour >= this.maxPerHour) {
      jobQueueService.emitEvent('autoapply.limit_reached', { hourLimit: this.maxPerHour });
      return false;
    }
    
    return (job.matchScore || 0) >= this.minScore && !job.applied;
  },

  checkHourReset() {
    const now = Date.now();
    if (now - this.hourResetTime > 3600000) {
      this.appliedThisHour = 0;
      this.hourResetTime = now;
    }
  },

  recordApply() {
    this.appliedThisHour++;
  },

  getConfig() {
    return {
      enabled: this.enabled,
      minScore: this.minScore,
      maxPerHour: this.maxPerHour,
      appliedThisHour: this.appliedThisHour,
      remaining: this.maxPerHour - this.appliedThisHour
    };
  }
};

export const platformHealthService = {
  health: {} as Record<string, { success: number; total: number; avgTime: number; lastCheck: string; status: 'healthy' | 'degraded' | 'unhealthy' }>,
  
  async trackSuccess(platform: string, duration: number) {
    if (!this.health[platform]) {
      this.health[platform] = { success: 0, total: 0, avgTime: 0, lastCheck: '', status: 'healthy' };
    }
    
    this.health[platform].total++;
    this.health[platform].success++;
    this.health[platform].avgTime = ((this.health[platform].avgTime * (this.health[platform].total - 1)) + duration) / this.health[platform].total;
    this.health[platform].lastCheck = new Date().toISOString();
    
    this.updateStatus(platform);
    this.emitEvent('platform.updated', { platform, health: this.health[platform] });
  },

  async trackFailure(platform: string, duration: number) {
    if (!this.health[platform]) {
      this.health[platform] = { success: 0, total: 0, avgTime: 0, lastCheck: '', status: 'healthy' };
    }
    
    this.health[platform].total++;
    this.health[platform].avgTime = ((this.health[platform].avgTime * (this.health[platform].total - 1)) + duration) / this.health[platform].total;
    this.health[platform].lastCheck = new Date().toISOString();
    
    this.updateStatus(platform);
    this.emitEvent('platform.updated', { platform, health: this.health[platform] });
  },

  updateStatus(platform: string) {
    const h = this.health[platform];
    const successRate = h.total > 0 ? (h.success / h.total) * 100 : 0;
    
    if (successRate >= 90 && h.avgTime < 5000) {
      h.status = 'healthy';
    } else if (successRate >= 70) {
      h.status = 'degraded';
    } else {
      h.status = 'unhealthy';
    }
  },

  getHealth(platform?: string) {
    if (platform) return this.health[platform];
    return this.health;
  },

  getAllPlatforms() {
    return Object.entries(this.health).map(([platform, health]) => ({
      platform,
      ...health
    }));
  },

  emitEvent(type: string, detail: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(type, { detail }));
    }
  }
};

export const resumeVariantService = {
  variants: [] as any[],

  addVariant(variant: { name: string; content: string; type: string }) {
    const newVariant = {
      ...variant,
      id: `resume_${Date.now()}`,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    this.variants.push(newVariant);
    localStorage.setItem('resume_variants', JSON.stringify(this.variants));
    this.emitEvent('resume.added', { variant: newVariant });
    return newVariant;
  },

  getVariant(id: string) {
    return this.variants.find(v => v.id === id);
  },

  selectBestForJob(job: any): any {
    if (this.variants.length === 0) return null;
    
    const relevantVariants = this.variants.filter(v => 
      v.type === job.jobType || v.type === 'general'
    );
    
    return relevantVariants.sort((a, b) => b.usageCount - a.usageCount)[0] || this.variants[0];
  },

  recordUsage(variantId: string) {
    const variant = this.variants.find(v => v.id === variantId);
    if (variant) {
      variant.usageCount++;
      localStorage.setItem('resume_variants', JSON.stringify(this.variants));
    }
  },

  loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('resume_variants');
      if (stored) {
        this.variants = JSON.parse(stored);
      }
    }
  },

  list() {
    return this.variants;
  },

  emitEvent(type: string, detail: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(type, { detail }));
    }
  }
};
