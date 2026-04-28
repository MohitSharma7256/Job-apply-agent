import { Job, UserProfile } from '@/types';

interface AIGeneratedContent {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
  tailoringNotes: string;
  skillGapAnalysis: {
    critical: string[];
    suggested: string[];
  };
}

export interface ResumeTailoring {
  tailoredContent: string;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
}

const SKILL_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
  'node', 'express', 'django', 'flask', 'spring', 'aws', 'azure', 'gcp',
  'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql', 'redis',
  'git', 'linux', 'machine learning', 'data science', 'tensorflow', 'pytorch',
  'html', 'css', 'sass', 'tailwind', 'next', 'nuxt', 'graphql', 'rest',
  'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
  'react native', 'flutter', 'ios', 'android', 'firebase',
  'graphql', 'grpc', 'microservices', 'CI/CD', 'devops',
  'mern', 'mean', 'lamp', 'wordpress', 'shopify',
  'figma', 'photoshop', 'sketch', 'adobe', 'ui/ux',
  'agile', 'scrum', 'jira', 'confluence',
  'communication', 'leadership', 'problem solving',
  'teamwork', 'time management', 'analytical',
  'excel', 'powerpoint', 'word', 'ppt',
  'seo', 'sem', 'google ads', 'facebook ads', 'analytics',
  'content writing', 'copywriting', 'blogging',
  'sales', 'marketing', 'branding', 'social media',
  'accounting', 'finance', 'tally', 'tax',
  'hr', 'recruitment', 'payroll', 'training',
  'data analysis', 'excel macros', 'vba',
  'power bi', 'tableau', 'looker', 'dashboard',
];

export class AIService {
  private apiKey: string;
  private model: string;
  private useAI: boolean = true;
  private retryCount: number = 0;
  private maxRetries: number = 2;

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY || process.env.OPENAI_API_KEY || '';
    this.model = process.env.AI_MODEL || 'gemini-2.0-flash';
    
