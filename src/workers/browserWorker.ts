import { Worker } from 'bullmq';
<<<<<<< HEAD
import { Server } from 'socket.io';
import { supabase } from '../services/dbService';
import { automationService } from '../services/automationService';
=======
import { connection } from '../lib/queue/jobQueue';
import { automationService } from '../services/automationService';
import { Job, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
>>>>>>> 481e67f124cff80e7d69b8d4b907e3c632da42d2

export const startBrowserWorker = (io: Server) => {
  const worker = new Worker('browser-queue', async (job) => {
    const { userId, jobId, jobData, profile } = job.data;
    
    console.log(`[Worker] Processing job ${jobId} for user ${userId}`);

    try {
      // Inject cookies, emit "Applying" event via Socket.io
      io.to(`user:${userId}`).emit('job:status', {
        jobId,
        status: 'applying',
        message: `Applying to ${jobData.company}...`
      });

      // 2. Execute Playwright Automation
      const result = await automationService.applyToJob(jobData, profile, userId);

      if (result.success) {
        // 3. Update DB
        await supabase
          .from('applications')
          .update({ status: 'applied', appliedAt: new Date().toISOString() })
          .eq('jobId', jobId)
          .eq('userId', userId);

        // 4. Emit success
        io.to(`user:${userId}`).emit('job:status', {
          jobId,
          status: 'applied',
          message: `Successfully applied to ${jobData.company}!`
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error(`[Worker] Job ${jobId} failed:`, error.message);
      
      io.to(`user:${userId}`).emit('job:status', {
        jobId,
        status: 'failed',
        message: `Failed: ${error.message}`
      });

      throw error; // Let BullMQ handle retry
    }
  }, {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    }
  });

  return worker;
};
