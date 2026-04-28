import { google } from 'googleapis';
import { supabase } from './supabaseService';
import OpenAI from 'openai';

let openai: OpenAI | null = null;
const getOpenAI = () => {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'missing' });
  }
  return openai;
};

export class EmailService {
  private oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/api/auth/callback/gmail'
  );

  async scanInbox(userId: string) {
    console.log(`[Email Agent] Scanning inbox for updates for ${userId}...`);
    
    // 1. Get tokens from Supabase
    const { data: credentials } = await supabase
      .from('user_credentials')
      .select('gmail_tokens')
      .eq('user_id', userId)
      .single();

    if (!credentials?.gmail_tokens) {
      console.warn('[Email Agent] Gmail not connected.');
      return;
    }

    this.oauth2Client.setCredentials(credentials.gmail_tokens);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    // 2. Search for relevant emails (last 48h)
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'after:' + (Math.floor(Date.now() / 1000) - 172800) + ' (interview OR application OR shortlisted OR rejected)',
    });

    const messages = res.data.messages || [];
    for (const msg of messages) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id! });
      const snippet = detail.data.snippet || '';
      
      // 3. AI Analysis: Is this a status update?
      await this.analyzeEmailStatus(userId, snippet);
    }
  }

  private async analyzeEmailStatus(userId: string, snippet: string) {
    const prompt = `
      Analyze this email snippet and determine the application status update.
      Snippet: "${snippet}"
      
      Return JSON:
      - companyName: string
      - status: "shortlisted" | "rejected" | "interview_scheduled" | "other"
      - confidence: 0-1
    `;

    try {
      const ai = getOpenAI();
      const response = await ai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      if (result.confidence > 0.8 && result.status !== 'other') {
        console.log(`[Email Agent] Detected status: ${result.status} for ${result.companyName}`);
        
        // Update application in DB
        await supabase
          .from('applications')
          .update({ status: result.status })
          .ilike('company', `%${result.companyName}%`);
      }
    } catch (e) {
      console.error('[Email Agent] AI analysis failed:', e);
    }
  }

  async createFollowUpDraft(userId: string, companyName: string, jobTitle: string, recruiterEmail: string) {
    const prompt = `
      Write a polite follow-up email for a job application.
      Company: ${companyName}, Role: ${jobTitle}
      Tone: Professional, enthusiastic, not desperate.
    `;

    try {
      const ai = getOpenAI();
      const response = await ai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
      });

      const body = response.choices[0].message.content;
      
      // Create draft in Gmail
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: Buffer.from(
              `To: ${recruiterEmail}\r\n` +
              `Subject: Follow up - ${jobTitle} application\r\n\r\n` +
              body
            ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
          },
        },
      });
      
      console.log(`[Email Agent] Follow-up draft created for ${companyName}`);
    } catch (e) {
      console.error('[Email Agent] Draft creation failed:', e);
    }
  }
}

export const emailService = new EmailService();
