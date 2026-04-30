import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

class AIService {
  // Analyze JD and Extract Keywords
  async analyzeJobDescription(description) {
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
  }

  // Tailor Resume Content
  async tailorResume(resumeContent, jobDescription) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Given my resume and this job description, rewrite my "Summary" and "Key Achievements" to highlight the most relevant skills for this specific job. Keep it professional and ATS-friendly.
    
    Resume: ${resumeContent}
    JD: ${jobDescription}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  // Generate Personalized Cover Letter
  async generateCoverLetter(resumeContent, jobDescription) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Write a short, punchy cover letter (max 250 words) that connects my experience to this job description. Avoid generic fluff.
    
    Resume: ${resumeContent}
    JD: ${jobDescription}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

export const aiService = new AIService();
