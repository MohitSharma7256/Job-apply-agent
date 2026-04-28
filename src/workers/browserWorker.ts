import { Worker } from 'bullmq';
import { connection } from '../lib/queue/jobQueue';
import { automationService } from '../services/automationService';
import { Job, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

export const startBrowserWorker = (io: any) => {
  const worker = new Worker('job-applications', async (bullJob) => {
    const { job, profile, userId } = bullJob.data as { job: Job; profile: UserProfile; userId: string };

    console.log(`[Worker] Processing Job: ${job.title} for ${userId}`);
    
    // Emit "Applying" event via Socket.io
    io.to(`user:${userId}`).emit('job:applying', { 
      jobId: job.id, 
      step: 'login' 
    });

    try {
      // Execute Playwright Automation
      const result = await automationService.applyToJob(job, profile);

      if (result.success) {
        console.log(`[Worker] Success: ${job.title}`);
        io.to(`user:${userId}`).emit('job:applied', { 
          jobId: job.id, 
          applicationId: result.message 
        });
        
        // Update DB
        await supabase
          .from('applications')
          .insert({
            user_id: userId,
            job_id: job.id,
            platform: job.platform,
            status: 'applied'
          });
          
      } else {
        console.error(`[Worker] Failed: ${result.message}`);
        
        if (result.reason === 'captcha') {
          io.to(`user:${userId}`).emit('captcha:detected', { 
            jobId: job.id, 
            platform: job.platform 
          });
        }

        io.to(`user:${userId}`).emit('job:failed', { 
          jobId: job.id, 
          reason: result.message 
        });
      }

    } catch (error: any) {
      console.error(`[Worker] Critical Error:`, error.message);
      io.to(`user:${userId}`).emit('job:failed', { 
        jobId: job.id, 
        reason: 'Internal Worker Error' 
      });
      throw error; // Let BullMQ handle retry
    }

  }, { connection, concurrency: 3 });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with ${err.message}`);
  });

  console.log('[Worker] Browser worker started and listening...');
  return worker;
};
