import { queues, shutdownQueues } from '../src/shared/queue.js';

async function cleanQueues() {
  console.log('🧹 Cleaning BullMQ queues...');
  
  try {
    // Clean all queues
    for (const [name, queue] of Object.entries(queues)) {
      console.log(`🧹 Cleaning queue: ${name}`);
      
      // Clear waiting jobs
      await queue.clean(0, 0, 'waiting');
      
      // Clear active jobs (force cleanup)
      await queue.clean(0, 0, 'active');
      
      // Clear completed jobs older than 24 hours
      await queue.clean(24 * 60 * 60 * 1000, 0, 'completed');
      
      // Clear failed jobs older than 7 days
      await queue.clean(7 * 24 * 60 * 60 * 1000, 0, 'failed');
      
      console.log(`✅ Queue ${name} cleaned`);
    }
    
    console.log('🎉 All queues cleaned successfully!');
    
  } catch (error) {
    console.error('❌ Failed to clean queues:', error);
    process.exit(1);
  } finally {
    await shutdownQueues();
  }
}

// Run cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanQueues();
}

export { cleanQueues };
