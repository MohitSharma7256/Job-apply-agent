# Job Apply Agent

## Overview

Job Apply Agent is an AI-powered platform for discovering, matching, and applying to jobs automatically. It combines job search, resume tailoring, automated application workflows, and real-time status updates.

## Main Features

- Job scoring and matching based on candidate profile
- Cover letter generation using AI
- Automated application submission with browser automation
- Real-time notifications via Socket.io
- Health checks for Supabase, Redis, and queue services

## Technology Stack

- Next.js 14 + TypeScript
- Supabase
- Socket.io
- BullMQ + Redis
- Playwright
- OpenAI and AI services
- Tailwind CSS

## Installation

```bash
cd /workspaces/Job-apply-agent
npm install
```

## Environment Setup

Create a `.env` file in the project root with values similar to:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SERPER_API_KEY=
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> If using separate Redis host config, set `REDIS_HOST` and `REDIS_PORT` instead of `REDIS_URL`.

## Available Scripts

- `npm run dev` — Start the application in development mode
- `npm run build` — Build the Next.js application for production
- `npm run start` — Start the server in production
- `npm run lint` — Run lint checks
- `npm run login:<platform>` — Run login helper scripts for supported platforms

## Project Structure

- `src/app/` — Next.js App Router pages and API routes
- `src/lib/` — shared helpers and utilities
- `src/server/` — custom server and Socket.io server code
- `src/services/` — service logic and automation handlers
- `src/config/` — platform configuration definitions
- `src/types/` — TypeScript type definitions

## Fixes Applied

- Added `src/lib/redis.ts` to enable Redis access from health checks and helpers
- Installed `jsonwebtoken` and `@types/jsonwebtoken`
- Updated README with setup, installation, and running guidance

## Running the Application

```bash
npm install
npm run build
npm run dev
```

## Notes

- Supabase and Redis are required for the project to function correctly.
- Ensure `JWT_SECRET` and Supabase credentials are defined in `.env`.
- The custom server runs with `ts-node` in this repository.
