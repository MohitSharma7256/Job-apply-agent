import { Job, UserProfile, AIGeneratedContent } from '@/types';
import { AI_CONFIG } from '@/config/platforms';
import { coverLetterService } from './coverLetterService';

export interface ResumeTailoring {
  tailoredContent: string;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
}

export class AIService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY || '';
    this.model = 'gemini-1.5-pro'; // Using a more stable model name
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async scoreJobMatch(job: Job, profile: UserProfile): Promise<AIGeneratedContent> {
    const prompt = this.buildScoringPrompt(job, profile);

    try {
      const response = await this.callAI(prompt);
      const analysis = await this.parseScoringResponse(response, profile);
      
      // If match is good, generate a cover letter automatically
      if (analysis.matchScore >= 6) {
        analysis.coverLetter = await coverLetterService.generateCoverLetter(job, profile);
      }
      
      return analysis;
    } catch (error) {
      console.error('AI scoring error:', error);
      return this.fallbackScoring(job, profile);
    }
  }

  async tailorResume(job: Job, profile: UserProfile, jobDescription: string): Promise<ResumeTailoring> {
    const prompt = this.buildResumeTailoringPrompt(job, profile, jobDescription);

    try {
      const response = await this.callAI(prompt);
      return this.parseResumeResponse(response);
    } catch (error) {
      console.error('Resume tailoring error:', error);
      return this.fallbackResumeTailoring(profile);
    }
  }

  async extractJobDescription(url: string, html: string): Promise<string> {
    const prompt = `
Extract the complete job description from the following HTML content. Include:
- Job title
- Required skills
- Qualifications
- Responsibilities
- Experience requirements

Return only the relevant job description text, no HTML tags.

HTML Content:
${html.substring(0, 8000)}
`;

    try {
      const response = await this.callAI(prompt);
      return response;
    } catch (error) {
      console.error('Job description extraction error:', error);
      return '';
    }
  }

  private buildScoringPrompt(job: Job, profile: UserProfile): string {
    return `
You are a job matching AI expert. Evaluate how well this job position aligns with the candidate's profile.

CANDIDATE:
- Name: ${profile.name}
- Skills: ${profile.skills.join(', ')}
- Target Roles: ${profile.targetRoles.join(', ')}
- Experience: ${profile.experience} years
- Education: ${profile.education}

JOB:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Description: ${job.description || 'N/A'}
- Required Skills: ${job.skills.join(', ') || 'Not specified'}

SCORING RULES (1-10):
- Skills (50%): Direct match with required/preferred skills.
- Role (30%): Match with target roles and career path.
- Experience (20%): Level fit (fresher vs senior).

Respond STRICTLY with a valid JSON object:
{
  "matchScore": <number 1-10>,
  "matchedSkills": [<list of candidate skills that match job requirements>],
  "missingSkills": [<list of job requirements candidate lacks>],
  "reasoning": "<2-3 sentence explanation of the score>",
  "tailoringNotes": "<specific advice for adjusting the resume for this role>",
  "skillGapAnalysis": {
    "critical": ["skills that are non-negotiable"],
    "suggested": ["skills that would be a bonus or adjacent skills mapping"]
  }
}
`;
  }

  private buildResumeTailoringPrompt(job: Job, profile: UserProfile, jobDescription: string): string {
    return `
You are an expert resume writer. Tailor a resume for a specific job position.

CANDIDATE PROFILE (Base Resume):
${profile.resumeText || `Name: ${profile.name}
Email: ${profile.email}
Phone: ${profile.phone}
Skills: ${profile.skills.join(', ')}
Experience: ${profile.experience} years
Education: ${profile.education}`}

JOB POSITION:
- Title: ${job.title}
- Company: ${job.company}
- Requirements: ${jobDescription}

TASK:
1. Rewrite the summary/objective to highlight relevant experience for this role
2. Reorder skills to prioritize those matching the job requirements
3. Adjust experience descriptions to emphasize relevant achievements
4. Add any relevant keywords from the job description
5. Keep it concise and ATS-friendly

Return ONLY a JSON object:
{
  "tailoredContent": "<complete tailored resume in markdown format>",
  "matchedSkills": [<skills that matched>],
  "missingSkills": [<important skills the candidate is missing>],
  "summary": "<2 sentence summary of tailoring changes>"
}
`;
  }

  private async callAI(prompt: string): Promise<string> {
    // Always use Google Gemini directly with correct URL format
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private parseScoringResponse(response: string, profile: UserProfile): AIGeneratedContent {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          matchScore: Math.min(10, Math.max(1, parsed.matchScore || 5)),
          matchedSkills: parsed.matchedSkills || [],
          missingSkills: parsed.missingSkills || [],
          reasoning: parsed.reasoning || '',
          tailoringNotes: parsed.tailoringNotes || '',
          skillGapAnalysis: parsed.skillGapAnalysis || { critical: [], suggested: [] }
        };
      }
    } catch (e) {
      console.error('Parse error:', e);
    }
    return this.fallbackScoring({} as Job, profile);
  }

  private parseResumeResponse(response: string): ResumeTailoring {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          tailoredContent: parsed.tailoredContent || response,
          matchedSkills: parsed.matchedSkills || [],
          missingSkills: parsed.missingSkills || [],
          summary: parsed.summary || '',
        };
      }
    } catch (e) {
      console.error('Parse error:', e);
    }
    return {
      tailoredContent: response,
      matchedSkills: [],
      missingSkills: [],
      summary: 'Resume tailored based on job requirements.',
    };
  }

  private fallbackScoring(job: Job, profile: UserProfile): AIGeneratedContent {
    const jobSkills = job.skills || [];
    const profileSkills = profile.skills || [];
    const matched = jobSkills.filter(s => 
      profileSkills.some(ps => ps.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ps.toLowerCase()))
    );
    const missing = jobSkills.filter(s => !matched.includes(s));

    const score = jobSkills.length > 0 
      ? 5 + (matched.length / jobSkills.length) * 5 
      : 5;

    return {
      matchScore: Math.min(10, Math.round(score * 10) / 10),
      matchedSkills: matched,
      missingSkills: missing,
      reasoning: `Matched ${matched.length} of ${jobSkills.length || 0} required skills.`,
      tailoredNotes: matched.length > 0 
        ? `Highlight ${matched.slice(0, 3).join(', ')} in your resume.`
        : 'Customize your summary to match job requirements.',
      skillGapAnalysis: {
        critical: missing.slice(0, 2),
        suggested: []
      }
    };
  }

  private fallbackResumeTailoring(profile: UserProfile): ResumeTailoring {
    return {
      tailoredContent: profile.resumeText || `Resume for ${profile.name}\nSkills: ${profile.skills.join(', ')}`,
      matchedSkills: profile.skills,
      missingSkills: [],
      summary: 'Resume formatting applied based on standard template.',
    };
  }

  async getATSScore(job: Job, profile: UserProfile): Promise<{ score: number; tips: string[] }> {
    const prompt = `
      Evaluate the following resume for ATS (Applicant Tracking System) compatibility for the given job.
      
      JOB: ${job.title} at ${job.company}
      RESUME: ${profile.resumeText.substring(0, 2000)}
      
      Check for:
      - Keyword density
      - Formatting issues (simple vs complex)
      - Contact info presence
      - Action verbs
      - Section headers
      
      Return JSON:
      {
        "score": <number 0-100>,
        "tips": ["tip 1", "tip 2", ...]
      }
    `;

    try {
      const response = await this.callAI(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: parsed.score || 70,
          tips: parsed.tips || []
        };
      }
    } catch (e) {
      console.error('ATS score error:', e);
    }
    return { score: 75, tips: ['Ensure relevant keywords are present in your experience section.'] };
  }

  async searchJobsWithAI(params: any): Promise<Job[]> {
    const prompt = `
      Act as a high-performance job search engine. Find the latest job opportunities matching these criteria:
      KEYWORDS: ${params.keywords.join(', ')}
      LOCATIONS: ${params.locations.join(', ')}
      
      Return a list of 5-8 highly relevant job opportunities that actually exist on major platforms (Naukri, LinkedIn, Indeed, etc.).
      
      Respond ONLY with a JSON array:
      [
        {
          "title": "...",
          "company": "...",
          "location": "...",
          "salary": "...",
          "url": "...",
          "platform": "naukri|linkedin|indeed"
        }
      ]
    `;

    try {
      const response = await this.callAI(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedJobs = JSON.parse(jsonMatch[0]);
        return parsedJobs.map((j: any) => ({
          ...j,
          id: `ai-${Math.random().toString(36).substr(2, 9)}`,
          postedDate: new Date().toISOString(),
          skills: [],
          applied: false,
          status: 'new',
          matchScore: 8
        }));
      }
    } catch (e) {
      console.error('AI Search error:', e);
    }
    return [];
  }
}

export const aiService = new AIService();