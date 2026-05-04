import { withCorrelationId, successResponse } from '@/shared/errors';
import { withAuth, requireRole } from '@/shared/auth';
import { getQueueStats, QUEUES } from '@/shared/queue';

export const GET = withCorrelationId(withAuth(requireRole('admin')(async (request) => {
  const { searchParams } = new URL(request.url);
  const queueName = searchParams.get('queue');
  
  if (queueName) {
    if (!Object.values(QUEUES).includes(queueName)) {
      throw new ValidationError(`Invalid queue: ${queueName}`);
    }
    
    const stats = await getQueueStats(queueName);
    return successResponse(stats);
  }
  
  // Get stats for all queues
  const allStats = await Promise.all(
    Object.values(QUEUES).map(queue => getQueueStats(queue))
  );
  
  return successResponse({
    queues: allStats,
    summary: {
      totalWaiting: allStats.reduce((sum, stats) => sum + stats.waiting, 0),
      totalActive: allStats.reduce((sum, stats) => sum + stats.active, 0),
      totalCompleted: allStats.reduce((sum, stats) => sum + stats.completed, 0),
      totalFailed: allStats.reduce((sum, stats) => sum + stats.failed, 0),
      totalJobs: allStats.reduce((sum, stats) => sum + stats.total, 0)
    }
  });
})));
