import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const runtime = 'nodejs';

interface PlatformHealth {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  latency: number;
  lastCheck: string;
  sessionStatus: 'active' | 'expired' | 'not_configured';
}

export async function GET(request: NextRequest) {
  try {
    const checks: Record<string, any> = {};
    let allHealthy = true;

    const dbStart = Date.now();
    try {
      await supabase.from('users').select('id').limit(1);
      checks.database = {
        status: 'healthy',
        latency: Date.now() - dbStart,
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: 'Connection failed',
      };
      allHealthy = false;
    }

    const redisStart = Date.now();
    try {
      const redis = (await import('@/lib/redis')).getRedis();
      await redis.ping();
      checks.redis = {
        status: 'healthy',
        latency: Date.now() - redisStart,
      };
    } catch (error: any) {
      checks.redis = {
        status: 'unhealthy',
        error: error.message,
      };
      allHealthy = false;
    }

    try {
      const { Queue } = await import('bullmq');
      const connection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      };
      const queue = new Queue('job-apply', { connection });
      const counts = await queue.getJobCounts();
      checks.queue = {
        status: 'healthy',
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
      };
    } catch (error: any) {
      checks.queue = {
        status: 'degraded',
        error: error.message,
      };
    }

    const platforms: PlatformHealth[] = [];
    const platformList = ['linkedin', 'indeed', 'naukri', 'glassdoor'];

    for (const platform of platformList) {
      const sessionStart = Date.now();
      try {
        const { data: session } = await supabase
          .from('platform_sessions')
          .select('expiresAt, status')
          .eq('platform', platform)
          .order('createdAt', { ascending: false })
          .limit(1)
          .single();

        const sessionExpired = session ? new Date(session.expiresAt) < new Date() : true;

        platforms.push({
          name: platform,
          status: session && !sessionExpired ? 'online' : 'offline',
          latency: Date.now() - sessionStart,
          lastCheck: session?.createdAt || 'Never',
          sessionStatus: sessionExpired ? 'expired' : session ? 'active' : 'not_configured',
        });
      } catch {
        platforms.push({
          name: platform,
          status: 'offline',
          latency: Date.now() - sessionStart,
          lastCheck: 'Never',
          sessionStatus: 'not_configured',
        });
      }
    }
    checks.platforms = platforms;

    const memoryUsage = process.memoryUsage();
    checks.system = {
      uptime: process.uptime(),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
    };

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    });

  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}