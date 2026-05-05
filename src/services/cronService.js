import cron from 'node-cron';
import { getSupabaseAdmin } from './dbService.js';

class CronService {
  constructor() {
    this.jobs = [];
  }

  // Keep account active - ping every 15 minutes
  startKeepAliveCron() {
    console.log('[Cron] Starting keep-alive cron job (every 15 minutes)');
    
    const job = cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('[Cron] Running keep-alive ping at', new Date().toISOString());
        
        // Ping Supabase to keep connection alive
        const supabase = getSupabaseAdmin();
        if (!supabase) {
          console.error('[Cron] Supabase not available for keep-alive');
          return;
        }
        
        const { data, error } = await supabase
          .from('jobs')
          .select('id')
          .limit(1);
        
        if (error) {
          console.error('[Cron] Keep-alive ping failed:', error.message);
        } else {
          console.log('[Cron] Keep-alive successful - server is active');
        }
        
        // Also ping a health check endpoint if available
        try {
          const healthCheck = await fetch('http://localhost:3000/api/health');
          if (healthCheck.ok) {
            console.log('[Cron] Health check passed');
          }
        } catch (e) {
          // Ignore health check errors - internal ping
        }
        
      } catch (error) {
        console.error('[Cron] Keep-alive error:', error);
      }
    });
    
    this.jobs.push(job);
    console.log('[Cron] Keep-alive cron scheduled successfully');
  }

  // Optional: Daily stats cleanup job
  startDailyStatsCron() {
    console.log('[Cron] Starting daily stats cron job');
    
    const job = cron.schedule('0 0 * * *', async () => {
      try {
        console.log('[Cron] Running daily stats update at', new Date().toISOString());
        
        // Update any daily stats or cleanup tasks
        const today = new Date().toISOString().split('T')[0];
        console.log('[Cron] Daily cron executed for date:', today);
        
      } catch (error) {
        console.error('[Cron] Daily stats error:', error);
      }
    });
    
    this.jobs.push(job);
  }

  // Start all cron jobs
  startAll() {
    this.startKeepAliveCron();
    // Uncomment if you need daily stats
    // this.startDailyStatsCron();
  }

  // Stop all cron jobs
  stopAll() {
    console.log('[Cron] Stopping all cron jobs');
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
  }
}

export const cronService = new CronService();
