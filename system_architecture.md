# Job Apply Agent: System Architecture & Optimization Plan

This document outlines the current state of the Job Apply Agent, breaking down the architecture, execution flows, and a roadmap for achieving production-grade stability and scale.

## 1. Project Overview
**Purpose**: An automated, AI-driven agent that manages the entire job application lifecycle. It parses user resumes, searches for relevant jobs, tailors cover letters/resumes using AI (Gemini/OpenAI), and automatically submits applications via web automation.
**Core Features**:
- Real-time Resume/Asset Management (Supabase Storage)
- AI Tailoring & Content Generation (AI API Integrations)
- Web Automation for Job Applications
- Real-time Job Tracking Dashboard

---

## 2. Current Architecture
The system currently utilizes a **Monolithic Architecture** running inside a Next.js custom server environment.

- **Frontend**: Next.js (App Router) with Tailwind CSS and React components.
- **Backend**: Node.js custom server (`server.js`) running Next.js alongside Socket.IO and BullMQ.
- **Database/Storage**: Supabase (PostgreSQL & S3-compatible Blob Storage).
- **Queueing Engine**: BullMQ powered by Redis.
- **Worker Location**: **Same Server**. The `server.js` file imports and initializes the BullMQ workers in the same process as the HTTP server.

> [!WARNING]
> Running heavy background workers (like Web Automation) in the same Node.js process as your Next.js web server on a free/low-tier hosting plan is the root cause of CPU spikes and memory exhaustion.

---

## 3. Execution Flow (Step-by-Step)
**Example: User starts an AI Job Application**
1. **Trigger**: User clicks "Apply via AI" on the dashboard.
2. **API**: Next.js API route (`/api/jobs/apply`) receives the request.
3. **Queueing**: The API calls `addJob()` which inserts the job payload into the `job-apply` Redis queue via BullMQ and creates a tracking record in Supabase.
4. **Processing**: The Worker (running in the background of `server.js`) picks up the job from Redis.
5. **Execution**: `processJobApply()` runs (invoking AI APIs and potentially Puppeteer for web automation).
6. **Real-time Feedback**: As the worker progresses, it updates Supabase and emits status events via Socket.IO.
7. **Completion**: Worker marks job as complete in Redis and Supabase. Frontend updates instantly.

---

## 4. Redis Usage
- **What is stored**: BullMQ job payloads, delayed job schedules, retry attempts, locks, and queue metadata.
- **Queues (6 Total)**: `job-search`, `resume-tailor`, `job-apply`, `ai-processing`, `web-automation`, `dead-letter`.
- **Policies**: Configured with `attempts: 3`, exponential backoff (1000ms delay), and strict retention policies (max 100 completed/failed jobs) to prevent memory bloating.

---

## 5. Folder Structure
The codebase follows a Domain-Driven modular structure:
```text
src/
├── app/          # Next.js Frontend Pages & API Routes
├── components/   # Reusable UI Components (Sidebar, Modals)
├── intelligence/ # AI prompting and orchestration logic
├── server/       # Core HTTP & Socket server logic
├── services/     # External integrations (dbService.js, cronService.js)
├── shared/       # Shared utilities (queue.js, redis.js, env.js)
├── workers/      # BullMQ Worker definitions & Processors
└── ...
```

---

## 6. Deployment Details
- **Platform**: Render.com (Monolithic Web Service).
- **Redis Host**: External Redis (Render Native or Upstash).
- **Environment**: Keys are injected via Render Dashboard and read directly via `process.env` (bypassing strict build-time validation to ensure stability).

---

## 7. Traffic & Usage Expectations
- **Current Stage**: MVP / Alpha testing.
- **Workload Profile**: Highly **CPU & Network Intensive**. Web automation and AI API requests block the event loop and consume significant memory.

---

## 8. Job Processing Details
- **Execution Time**: Jobs range from 2 seconds (AI prompts) to potentially 2+ minutes (Web automation).
- **Concurrency**: Currently hard-limited to `2` parallel jobs per queue to prevent Render from killing the instance due to memory limits (OOM errors).

