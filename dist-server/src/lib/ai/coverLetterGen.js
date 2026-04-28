"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.coverLetterGenerator = exports.CoverLetterGenerator = void 0;
const openai_1 = __importDefault(require("openai"));
let openai = null;
const getOpenAI = () => {
    if (!openai) {
        openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY || 'missing' });
    }
    return openai;
};
class CoverLetterGenerator {
    async generateVariants(profile, job, companyContext = '') {
        console.log(`[AI CoverLetter] Generating 3 variants for ${job.company}`);
        const prompt = `
      You are an expert career coach. Write 3 distinct cover letter variants for the following role and candidate.
      
      Candidate: ${profile.name}
      Skills: ${profile.skills.join(', ')}
      Role: ${job.title}
      Company: ${job.company}
      Job Description: ${job.description}
      Company Context: ${companyContext}
      
      Variants Required:
      1. Formal: Professional, traditional, corporate-friendly.
      2. Conversational: Enthusiastic, approachable, human-centric.
      3. Startup-Casual: High-energy, focus on impact/speed, bold.
      
      Constraints:
      - Max 350 words per variant.
      - Use markdown formatting.
      - Mention specific skills that match the job description.
      
      Return as a JSON object with keys: formal, conversational, startup.
    `;
        try {
            const ai = getOpenAI();
            const response = await ai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'system', content: 'You are a professional career consultant.' }, { role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            });
            return JSON.parse(response.choices[0].message.content || '{}');
        }
        catch (error) {
            console.error('[AI CoverLetter] Error:', error);
            return {
                formal: 'Could not generate cover letter. Please try again.',
                conversational: '',
                startup: ''
            };
        }
    }
}
exports.CoverLetterGenerator = CoverLetterGenerator;
exports.coverLetterGenerator = new CoverLetterGenerator();
