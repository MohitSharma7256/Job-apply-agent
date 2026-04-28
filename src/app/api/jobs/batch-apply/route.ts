import { NextRequest, NextResponse } from 'next/server';
import { applyService } from '../@/services/applyService';
import { sheetService } from '../@/services/sheetService';
import { platformHealthService } from '../@/services/automation';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { jobs, profile, resumeText, rateLimit } = body as {
      jobs: any[];
      profile: any;
      resumeText?: string;
      rateLimit?: { maxPerHour: number };
    };

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'Jobs array is required' }, { status: 400 });
    }

    const results: any[] = [];
    let appliedCount = 0;
    const hourlyLimit = rateLimit?.maxPerHour || 10;
    let appliedThisEndpoint = 0;

    for (const job of jobs) {
      if (appliedThisEndpoint >= hourlyLimit) {
        results.push({ jobId: job.id, success: false, message: 'Hourly limit reached' });
        continue;
      }

      const canApply = await applyService.canApply();
      if (!canApply) {
        results.push({ jobId: job.id, success: false, message: 'Daily limit reached' });
        continue;
      }

      const result = await applyService.applyToJob(job, resumeText);
      const duration = Date.now() - startTime;

      if (result.success) {
        appliedCount++;
        appliedThisEndpoint++;
        
        platformHealthService.trackSuccess(job.platform, duration);
        
        const record = {
          id: uuidv4(),
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          platform: job.platform,
          appliedAt: new Date().toISOString(),
          status: 'applied',
        };

        try {
          await sheetService.addApplication(record);
        } catch (e) {}

        results.push({ jobId: job.id, success: true, message: result.message });
      } else {
        platformHealthService.trackFailure(job.platform, duration);
        results.push({ jobId: job.id, success: false, message: result.message });
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    return NextResponse.json({
      success: true,
      appliedCount,
      totalJobs: jobs.length,
      results,
      remainingToday: applyService.getRemainingApplications(),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
