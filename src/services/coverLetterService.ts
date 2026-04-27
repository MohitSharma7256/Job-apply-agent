import { GoogleGenerativeAI } from '@google/generative-ai';
import { Job, UserProfile } from '@/types';

export class CoverLetterService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateCoverLetter(job: Job, profile: UserProfile): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        Write a professional and compelling cover letter for the following job and candidate profile.
        
        JOB DETAILS:
        Title: ${job.title}
        Company: ${job.company}
        Description: ${job.description || 'N/A'}
        Required Skills: ${job.skills.join(', ')}

        CANDIDATE PROFILE:
        Name: ${profile.name}
        Current Role: ${profile.targetRoles[0] || 'Professional'}
        Experience: ${profile.experience} years
        Key Skills: ${profile.skills.join(', ')}
        Resume Content: ${profile.resumeText.substring(0, 1000)}...

        GUIDELINES:
        - Be concise (3 paragraphs max).
        - Focus on how the candidate's skills solve the company's specific needs.
        - Maintain a confident but humble tone.
        - Start with a strong hook and end with a call to action.
        - Format with proper salutations.
        
        Return ONLY the cover letter text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Cover letter generation error:', error);
      return this.getFallbackCoverLetter(job, profile);
    }
  }

  private getFallbackCoverLetter(job: Job, profile: UserProfile): string {
    return `Dear Hiring Team at ${job.company},

I am writing to express my strong interest in the ${job.title} position. With ${profile.experience} years of experience and a strong background in ${profile.skills.slice(0, 3).join(', ')}, I am confident that I can contribute significantly to your team.

I am particularly impressed by ${job.company}'s work and believe my expertise aligns perfectly with your goals. I look forward to the possibility of discussing how my skills can benefit your organization.

Sincerely,
${profile.name}`;
  }
}

export const coverLetterService = new CoverLetterService();
