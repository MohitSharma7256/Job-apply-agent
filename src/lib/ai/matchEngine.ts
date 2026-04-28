import { OpenAI } from 'openai';
import { Job, UserProfile } from '../../types';

let openai: OpenAI | null = null;
const getOpenAI = () => {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'missing' });
  }
  return openai;
};

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendation: string;
}

export interface GapReport {
  critical: string[];
  niceToHave: string[];
  irrelevant: string[];
  resources: string[];
}

export class MatchEngine {
  async scoreJob(profile: UserProfile, job: Job): Promise<MatchResult> {
    console.log(`[AI Match] Scoring job: ${job.title} at ${job.company}`);
    
    // AI-based scoring prompt
    const prompt = `
      Compare the following User Profile with the Job Description.
      
      User Profile:
      - Skills: ${profile.skills.join(', ')}
      - Experience: ${profile.experience} years
      - Preferred Roles: ${profile.targetRoles.join(', ')}
      
      Job Details:
      - Title: ${job.title}
      - Description: ${job.description}
      - Skills Required: ${job.skills.join(', ')}
      
      Return a JSON object with:
      - score: 0-100 (weighted: skills 40%, exp 25%, role 20%, other 15%)
      - matchedSkills: Array of user skills that match the job
      - missingSkills: Array of critical job skills the user lacks
      - recommendation: A 1-sentence summary of why this is a good/bad match
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: 'You are an expert career consultant.' }, { role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        score: result.score || 0,
        matchedSkills: result.matchedSkills || [],
        missingSkills: result.missingSkills || [],
        recommendation: result.recommendation || '',
      };
    } catch (error) {
      console.error('[AI Match] Error:', error);
    // Fallback simple scoring
      return {
        score: 50,
        matchedSkills: [],
        missingSkills: [],
        recommendation: 'Manual review required (AI Match failed)',
      };
    }
  }

  async analyzeSkillGaps(profile: UserProfile, job: Job): Promise<GapReport> {
    const prompt = `
      Perform a deep skill gap analysis between:
      User Skills: ${profile.skills.join(', ')}
      Job Skills: ${job.skills.join(', ')}
      
      Categorize gaps as:
      - critical (must have for the role)
      - niceToHave (optional but good)
      - irrelevant (don't worry about these)
      
      Also provide 3 learning resources (links or names) for the most critical gaps.
      Return as JSON.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      return { critical: [], niceToHave: [], irrelevant: [], resources: [] };
    }
  }
}

export const matchEngine = new MatchEngine();
