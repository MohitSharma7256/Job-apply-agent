import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;

class AIService {
  // Analyze JD and Extract Keywords
  async analyzeJobDescription(description) {
    if (!genAI) {
      return this.fallbackAnalysis(description);
    }
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Analyze this job description and return a JSON with: 
      1. topSkills (array of strings)
      2. experienceRequired (string)
      3. redFlags (array of strings)
      4. keywordsForATS (array of strings)
      
      JD: ${description}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text.replace(/```json|```/g, ''));
    } catch (error) {
      console.error('AI service error:', error);
      return this.fallbackAnalysis(description);
    }
  }

  // Tailor Resume Content
  async tailorResume(resumeContent, jobDescription) {
    if (!genAI) {
      return this.fallbackTailoring(resumeContent, jobDescription);
    }
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Given my resume and this job description, rewrite my "Summary" and "Key Achievements" to highlight the most relevant skills for this specific job. Keep it professional and ATS-friendly.
      
      Resume: ${resumeContent}
      JD: ${jobDescription}`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('AI service error:', error);
      return this.fallbackTailoring(resumeContent, jobDescription);
    }
  }

  // Generate Personalized Cover Letter
  async generateCoverLetter(resumeContent, jobDescription) {
    if (!genAI) {
      return this.fallbackCoverLetter(resumeContent, jobDescription);
    }
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Write a short, punchy cover letter (max 250 words) that connects my experience to this job description. Avoid generic fluff.
      
      Resume: ${resumeContent}
      JD: ${jobDescription}`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('AI service error:', error);
      return this.fallbackCoverLetter(resumeContent, jobDescription);
    }
  }

  // Fallback methods for when AI is not available
  fallbackAnalysis(description) {
    const skills = description.match(/\b(javascript|python|react|node\.js|aws|docker|kubernetes|git|sql|nosql)\b/gi) || [];
    const experience = description.match(/\d+[\+\s]*years?/gi) || ['3+ years'];
    
    return {
      topSkills: [...new Set(skills.map(s => s.toLowerCase()))],
      experienceRequired: experience[0] || '3+ years',
      redFlags: [],
      keywordsForATS: skills.slice(0, 5)
    };
  }

  fallbackTailoring(resumeContent, jobDescription) {
    return `Professional summary tailored to highlight relevant experience and skills for the position. Focus on technical expertise and achievements that align with job requirements.`;
  }

  fallbackCoverLetter(resumeContent, jobDescription) {
    return `Dear Hiring Manager,\n\nI am excited to apply for this position. My experience and skills align well with your requirements. I look forward to discussing how I can contribute to your team.\n\nSincerely,\nApplicant`;
  }
}

export const aiService = new AIService();
