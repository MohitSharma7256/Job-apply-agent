# Job Apply Agent Pro

## Overview

Job Apply Agent Pro is a production-grade, AI-powered platform for discovering, matching, and applying to jobs automatically. It features a modern async execution plane, real-time updates, comprehensive observability, and enterprise-grade security.

## 🚀 Key Features

### Core Functionality
- **AI-Powered Job Matching**: Advanced algorithms analyze profiles and match with perfect opportunities
- **Intelligent Resume Tailoring**: AI-driven resume and cover letter customization
- **Automated Applications**: Browser automation for multi-platform job submissions
- **Real-time Tracking**: Live progress updates and notifications via Socket.IO

### Production Features
- **Async Execution Plane**: BullMQ-based job processing with retry logic and dead-letter queues
- **Real-time System**: Live dashboard updates without page refresh
- **Comprehensive Observability**: Structured logging, metrics, and health monitoring
- **Enterprise Security**: Row-level security, JWT authentication, and CORS controls
- **CI/CD Pipeline**: Automated testing, security scanning, and deployment

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Control Plane │    │ Execution Plane   │    │   Data Plane    │
│                 │    │                  │    │                │
│ Next.js App     │◄──►│ BullMQ Workers    │◄──►│ Supabase + Redis │
│ + Socket.IO     │    │ + Playwright      │    │ + Event Store   │
│ + Auth          │    │ + AI Services     │    │                │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Socket.IO, BullMQ, Redis
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **AI Services**: OpenAI, Google AI, Anthropic
- **Automation**: Playwright for web automation
- **Observability**: Structured logging, metrics, health checks
- **CI/CD**: GitHub Actions, automated testing, security scanning

## 📋 Prerequisites

- Node.js 18+
- Redis 6+
- Supabase account
- AI service API keys (OpenAI, Google AI)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/your-org/job-apply-agent.git
cd job-apply-agent

# Install dependencies
npm install

# Set up environment
cp .env.example .env
```

## 🔧 Environment Configuration

Create a `.env` file with the following configuration:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Service Keys (Required)
GOOGLE_AI_API_KEY=your-google-ai-key
OPENAI_API_KEY=your-openai-key

# Optional AI Services
ANTHROPIC_API_KEY=your-anthropic-key
SERPER_API_KEY=your-serper-key

# Infrastructure
REDIS_URL=redis://localhost:6379

# Security Secrets (Required - Must be 32+ characters)
JWT_SECRET=your-jwt-secret-minimum-32-characters-long
SESSION_SECRET=your-session-secret-minimum-32-characters-long

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-production-app-url.com
NODE_ENV=production
PORT=3000

# CORS Configuration (Production Only)
CORS_ALLOWLIST=https://yourapp.com,https://www.yourapp.com

# Logging
LOG_LEVEL=info
```

## 📜 Available Scripts

### Development
```bash
npm run dev              # Start development server
npm run dev:worker        # Start only worker processes
npm run typecheck:watch   # Watch TypeScript compilation
```

### Production
```bash
npm run build            # Build for production
npm run start             # Start production server
npm run worker            # Start worker processes
```

### Quality & Testing
```bash
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues
npm run typecheck         # TypeScript type checking
npm run validate          # Run lint + typecheck
npm test                  # Run unit tests
npm run test:integration  # Run integration tests
npm run test:e2e          # Run E2E tests
```

### Database & Queues
```bash
npm run migrate           # Run database migrations
npm run migrate:rollback  # Rollback migrations
npm run queue:stats       # View queue statistics
npm run queue:clean       # Clean old queue jobs
```

## 📁 Project Structure

```
job-apply-agent/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes with validation
│   │   ├── dashboard/         # Dashboard pages
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/                # UI components
│   │   ├── JobProgressTracker.js
│   │   └── NotificationCenter.js
│   ├── hooks/                 # React hooks
│   │   └── useSocket.js       # Socket.IO hook
│   ├── shared/                # Shared utilities
│   │   ├── auth.js            # Authentication
│   │   ├── errors.js          # Error handling
│   │   ├── events.js          # Event system
│   │   ├── logger.js          # Structured logging
│   │   ├── monitoring.js      # Metrics collection
│   │   ├── queue.js           # BullMQ setup
│   │   ├── schemas.js         # Zod validation
│   │   └── socket.js          # Socket.IO server
│   └── services/              # Business logic
│       ├── dbService.js       # Database service
│       ├── aiService.js       # AI integration
│       └── cronService.js     # Scheduled tasks
├── workers/                    # BullMQ workers
│   ├── index.js               # Worker setup
│   └── processors/            # Job processors
├── migrations/                 # Database migrations
├── scripts/                    # Utility scripts
├── tests/                      # Test files
├── .github/workflows/          # CI/CD pipelines
└── docs/                       # Documentation
```

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Ensure all required variables are set
```

### 2. Database Setup
```bash
# Run database migrations
npm run migrate