---

## 9. Future Architecture Decision Matrix

Based on the audit, here is the strategic decision for scaling:

### Question 1: Keep Redis & BullMQ?
**Decision: YES, Absolutely.**
For an "Agent" that performs long-running tasks (2+ minutes), you *cannot* use standard HTTP requests. They will timeout. BullMQ + Redis is the industry standard for this pattern. 

### Question 2: What is the Best Architecture?
To move from an unstable MVP to a robust product, we must decouple the architecture:

**Current MVP (Monolith):**
`[ Next.js UI + Next.js API + BullMQ Workers + Socket.IO ]` ➔ All running in 1 Render instance.

**Target Production Architecture (Microservices):**
1. **Frontend + API Web Service**:
   - Deploy Next.js to **Vercel** (Best performance, free edge caching, fast UI).
   - Alternatively, keep on Render but strip out the workers.
2. **Dedicated Worker Service (The Engine)**:
   - Deploy a separate "Background Worker" service on Render.
   - This service *only* runs `workers/index.js`. No UI, no HTTP server. Just pure CPU processing power connected to Redis.
3. **Redis Engine**:
   - Use **Upstash Serverless Redis**. It charges per request, has no eviction issues, and integrates perfectly with BullMQ.

> [!TIP]
> By separating the Web UI from the Background Workers, if an AI automation job crashes the worker or consumes 100% CPU, your user's Dashboard will remain perfectly fast and responsive.

---

## 10. Phase 2: Observability & High Scale (Roadmap)

While the microservice decoupling solves crashes, **1 Worker at Concurrency 1 means a maximum of ~30 applications per hour**. If 50 users apply at once, the queue delay will be 1-2 hours. To achieve true scale (100+ concurrent users), the following must be implemented:

### 1. Observability: Bull Board
You are currently flying blind relying on console logs. 
**Action**: Install `@bull-board/api` and `@bull-board/express` on a protected route to visually monitor queues, retry stuck jobs, and see active workloads.

### 2. Puppeteer Cluster Strategy
Launching standard `puppeteer` instances per job consumes massive RAM and CPU spikes.
**Action**: Migrate to `puppeteer-cluster` to reuse a pool of browsers, significantly reducing memory footprint and speeding up execution.

### 3. Smart Job Splitting
Currently, `job-apply` does everything (Search -> AI -> Apply) in one massive 2-minute block.
**Action**: Break the monolith job into smaller steps. Queue `job-search`, which then queues `ai-processing`, which then queues `web-automation`. Smaller jobs scale faster and fail cleaner.

### 4. Queue Backpressure
If the queue grows too large, the system must protect itself.
**Action**: Implement backpressure. If `queue.getWaitingCount() > 100`, the API should gracefully reject new jobs with a "System busy, please try again later" message rather than stacking them indefinitely.

### 5. Multi-Worker Scaling
**Action**: Once decoupled, scaling is as simple as spinning up 2-3 identical Background Worker instances on Render. They will automatically connect to Upstash Redis and load-balance the queue securely.

---

## 11. Phase 3: Pro-Level UX & Monetization

To transition from a functional system to a premium product, the following features should be integrated into the job processing architecture:

### 1. Priority Queuing (Monetization)
**Action**: Implement queue priority levels. Paid/Premium users get `priority: 1` when jobs are added to BullMQ, ensuring their applications skip the line during high traffic.

### 2. ETA System (UX Enhancement)
**Action**: Instead of leaving the user waiting blindly, calculate an estimated time of arrival.
*Formula*: `(queue_position * avg_job_time) / active_workers`
*Display*: "Your job will start in ~25 minutes."

### 3. Job Cancellation & Auto-Retry Dashboard
**Action**: Allow users to actively cancel queued jobs via `await job.remove()`. Provide a UI in the dashboard for users to manually trigger retries for failed applications.

### 4. Per-User Rate Limiting
**Action**: Implement strict limits on job submissions per user to prevent abuse (e.g., 50 applications per day).
