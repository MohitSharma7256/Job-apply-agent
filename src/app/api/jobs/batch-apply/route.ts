import { NextRequest, NextResponse } from 'next/server';
import { automationService } from '@/services/automationService';
import { supabaseService } from '@/services/supabaseService';
import { Job, UserProfile } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const { jobs, profile } = await request.json() as { jobs: Job[], profile: UserProfile };

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs provided for batch apply' }, { status: 400 });
    }

    const results = [];
    console.log(`Starting batch application for ${jobs.length} jobs`);

    for (const job of jobs) {
      try {
        // Check if already applied
        const existingApp = await supabaseService.getApplicationByJobId(job.id);
        if (existingApp) {
          results.push({ jobId: job.id, success: true, message: 'Already applied' });
          continue;
        }

        const result = await automationService.applyToJob(job, profile);
        
        const appRecord = {
          id: uuidv4(),
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          platform: job.platform,
          appliedAt: new Date().toISOString(),
          status: result.success ? 'applied' : 'failed',
          notes: result.message
        };

        await supabaseService.saveApplication(appRecord);
        
        results.push({
          jobId: job.id,
          success: result.success,
          message: result.message
        });

        // Add a small delay between applications to avoid anti-bot measures
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error: any) {
        results.push({
          jobId: job.id,
          success: false,
          message: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalJobs: jobs.length,
      appliedCount: results.filter(r => r.success).length,
      results
    });

  } catch (error: any) {
    console.error('Batch apply error:', error);
    return NextResponse.json({ error: 'Batch application failed', message: error.message }, { status: 500 });
  }
}