    if (!this.apiKey) {
      console.log('No AI API key found - using keyword-based fallback scoring');
      this.useAI = false;
    }
  }

  async scoreJobMatch(job: Job, profile: UserProfile): Promise<AIGeneratedContent> {
    if (!this.useAI) {
      return this.keywordBasedScoring(job, profile);
    }

    try {
      return await this.aiScoringWithFallback(job, profile);
    } catch (error: any) {
      console.error('AI scoring failed, using fallback:', error.message);
      return this.keywordBasedScoring(job, profile);
    }
  }

  private async aiScoringWithFallback(job: Job, profile: UserProfile): Promise<AIGeneratedContent> {
    const prompt = this.buildScoringPrompt(job, profile);
    
    try {
      const response = await this.callAI(prompt);
      return this.parseScoringResponse(response, profile);
    } catch (error: any) {
      if (error.message.includes('429') || error.message.includes('quota')) {
        console.log('AI quota exceeded, using keyword fallback');
        this.retryCount++;
        if (this.retryCount > this.maxRetries) {
          this.useAI = false;
        }
        return this.keywordBasedScoring(job, profile);
      }
      throw error;
    }
  }

  private async callAI(prompt: string): Promise<string> {
    const isGoogle = !process.env.OPENAI_API_KEY;
    let url: string;
    let body: any;

    if (isGoogle) {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      };
    } else {
      url = 'https://api.openai.com/v1/chat/completions';
      body = {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      const errorMsg = `AI API error: ${response.status} - ${errText.substring(0, 150)}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    if (isGoogle) {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      return data.choices?.[0]?.message?.content || '';
    }
  }

  async tailorResume(job: Job, profile: UserProfile, jobDescription: string): Promise<ResumeTailoring> {
    if (!this.useAI) {
      return this.simpleResumeTailoring(job, profile, jobDescription);
    }

    try {
      const prompt = this.buildResumeTailoringPrompt(job, profile, jobDescription);
      const response = await this.callAI(prompt);
      return this.parseResumeResponse(response);
    } catch (error) {
      console.error('Resume tailoring failed, using simple tailoring:', error);
      return this.simpleResumeTailoring(job, profile, jobDescription);
    }
  }

  private keywordBasedScoring(job: Job, profile: UserProfile): AIGeneratedContent {
    const jobSkills = this.extractSkills(job.description + ' ' + job.skills.join(' '));
    const profileSkills = profile.skills.map(s => s.toLowerCase());
    const profileText = profile.resumeText?.toLowerCase() || '';
    
    const matched: string[] = [];
    const missing: string[] = [];
    let skillScore = 0;
    let resumeScore = 0;

    for (const jobSkill of jobSkills) {
      const found = profileSkills.find(ps => 
        ps.includes(jobSkill) || jobSkill.includes(ps)
      );
      if (found) {
        matched.push(found);
        skillScore += 2;
      } else if (profileText.includes(jobSkill)) {
        matched.push(jobSkill);
        skillScore += 1;
        resumeScore += 1;
      } else {
        missing.push(jobSkill);
      }
    }

    let roleScore = 0;
    const jobTitleLower = job.title.toLowerCase();
    const targetRoles = profile.targetRoles.map(r => r.toLowerCase());
    
    for (const role of targetRoles) {
      if (jobTitleLower.includes(role) || role.includes(jobTitleLower)) {
        roleScore += 3;
      } else if (jobTitleLower.split(' ').some(word => role.includes(word))) {
        roleScore += 1;
      }
    }

    const expYears = profile.experience || 0;
    if (job.experienceLevel === 'senior' && expYears >= 5) roleScore += 2;
    if (job.experienceLevel === 'fresher' && expYears <= 2) roleScore += 2;

    const locationFit = job.location.toLowerCase().includes('remote') || 
                     profile.targetLocations.some(l => job.location.toLowerCase().includes(l.toLowerCase()));
    if (locationFit) roleScore += 1;

    const rawScore = (skillScore * 50 / Math.max(jobSkills.length, 1)) + 
                   (roleScore * 30 / 10) + 
                   (resumeScore * 20 / 10);
    
    const matchScore = Math.min(10, Math.max(1, rawScore));

    return {
      matchScore: Math.round(matchScore * 10) / 10,
      matchedSkills: matched.slice(0, 5),
      missingSkills: missing.slice(0, 3),
      reasoning: `${matched.length} skills matched. ${job.title} at ${job.company}.`,
      tailoringNotes: matched.length > 0 
        ? `Highlight ${matched.slice(0, 3).join(', ')} in your resume.`
        : 'Customize your summary to match job requirements.',
      skillGapAnalysis: {
        critical: missing.slice(0, 2),
        suggested: this.findAdjacentSkills(missing)
      }
    };
  }

  private extractSkills(text: string): string[] {
    const lower = text.toLowerCase();
    return SKILL_KEYWORDS.filter(skill => lower.includes(skill));
  }

  private findAdjacentSkills(missing: string[]): string[] {
    const adjacencyMap: Record<string, string[]> = {
      'react': ['react native', 'next.js'],
      'javascript': ['typescript', 'react'],
      'python': ['django', 'flask', 'machine learning'],
      'java': ['spring', 'spring boot'],
      'node': ['express', 'node.js', 'graphql'],
      'aws': ['azure', 'gcp', 'devops'],
      'sql': ['postgresql', 'mysql', 'mongodb'],
      'docker': ['kubernetes', 'CI/CD', 'devops'],
    };

    const suggested: string[] = [];
    for (const skill of missing.slice(0, 2)) {
      const adj = adjacencyMap[skill];
      if (adj) suggested.push(...adj);
    }
    return [...new Set(suggested)].slice(0, 3);
  }

  private buildScoringPrompt(job: Job, profile: UserProfile): string {
    return `
Evaluate job match (1-10 score), return JSON only:

CANDIDATE: ${profile.name}, Skills: ${profile.skills.join(', ') || 'none'}, Exp: ${profile.experience}y

JOB: ${job.title} at ${job.company}, ${job.location}

Return: {"matchScore": num, "matchedSkills": [], "missingSkills": [], "reasoning": "text", "tailoringNotes": "text"}
`;
  }

  private buildResumeTailoringPrompt(job: Job, profile: UserProfile, jobDescription: string): string {
    return `
Tailor resume for "${job.title}" at "${job.company}". 

Resume: ${profile.resumeText || 'No resume text'}

Return JSON: {"tailoredContent": "...", "matchedSkills": [], "missingSkills": [], "summary": "..."}
`;
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
    return this.keywordBasedScoring({} as Job, profile);
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
      summary: 'Resume tailored.',
    };
  }

  private simpleResumeTailoring(job: Job, profile: UserProfile, jobDescription: string): ResumeTailoring {
    const jobSkills = this.extractSkills(jobDescription || job.description);
    const profileSkills = profile.skills.map(s => s.toLowerCase());
    
    const matched = jobSkills.filter(s => profileSkills.some(ps => ps.includes(s) || s.includes(ps)));
    const missing = jobSkills.filter(s => !profileSkills.some(ps => ps.includes(s) || s.includes(ps)));

    const summary = matched.length > 0 
      ? `Matched skills: ${matched.join(', ')}. Add: ${missing.slice(0, 2).join(', ')}`
      : 'Tailored resume - highlight relevant experience';

    return {
      tailoredContent: profile.resumeText || `Resume for ${profile.name}`,
      matchedSkills: matched,
      missingSkills: missing,
      summary
    };
  }

  isUsingAI(): boolean {
    return this.useAI;
  }
}

export const aiService = new AIService();
