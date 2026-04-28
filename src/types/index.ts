export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  requirements: string[];
  url: string;
  platform: Platform;
  postedDate: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  experienceLevel: 'fresher' | 'mid' | 'senior' | 'lead' | 'any';
  skills: string[];
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  applied: boolean;
  appliedAt?: string;
  status: 'new' | 'matched' | 'applied' | 'rejected' | 'interview' | 'offer';
  aiAnalysis?: {
    reasoning: string;
    tailoringNotes: string;
    skillGapAnalysis: {
      critical: string[];
      suggested: string[];
    };
  };
  tailoredResume?: string;
}

export interface AIGeneratedContent {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
  tailoredNotes: string;
  skillGapAnalysis: {
    critical: string[];
    suggested: string[];
  };
  coverLetter?: string;
}

export type Platform = 'naukri' | 'apna' | 'linkedin' | 'indeed' | 'greenhouse' | 'internshala' | 'shine' | 'other';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  resumeUrl: string;
  resumeText: string;
  skills: string[];
  experience: number;
  education: string;
  targetRoles: string[];
  targetLocations: string[];
  targetSalary?: number;
  experienceLevel: 'fresher' | 'mid' | 'senior' | 'lead';
  preferredJobTypes: string[];
}

export interface JobSearchParams {
  keywords: string[];
  locations: string[];
  platforms: Platform[];
  jobTypes?: string[];
  experienceLevel?: string;
  salaryMin?: number;
  maxResults?: number;
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary?: string;
  platform: Platform;
  appliedAt: string;
  resumeFile?: string;
  status: string;
  notes?: string;
}

export interface TailoredResume {
  jobId: string;
  originalResume: string;
  tailoredResume: string;
  matchedSkills: string[];
  missingSkills: string[];
  tailoringNotes: string;
}

export interface PlatformConfig {
  name: string;
  baseUrl: string;
  searchUrl: string;
  useApi: boolean;
  apiEndpoint?: string;
  scrapingSelector?: string;
  rateLimit: number;
  requiresAuth: boolean;
}

export interface DailyStats {
  date: string;
  jobsFound: number;
  jobsMatched: number;
  jobsApplied: number;
  successRate: number;
}

export interface AgentConfig {
  dailyLimit: number;
  scanInterval: number;
  autoApply: boolean;
  aiProvider: 'openai' | 'google' | 'local';
  emailNotifications: boolean;
  sheetIntegration: boolean;
  sheetId?: string;
}
