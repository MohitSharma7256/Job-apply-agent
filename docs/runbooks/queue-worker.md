# Queue Worker Runbook

## Overview

This runbook covers procedures for managing BullMQ queue workers in the Job Apply Agent system.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Control Plane │    │ Execution Plane   │    │   Data Plane    │
│                 │    │                  │    │                │
│ Next.js API     │◄──►│ BullMQ Workers    │◄──►│ Redis Queue     │
│ + Socket.IO     │    │ + Processors      │    │ + Job State     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Queue Types

| Queue | Purpose | Concurrency | Retry Policy |
|-------|---------|-------------|--------------|
| `job-search` | Job search and AI scoring | 2 | 3 attempts, exponential backoff |
| `resume-tailor` | Resume and cover letter generation | 3 | 3 attempts, exponential backoff |
| `job-apply` | Automated job applications | 1 | 3 attempts, exponential backoff |
| `ai-processing` | General AI service calls | 5 | 3 attempts, exponential backoff |
| `web-automation` | Playwright browser automation | 2 | 3 attempts, exponential backoff |
| `dead-letter` | Failed jobs for analysis | 1 | No retry |

## Monitoring

### Health Checks

```bash
# Check overall queue health
curl http://localhost:3000/api/health

# Check queue statistics (admin only)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:3000/api/queue/stats
```

### Log Monitoring

Workers use structured logging with correlation IDs:

```bash
# Monitor worker logs
tail -f logs/worker.log | jq '.level == "ERROR"'

# Monitor specific queue
tail -f logs/worker.log | jq '.queue == "job-search"'

# Monitor failed jobs
tail -f logs/worker.log | jq '.status == "failed"'
```

### Metrics to Monitor

- **Queue Depth**: Number of jobs waiting in each queue
- **Processing Rate**: Jobs processed per minute
- **Error Rate**: Percentage of failed jobs
- **Processing Time**: Average time per job type
- **Worker Health**: CPU and memory usage

## Common Issues & Solutions

### Workers Not Processing Jobs

**Symptoms:**
- Queue depth increasing
- No job completion events
- Jobs stuck in "queued" status

**Diagnostics:**
```bash
# Check worker process status
ps aux | grep "node workers/index.js"

# Check Redis connection
redis-cli ping

# Check queue stats
npm run queue:stats

# Check worker logs
tail -f logs/worker.log
```

**Solutions:**
1. **Restart Workers**
   ```bash
   # Stop existing workers
   pkill -f "node workers/index.js"
   
   # Start new workers
   npm run worker
   ```

2. **Check Redis Connection**
   ```bash
   # Verify Redis is running
   redis-cli ping
   
   # Check Redis memory
   redis-cli info memory
   ```

3. **Clear Stuck Jobs**
   ```bash
   # Clean old stuck jobs
   npm run queue:clean
   ```

### High Error Rate

**Symptoms:**
- Many jobs failing
- Dead-letter queue filling up
- Error notifications increasing

**Diagnostics:**
```bash
# Check error logs
tail -f logs/worker.log | jq '.level == "ERROR"'

# Check dead-letter queue
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:3000/api/queue/dead-letter

# Check AI service status
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:3000/api/health
```

**Solutions:**
1. **Identify Root Cause**
   ```bash
   # Analyze error patterns
   tail -f logs/worker.log | jq '.error.message' | sort | uniq -c
   ```

2. **Check External Dependencies**
   - AI service API keys and quotas
   - Database connection status
   - Redis memory usage

3. **Pause Processing**
   ```bash
   # Stop workers to prevent cascading failures
   pkill -f "node workers/index.js"
   ```

4. **Retry Failed Jobs**
   ```bash
   # Move jobs from dead-letter back to main queue
   node scripts/retry-dead-letter.js
   ```

### Memory Issues

**Symptoms:**
- Workers consuming high memory
- Out of memory errors
- Slow processing

**Diagnostics:**
```bash
# Check memory usage
ps aux | grep "node workers/index.js" | awk '{print $4}'

# Monitor memory trends
top -p $(pgrep -f "node workers/index.js")
```

**Solutions:**
1. **Reduce Concurrency**
   ```bash
   # Update worker concurrency in environment
   export QUEUE_CONCURRENCY_JOB_SEARCH=1
   export QUEUE_CONCURRENCY_RESUME_TAILOR=1
   ```

2. **Restart Workers**
   ```bash
   pkill -f "node workers/index.js"
   sleep 5
   npm run worker
   ```

3. **Monitor Memory Leaks**
   ```bash
   # Use Node.js memory profiling
   node --inspect workers/index.js
   ```

## Maintenance Procedures

### Daily Tasks

**Morning Check:**
```bash
# Check queue health
npm run queue:stats

# Check error rate in last 24h
tail -n 1000 logs/worker.log | jq '.level == "ERROR"' | wc -l

# Check worker processes
ps aux | grep "node workers/index.js" | wc -l
```

**Evening Check:**
```bash
# Clean old completed jobs
npm run queue:clean

# Check Redis memory usage
redis-cli info memory | grep used_memory_human
```

### Weekly Tasks

