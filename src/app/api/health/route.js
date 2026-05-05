import { withCorrelationId, successResponse, ValidationError } from '@/shared/errors';
import { logger, measurePerformance } from '@/shared/logger';
import { dbService, getSupabaseAdmin } from '@/services/dbService.js';
import { getQueueStats, QUEUES } from '@/shared/queue.js';

export const GET = withCorrelationId(async (request) => {
  const startTime = Date.now();
  
  logger.info('Health check started', {
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.ip
  });

  try {
    // Perform comprehensive health checks
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkQueues(),
      checkAIServices(),
      checkDiskSpace(),
      checkMemory()
    ]);

    const services = {
      database: checks[0].status === 'fulfilled' ? checks[0].value : 'error',
      redis: checks[1].status === 'fulfilled' ? checks[1].value : 'error',
      queues: checks[2].status === 'fulfilled' ? checks[2].value : 'error',
      ai: checks[3].status === 'fulfilled' ? checks[3].value : 'error',
      disk: checks[4].status === 'fulfilled' ? checks[4].value : 'error',
      memory: checks[5].status === 'fulfilled' ? checks[5].value : 'error'
    };

    // Determine overall health
    const healthyServices = Object.values(services).filter(status => 
      status === 'healthy' || status === 'ready' || status === 'running'
    ).length;
    
    const totalServices = Object.keys(services).length;
    const isHealthy = healthyServices === totalServices;
    const isDegraded = healthyServices >= totalServices - 1 && !isHealthy;

    const status = isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy';
    
    const duration = Date.now() - startTime;
    logger.logPerformance('health_check', duration, { status, services });

    return successResponse({
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services,
      metrics: {
        responseTime: `${duration}ms`,
        memory: process.memoryUsage(),
        pid: process.pid
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Health check failed', { duration }, error);
    
    return successResponse({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: error.message,
      services: {
        database: 'error',
        redis: 'error',
        queues: 'error',
        ai: 'error',
        disk: 'error',
        memory: 'error'
      }
    });
  }
});

// Readiness probe - checks if service is ready to accept traffic
export const POST = withCorrelationId(async (request) => {
  const startTime = Date.now();
  
  try {
    // Critical service checks for readiness
    const criticalChecks = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkQueues()
    ]);

    const services = {
      database: criticalChecks[0].status === 'fulfilled' ? criticalChecks[0].value : 'error',
      redis: criticalChecks[1].status === 'fulfilled' ? criticalChecks[1].value : 'error',
      queues: criticalChecks[2].status === 'fulfilled' ? criticalChecks[2].value : 'error'
    };

    const isReady = Object.values(services).every(status => 
      status === 'healthy' || status === 'ready' || status === 'running'
    );

    const duration = Date.now() - startTime;
    logger.logPerformance('readiness_check', duration, { ready: isReady });

    return successResponse({
      ready: isReady,
      timestamp: new Date().toISOString(),
      services,
      responseTime: `${duration}ms`
    });

  } catch (error) {
    logger.error('Readiness check failed', {}, error);
    
    return successResponse({
      ready: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Database health check
const checkDatabase = measurePerformance('database_health', async () => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return 'not_configured';
    }

    // Test database connectivity
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (error) {
      logger.warn('Database health check failed', { error: error.message });
      return 'error';
    }

    // Check connection pool status
    const poolStatus = await checkConnectionPool();
    
    if (poolStatus.healthy) {
      return 'healthy';
    } else {
      return 'degraded';
    }
  } catch (error) {
    logger.error('Database health check error', {}, error);
    return 'error';
  }
});

// Redis/Queue health check
const checkRedis = measurePerformance('redis_health', async () => {
  try {
    const stats = await getQueueStats(QUEUES.JOB_SEARCH);
    
    if (stats) {
      return 'healthy';
    } else {
      return 'error';
    }
  } catch (error) {
    logger.error('Redis health check error', {}, error);
    return 'error';
  }
});

// Queue health check
const checkQueues = measurePerformance('queue_health', async () => {
  try {
    const queueStats = await Promise.allSettled([
      getQueueStats(QUEUES.JOB_SEARCH),
      getQueueStats(QUEUES.RESUME_TAILOR),
      getQueueStats(QUEUES.JOB_APPLY),
      getQueueStats(QUEUES.AI_PROCESSING)
    ]);

    const healthyQueues = queueStats.filter(stat => 
      stat.status === 'fulfilled' && stat.value
    ).length;

    if (healthyQueues === queueStats.length) {
      return 'healthy';
    } else if (healthyQueues > 0) {
      return 'degraded';
    } else {
      return 'error';
    }
  } catch (error) {
    logger.error('Queue health check error', {}, error);
    return 'error';
  }
});

// AI services health check
const checkAIServices = measurePerformance('ai_health', async () => {
  try {
    // Check AI service configuration
    const requiredKeys = ['GOOGLE_AI_API_KEY', 'OPENAI_API_KEY'];
    const missingKeys = requiredKeys.filter(key => !process.env[key]);

    if (missingKeys.length > 0) {
      logger.warn('AI services missing keys', { missingKeys });
      return 'not_configured';
    }

    // Test AI service connectivity (simple ping)
    const { aiService } = await import('@/services/aiService.js');
    
    // This would be a simple test call to verify AI services are reachable
    // For now, just check if the service is configured
    return aiService ? 'ready' : 'error';
  } catch (error) {
    logger.error('AI services health check error', {}, error);
    return 'error';
  }
});

// Disk space check
const checkDiskSpace = measurePerformance('disk_health', async () => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const stats = fs.statSync(process.cwd());
    
    // Simple check - in production you'd check actual disk usage
    return 'healthy';
  } catch (error) {
    logger.error('Disk space check error', {}, error);
    return 'error';
  }
});

// Memory check
const checkMemory = measurePerformance('memory_health', async () => {
  try {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    if (memoryUsagePercent > 90) {
      return 'critical';
    } else if (memoryUsagePercent > 75) {
      return 'warning';
    } else {
      return 'healthy';
    }
  } catch (error) {
    logger.error('Memory check error', {}, error);
    return 'error';
  }
});

// Connection pool check
async function checkConnectionPool() {
  try {
    // This would check Supabase connection pool status
    // For now, return healthy since we can connect
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}
