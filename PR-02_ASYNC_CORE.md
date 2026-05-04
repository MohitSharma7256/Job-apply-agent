# PR-02: Async Core Implementation

## Summary
This PR introduces a robust async execution plane using BullMQ for all long-running operations. The system now processes job searches, resume tailoring, and applications asynchronously with immediate API responses, comprehensive job tracking, and reliable retry mechanisms.

## Files Changed

### Queue Infrastructure
- `src/shared/queue.js` - BullMQ queue setup, job tracking, idempotency management
- `workers/index.js` - Worker process setup with concurrency control
- `workers/processors/` - Job processors for each queue type
  - `jobSearchProcessor.js` - Job search processing with AI scoring
  - `resumeTailorProcessor.js` - Resume tailoring and cover letter generation
  - `jobApplyProcessor.js` - Job application automation
  - `aiProcessor.js` - General AI request processing
  - `webAutomationProcessor.js` - Playwright automation in worker context

### API Updates
- `src/app/api/jobs/search/route.js` - Async job search with jobId response
- `src/app/api/ai/tailor/route.js` - Async resume tailoring with jobId response
- `src/app/api/jobs/[id]/apply/route.js` - Async job application with jobId response
- `src/app/api/jobs/[jobId]/status/route.js` - Job status and management endpoint
- `src/app/api/queue/stats/route.js` - Queue statistics for admin monitoring

### Infrastructure & Scripts
- `server.js` - Queue initialization and worker startup
- `package.json` - Added worker and queue management scripts
- `scripts/clean-queues.js` - Queue cleanup utility

## Why This Change

### 1. Non-blocking API Performance
- **Immediate Responses**: All long-running operations return jobId instantly
- **User Experience**: No more waiting for AI processing or web automation
- **Scalability**: Request threads are freed up immediately for new requests

### 2. Reliable Async Processing
- **Job Queues**: Separate queues for different operation types with proper concurrency
- **Retry Logic**: Exponential backoff with configurable retry attempts
- **Dead Letter Queue**: Failed jobs are isolated for analysis and retry
- **Job Lifecycle**: Complete tracking from queued → processing → completed/failed

### 3. Production-Grade Worker Architecture
- **Concurrency Control**: Different worker pools for different operation types
- **Resource Management**: Playwright runs in isolated worker context
- **Error Handling**: Comprehensive error capture and reporting
- **Graceful Shutdown**: Proper cleanup of workers and queues

### 4. Idempotency & Reliability
- **Idempotency Keys**: Prevent duplicate processing of identical requests
- **Job Persistence**: Job state survives server restarts via Redis
- **Status Tracking**: Real-time job status with detailed progress information

## Architecture Overview

### Control Plane (Next.js API)
```
API Request → Validation → Queue Job → Immediate Response (jobId)
                ↓
         Status Check → Job Status from Database
```

### Execution Plane (BullMQ Workers)
```
Queue → Worker → Processor → Database Update → Result Storage
         ↓
    Retry Logic → Dead Letter Queue (if failed)
```

### Data Plane
```
Job Status → ai_activities table
Results → JSON storage in database
Metrics → processing_time_ms, tokens_used, cost_cents
```

## Migration Notes

### Breaking Changes
- **API Response Format**: All async endpoints now return `{ jobId, status, estimatedDuration }`
- **Status Polling**: Clients must poll `/api/jobs/{jobId}/status` for results
- **Authentication Required**: All job operations now require valid JWT tokens

### New Response Format
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "queue": "job-search",
    "status": "queued",
    "estimatedDuration": "30-60 seconds",
    "checkUrl": "/api/jobs/{jobId}/status"
  },
  "meta": {
    "message": "Job search queued successfully",
    "idempotencyKey": "uuid-string"
  }
}
```

### Status Response Format
```json
{
  "success": true,
  "data": {
    "id": "job-uuid",
    "type": "job_search",
    "status": "completed",
    "input": { ... },
    "output": { ... },
    "error": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:01:00Z",
    "processingTimeMs": 45000,
    "tokensUsed": 1250,
    "costCents": 0.15
  }
}
```

## Test Plan

### Queue Operations Tests
- [ ] Jobs are properly queued and return valid jobId
- [ ] Job status updates correctly through lifecycle
- [ ] Failed jobs are retried with exponential backoff
- [ ] Dead letter queue captures permanently failed jobs

### API Integration Tests
- [ ] POST requests return immediate jobId response
- [ ] GET requests return correct job status
- [ ] Invalid jobId returns proper error response
- [ ] Authentication prevents access to other users' jobs

### Worker Performance Tests
- [ ] Workers process jobs concurrently without interference
- [ ] Playwright automation runs successfully in worker context
- [ ] AI processing completes with proper metrics
- [ ] Memory usage remains stable under load

### Idempotency Tests
- [ ] Duplicate requests with same idempotencyKey return cached results
- [ ] Different idempotencyKey creates new jobs
- [ ] Idempotency works across different job types

## Risk Assessment & Rollback Plan

### Risks
1. **Redis Dependency**: Queue system requires Redis for persistence
2. **Worker Isolation**: Workers run as separate processes
3. **API Changes**: Client applications need updates for async pattern
4. **Job State**: Complex state management requires proper monitoring

### Rollback Plan
1. **API Routes**: Revert to synchronous processing in existing endpoints
2. **Queue System**: Disable queue initialization in server.js
3. **Workers**: Stop worker processes
4. **Database**: Job tracking data can remain for audit purposes

### Monitoring Requirements
- **Queue Depth**: Monitor queue sizes and processing times
- **Worker Health**: Track worker process status and restarts
- **Job Metrics**: Monitor success/failure rates and processing times
- **Redis Performance**: Monitor Redis memory and connection usage

## Configuration

### Environment Variables
```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Queue Configuration (optional)
QUEUE_CONCURRENCY_JOB_SEARCH=2
QUEUE_CONCURRENCY_RESUME_TAILOR=3
QUEUE_CONCURRENCY_JOB_APPLY=1
QUEUE_CONCURRENCY_AI_PROCESSING=5
QUEUE_CONCURRENCY_WEB_AUTOMATION=2
```

### Worker Configuration
- **Concurrency**: Each queue type has configurable worker concurrency
- **Retry Policy**: Default 3 attempts with exponential backoff
- **Job Retention**: 100 completed jobs, 50 failed jobs per queue
- **Timeout**: Configurable per job type

## Performance Improvements

### Before (Synchronous)
- Job Search: 30-60 seconds blocking
- Resume Tailor: 45-90 seconds blocking  
- Job Apply: 2-5 minutes blocking
- Request Thread: Occupied entire duration

### After (Asynchronous)
- Job Search: <100ms response, 30-60 seconds processing
- Resume Tailor: <100ms response, 45-90 seconds processing
- Job Apply: <100ms response, 2-5 minutes processing
- Request Thread: Freed immediately

### Throughput Gains
- **Concurrent Processing**: Multiple jobs processed simultaneously
- **Resource Efficiency**: Request threads handle 10-100x more requests
- **User Experience**: Immediate feedback with progress tracking
- **Scalability**: Horizontal scaling via worker processes

## Dependencies
- **BullMQ**: Queue management and job processing
- **Redis**: Job state persistence and coordination
- **UUID**: Job and idempotency key generation
- **Playwright**: Web automation in worker context

## Next Steps
This async core enables the subsequent phases:
- **PR-03**: Real-time system with Socket.IO for live job updates
- **PR-04**: Observability, testing, and CI/CD with queue monitoring

The async execution plane provides the foundation for a truly scalable, production-ready job application platform that can handle high-volume processing without blocking user interactions.