**Performance Review:**
```bash
# Analyze processing times
grep "processing_time_ms" logs/worker.log | jq '.processing_time_ms' | \
  awk '{sum+=$1; count++} END {print "Avg:", sum/count "ms"}'

# Check error trends
grep "ERROR" logs/worker.log | jq '.timestamp' | cut -d'T' -f1 | sort | uniq -c
```

**Capacity Planning:**
```bash
# Monitor queue growth trends
npm run queue:stats -- --history 7d

# Check worker utilization
top -b -n 1 | grep "node workers/index.js"
```

### Monthly Tasks

**Database Maintenance:**
```bash
# Archive old job records
node scripts/archive-jobs.js --older-than 30d

# Optimize database
npm run db:optimize
```

**Security Updates:**
```bash
# Update dependencies
npm audit fix

# Restart workers with updates
pkill -f "node workers/index.js"
npm run worker
```

## Emergency Procedures

### Queue System Down

**Impact:** All job processing stops
**Priority:** Critical

**Immediate Actions:**
1. **Check System Status**
   ```bash
   # Check all components
   curl http://localhost:3000/api/health
   redis-cli ping
   ps aux | grep "node workers/index.js"
   ```

2. **Restart Services**
   ```bash
   # Stop all processes
   pkill -f "node workers/index.js"
   pkill -f "node server.js"
   
   # Start services
   npm start &
   npm run worker &
   ```

3. **Verify Recovery**
   ```bash
   # Test job processing
   curl -X POST http://localhost:3000/api/jobs/search \
     -H "Authorization: Bearer TEST_TOKEN" \
     -d '{"keywords": "test"}'
   ```

### High Queue Depth

**Impact:** Delayed job processing
**Priority:** High

**Scaling Actions:**
1. **Increase Worker Concurrency**
   ```bash
   export QUEUE_CONCURRENCY_JOB_SEARCH=4
   export QUEUE_CONCURRENCY_RESUME_TAILOR=6
   pkill -f "node workers/index.js"
   npm run worker
   ```

2. **Add More Workers**
   ```bash
   # Start additional worker processes
   npm run worker &
   npm run worker &
   npm run worker &
   ```

3. **Monitor Progress**
   ```bash
   watch -n 30 'npm run queue:stats'
   ```

### Data Corruption

**Impact:** Job state inconsistencies
**Priority:** Critical

**Recovery Actions:**
1. **Stop All Processing**
   ```bash
   pkill -f "node workers/index.js"
   ```

2. **Backup Current State**
   ```bash
   # Export queue data
   node scripts/export-queue-state.js
   
   # Backup database
   npm run db:backup
   ```

3. **Clean and Reset**
   ```bash
   # Clear corrupted queues
   npm run queue:clean --force
   
   # Reset job states
   node scripts/reset-job-states.js
   ```

4. **Restore Processing**
   ```bash
   npm run worker
   ```

## Performance Tuning

### Concurrency Settings

**Default Settings:**
```bash
QUEUE_CONCURRENCY_JOB_SEARCH=2
QUEUE_CONCURRENCY_RESUME_TAILOR=3
QUEUE_CONCURRENCY_JOB_APPLY=1
QUEUE_CONCURRENCY_AI_PROCESSING=5
QUEUE_CONCURRENCY_WEB_AUTOMATION=2
```

**Tuning Guidelines:**
- **CPU-intensive tasks** (AI processing): Lower concurrency
- **I/O-intensive tasks** (Web automation): Higher concurrency
- **Rate-limited APIs** (External services): Lower concurrency

### Memory Optimization

**Settings:**
```bash
NODE_OPTIONS="--max-old-space-size=2048"
QUEUE_JOB_RETENTION=24h
QUEUE_COMPLETED_LIMIT=100
QUEUE_FAILED_LIMIT=50
```

**Monitoring:**
```bash
# Memory usage by queue
ps aux | grep "node workers/index.js" | \
  while read line; do
    pid=$(echo $line | awk '{print $2}')
    mem=$(echo $line | awk '{print $4}')
    echo "PID: $pid, Memory: $mem%"
  done
```

## Troubleshooting Checklist

### Before Escalation

- [ ] Check worker process status
- [ ] Verify Redis connectivity
- [ ] Check queue statistics
- [ ] Review recent error logs
- [ ] Verify environment variables
- [ ] Check system resources (CPU, memory, disk)

### Escalation Information

**Include in escalation:**
- Queue statistics output
- Recent error logs (last 100 lines)
- System resource usage
- Steps already taken
- Time of issue onset
- Business impact assessment

### Contact Information

- **Primary Ops Team**: ops-team@company.com
- **On-call Engineer**: +1-555-123-4567
- **Slack Channel**: #queue-emergencies

## Scripts and Tools

### Queue Management Scripts

```bash
# Clean old jobs
npm run queue:clean

# View queue stats
npm run queue:stats

# Export queue state
node scripts/export-queue-state.js

# Retry failed jobs
node scripts/retry-failed-jobs.js

# Monitor queues
node scripts/monitor-queues.js
```

### Debug Tools

```bash
# Worker process inspection
node --inspect workers/index.js

# Queue inspection
node scripts/inspect-queue.js --queue job-search

# Job tracing
node scripts/trace-job.js --job-id <job-id>
```

## Documentation References

- [Architecture Guide](../architecture.md)
- [API Documentation](../api.md)
- [Database Runbook](database.md)
- [Incident Response](incident-response.md)
