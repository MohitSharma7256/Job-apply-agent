import { NextRequest, NextResponse } from 'next/server';
import { applyService } from '@/services/applyService';
import { sheetService } from '@/services/sheetService';
import { notificationService } from '@/services/notificationService';
import { aiService } from '@/services/aiService';
import { Job, UserProfile, ApplicationRecord } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job, profile, resumeText, tailoredResume } = body as {
      job: Job;
      profile: UserProfile;
      resumeText?: string;
      tailoredResume?: string;
    };

    if (!job || !job.id) {
      return NextResponse.json(
        { error: 'Job object is required' },
        { status: 400 }
      );
    }

    const canApply = await applyService.canApply();
    if (!canApply) {
      return NextResponse.json(
        { error: 'Daily application limit reached', limit: 50 },
        { status: 429 }
      );
    }

    let finalResume = resumeText;
    if (!finalResume && profile && profile.resumeText) {
      finalResume = profile.resumeText;
    }

    if (finalResume && job.description) {
      try {
        const tailored = await aiService.tailorResume(job, profile, job.description);
        finalResume = tailored.tailoredContent;
      } catch (error) {
        console.error('Resume tailoring failed, using original:', error);
      }
    }

    const result = await applyService.applyToJob(job, finalResume);

    if (result.success) {
      const applicationRecord: ApplicationRecord = {
        id: uuidv4(),
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        platform: job.platform,
        appliedAt: new Date().toISOString(),
        resumeFile: tailoredResume || '',
        status: 'applied',
      };

      try {
        await sheetService.addApplication(applicationRecord);
      } catch (error) {
        console.error('Sheet update failed:', error);
      }

      try {
        await notificationService.sendApplicationNotification(job);
      } catch (error) {
        console.error('Notification failed:', error);
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        application: applicationRecord,
        remainingToday: applyService.getRemainingApplications(),
      });
    }

    return NextResponse.json(
      { success: false, error: result.message },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Apply error:', error);
    return NextResponse.json(
      { error: 'Application failed', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Apply API',
    dailyLimit: 50,
    remainingToday: applyService.getRemainingApplications(),
    endpoints: {
      POST: {
        description: 'Apply to a job',
        body: {
          job: 'Job object',
          profile: 'User profile object',
          resumeText: 'Optional: resume text for tailoring',
          tailoredResume: 'Optional: pre-tailored resume',
        },
      },
    },
  });
}