# Verify database connection
curl http://localhost:3000/api/health
```

### 3. Start Services
```bash
# Start all services (server + workers)
npm run dev

# Or start them separately
npm run dev          # Server only
npm run dev:worker   # Workers only
```

### 4. Access Application
- **Dashboard**: http://localhost:3000/dashboard
- **Health Check**: http://localhost:3000/api/health
- **Queue Stats**: http://localhost:3000/api/queue/stats

## 🔍 API Documentation

### Authentication
All API endpoints require JWT authentication:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/jobs/search
```

### Job Search
```bash
curl -X POST http://localhost:3000/api/jobs/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "keywords": "React Developer",
    "locations": ["Remote", "Bangalore"],
    "platforms": ["linkedin", "naukri"],
    "maxResults": 10,
    "profile": {
      "skills": ["React", "Node.js"],
      "experience": 5
    }
  }'
```

### Job Status
```bash
curl http://localhost:3000/api/jobs/{jobId}/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Monitoring & Observability

### Health Checks
- **GET /api/health**: Comprehensive health check
- **POST /api/health**: Readiness probe for load balancers

### Metrics
- **GET /api/queue/stats**: Queue statistics (admin only)
- **GET /api/monitoring**: System metrics (admin only)

### Logging
Structured JSON logging with correlation IDs:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "INFO",
  "service": "job-apply-agent",
  "message": "Job search completed",
  "correlationId": "uuid-string",
  "userId": "user-123",
  "duration": 45000
}
```

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Run all unit tests
npm test -- --coverage     # With coverage report
```

### Integration Tests
```bash
npm run test:integration   # API route tests
```

### E2E Tests
```bash
npm run test:e2e          # End-to-end tests
```

### Test Coverage
- Unit tests: Services, utilities, and hooks
- Integration tests: API routes and database operations
- E2E tests: Critical user flows (search → tailor → apply)

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with 32-character secrets
- Row-level security (RLS) on all user data
- Role-based access control
- API rate limiting

### Data Protection
- Encrypted session storage
- CORS allowlist configuration
- Input validation with Zod schemas
- SQL injection prevention

### Infrastructure Security
- Environment variable validation at startup
- No hardcoded secrets in code
- Security scanning in CI/CD pipeline

## 🚀 Deployment

### Production Deployment
```bash
# Build application
npm run build

# Start production server
npm start

# Start workers (separate process)
npm run worker
```

### Docker Deployment
```bash
# Build Docker image
docker build -t job-apply-agent .

# Run with Docker Compose
docker-compose up -d
```

### Render Deployment
The application is configured for deployment on Render with automatic scaling.

## 📈 Performance

### Async Processing
- **Non-blocking APIs**: Immediate response with job IDs
- **Queue Processing**: Background workers handle long-running tasks
- **Retry Logic**: Exponential backoff for failed jobs
- **Dead Letter Queue**: Isolated failed jobs for analysis

### Real-time Updates
- **Socket.IO**: Live progress updates without polling
- **Event-driven**: Efficient event propagation
- **Connection Management**: Auto-reconnect with exponential backoff

### Caching & Optimization
- **Redis Caching**: Job state and session storage
- **Database Optimization**: Proper indexing and RLS policies
- **Memory Management**: Efficient cleanup and garbage collection

## 🛠️ Development

### Code Quality
- **ESLint**: Consistent code formatting
- **TypeScript**: Type safety throughout
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

### Architecture Patterns
- **Domain Events**: Loose coupling via event system
- **Repository Pattern**: Database abstraction
- **Dependency Injection**: Testable and modular code
- **Error Boundaries**: Graceful error handling

### Contributing
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run `npm run validate`
5. Submit pull request

## 📚 Documentation

- **API Reference**: Detailed API documentation
- **Architecture Guide**: System design and patterns
- **Deployment Guide**: Production deployment instructions
- **Runbooks**: Incident response procedures

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check Supabase credentials
curl https://your-project.supabase.co/rest/v1/
```

**Redis Connection Failed**
```bash
# Check Redis connection
redis-cli ping
```

**Worker Not Processing Jobs**
```bash
# Check queue stats
curl http://localhost:3000/api/queue/stats
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/job-apply-agent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/job-apply-agent/discussions)

---

**Job Apply Agent Pro** - Enterprise-grade job automation with real-time processing and comprehensive observability.
