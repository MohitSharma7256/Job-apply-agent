# Job Apply Agent 🚀

AI-powered job application automation agent that finds matching jobs, tailors your resume, applies automatically, and tracks everything.

![Job Apply Agent](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## Features

### 🔍 Multi-Platform Job Search
- **Naukri.com** - India's leading job portal
- **Apna** - Fast-growing Indian job platform
- **LinkedIn** - Global professional network
- **Indeed** - Job search aggregator
- **Internshala** - Internship platform
- **Greenhouse** - Company career pages (150+ companies)

### 🤖 AI-Powered Features
- **Job Matching** - Scores jobs 1-10 against your profile
- **Resume Tailoring** - Automatically customizes resume for each job
- **Skill Extraction** - Identifies required skills from job descriptions

### 📊 Application Tracking
- **Google Sheets Integration** - Logs every application with timestamp
- **Local Storage Fallback** - Works without Google Sheets setup
- **Daily Stats** - Track applications by day/week/month

### 🛡️ Safety Features
- **Daily Limit** - Configurable (default: 50/day)
- **Duplicate Detection** - Prevents re-applying to same jobs
- **Error Handling** - Graceful fallbacks for all operations

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Google AI API key (free) or OpenAI API key

### Installation

```bash
cd job-apply-agent
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:

```env
# AI Provider (Google AI Studio - FREE)
AI_PROVIDER=google
AI_MODEL=gemma-4-26b-a4b-it
GOOGLE_AI_API_KEY=your_google_api_key

# Alternative: OpenAI
# AI_PROVIDER=openai
# OPENAI_API_KEY=your_openai_api_key

# Google Sheets (optional)
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_CLIENT_EMAIL=your_service_account
GOOGLE_PRIVATE_KEY="your_private_key"

# Email Notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Get Free AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create API key (no credit card required)
3. Paste in `.env`

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

---

## Project Structure

```
job-apply-agent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── jobs/
│   │   │   │   ├── search/route.ts    # Job search endpoint
│   │   │   │   └── score/route.ts     # Batch scoring endpoint
│   │   │   ├── apply/route.ts         # Application endpoint
│   │   │   ├── resume/
│   │   │   │   └── tailor/route.ts    # Resume tailoring
│   │   │   ├── sheet/route.ts         # Google Sheets tracking
│   │   │   └── stats/route.ts         # Statistics endpoint
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Main dashboard UI
│   │   ├── page.tsx                   # Landing page
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── services/
│   │   ├── jobSearchService.ts        # Multi-platform scraping
│   │   ├── aiService.ts               # AI scoring & tailoring
│   │   ├── applyService.ts            # Auto-apply logic
│   │   ├── sheetService.ts            # Google Sheets integration
│   │   └── notificationService.ts     # Email alerts
│   ├── types/
│   │   └── index.ts                   # TypeScript interfaces
│   ├── config/
│   │   └── platforms.ts               # Platform configurations
│   └── utils/
│       └── helpers.ts                 # Utility functions
├── data/
│   └── applications.json              # Local storage fallback
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├���─ next.config.js
├── vercel.json
├── .env.example
└── README.md
```

---

## API Reference

### Search Jobs

```http
POST /api/jobs/search
Content-Type: application/json

{
  "keywords": ["software engineer", "react developer"],
  "locations": ["Bangalore", "Remote"],
  "platforms": ["naukri", "linkedin", "indeed"],
  "maxResults": 30,
  "profile": {
    "skills": ["javascript", "react", "node"],
    "targetRoles": ["Senior Developer"],
    "experience": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "totalFound": 150,
  "matchedCount": 45,
  "jobs": [
    {
      "id": "abc123",
      "title": "Senior Software Engineer",
      "company": "TechCorp",
      "location": "Bangalore",
      "salary": "25 LPA",
      "matchScore": 8.5,
      "platform": "linkedin",
      "url": "https://..."
    }
  ]
}
```

### Apply to Job

```http
POST /api/apply
Content-Type: application/json

{
  "job": { ... },
  "profile": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Applied to Senior Software Engineer at TechCorp",
  "remainingToday": 49
}
```

### Tailor Resume

```http
POST /api/resume/tailor
Content-Type: application/json

{
  "job": { ... },
  "profile": { ... },
  "jobDescription": "..."
}
```

**Response:**
```json
{
  "success": true,
  "tailoredResume": "# John Doe\n\n## Summary\n...",
  "matchedSkills": ["javascript", "react"],
  "missingSkills": ["typescript"],
  "summary": "Highlighted React and Node.js experience"
}
```

### Get Applications

```http
GET /api/sheet?filter=all|today|week|month
```

**Response:**
```json
{
  "success": true,
  "count": 125,
  "applications": [...]
}
```

---

## Dashboard Features

### Search Tab
- Add/remove keywords
- Add/remove locations
- Toggle platforms
- Filter by match score (6+, 7+, 8+, 9+)
- Sort by score/date/company
- View matched jobs with scores
- Apply to individual jobs

### Profile Tab
- Personal info (name, email, phone)
- Skills management
- Target roles
- Resume paste area
- Auto-save to browser localStorage

### Applications Tab
- Full application history
- Filterable by date
- Status tracking
- Platform indicators

### Stats Tab
- Today's applications
- This week's applications
- This month's total
- Progress indicator (50/day limit)

---

## Cost Breakdown

| Component | Free Option | Cost |
|-----------|------------|------|
| AI | Google AI Studio (Gemma 4) | **$0** |
| Hosting | Vercel Free Tier | **$0** |
| Database | Local JSON / Google Sheets | **$0** |
| Email | Gmail SMTP | **$0** |
| **Total** | | **$0/month** |

### Optional Paid Upgrades
- OpenAI GPT-4o mini: ~$3-5/month
- Vercel Pro: $20/month
- Google Sheets Pro: $10/month

---

## Platform Details

### Scraping vs API

| Platform | Method | Requires Auth |
|----------|--------|--------------|
| Naukri | HTML Scraping | Yes |
| Apna | HTML Scraping | Yes |
| LinkedIn | Public API | No |
| Indeed | HTML Scraping | No |
| Internshala | HTML Scraping | No |
| Greenhouse | REST API | No |

### Rate Limits

| Platform | Request Limit |
|----------|--------------|
| Naukri | 1000ms delay |
| Apna | 1000ms delay |
| LinkedIn | 2000ms delay |
| Indeed | 1500ms delay |
| Greenhouse | 500ms delay |

---

## Troubleshooting

### Jobs Not Found
- Check if keywords are valid
- Verify platform selection
- Some sites block scraping (use Greenhouse API)

### AI Not Working
- Verify API key is correct
- Check Google AI Studio quota
- Try OpenAI as alternative

### Applications Not Saving
- Check Google Sheets permissions
- Verify service account access
- Falls back to local JSON automatically

### Vercel Deployment Issues
- Set `runtime = 'nodejs'` for API routes
- Increase `maxDuration` for long operations
- Use environment variables for secrets

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AI_PROVIDER` | `google` or `openai` | Yes |
| `AI_MODEL` | Model name | Yes |
| `GOOGLE_AI_API_KEY` | Google AI Studio key | Yes (if using Google) |
| `OPENAI_API_KEY` | OpenAI key | Yes (if using OpenAI) |
| `GOOGLE_SHEETS_ID` | Sheet ID | No |
| `GOOGLE_CLIENT_EMAIL` | Service account email | No |
| `GOOGLE_PRIVATE_KEY` | Service account key | No |
| `SMTP_HOST` | SMTP server | No |
| `SMTP_PORT` | SMTP port | No |
| `SMTP_USER` | SMTP username | No |
| `SMTP_PASS` | SMTP password/App password | No |

---

## License

MIT License - Use freely for personal projects.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ for job seekers**