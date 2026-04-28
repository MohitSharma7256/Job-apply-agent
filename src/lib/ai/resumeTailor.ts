import OpenAI from 'openai';
import { Job, UserProfile } from '../../types';
import { jsPDF } from 'jspdf';

let openai: OpenAI | null = null;
const getOpenAI = () => {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'missing' });
  }
  return openai;
};

export class ResumeTailor {
  async tailorResume(profile: UserProfile, job: Job): Promise<{ tailoredText: string; pdfBuffer: Buffer }> {
    console.log(`[Resume Tailor] Customizing resume for ${job.company}...`);

    const prompt = `
      You are an expert ATS (Applicant Tracking System) optimizer. 
      Rewrite the following resume bullet points to perfectly match the job description.
      
      Original Profile:
      - Skills: ${profile.skills.join(', ')}
      - Experience Summary: ${profile.experience} years
      
      Job Description:
      - Title: ${job.title}
      - Key Requirements: ${job.description}
      
      Task:
      1. Optimize bullet points to include keywords from the JD.
      2. Maintain 100% honesty (don't invent experience).
      3. Use active verbs (e.g., "Led", "Developed", "Optimized").
      
      Return as a clean JSON object with "tailoredSummary" and "tailoredExperience" (array of points).
    `;

    try {
      const ai = getOpenAI();
      const response = await ai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: 'You are a professional resume writer.' }, { role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');
      
    // Generate PDF on the fly
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text(profile.name, 20, 20);
      doc.setFontSize(10);
      doc.text(`${profile.email} | ${profile.phone}`, 20, 30);
      
      doc.setFontSize(14);
      doc.text('Summary', 20, 45);
      doc.setFontSize(10);
      const splitSummary = doc.splitTextToSize(data.tailoredSummary || '', 170);
      doc.text(splitSummary, 20, 55);

      doc.setFontSize(14);
      doc.text('Experience', 20, 90);
      doc.setFontSize(10);
      let y = 100;
      (data.tailoredExperience || []).forEach((point: string) => {
        const splitPoint = doc.splitTextToSize(`• ${point}`, 170);
        doc.text(splitPoint, 20, y);
        y += (splitPoint.length * 7);
      });

      const pdfArrayBuffer = doc.output('arraybuffer');
      return {
        tailoredText: JSON.stringify(data),
        pdfBuffer: Buffer.from(pdfArrayBuffer)
      };

    } catch (error) {
      console.error('[Resume Tailor] Error:', error);
      throw error;
    }
  }
}

export const resumeTailor = new ResumeTailor();
