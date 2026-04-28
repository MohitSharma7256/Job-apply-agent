import { google } from 'googleapis';
import { supabase } from './dbService';
import { aiService } from './aiService';

export class EmailService {
  async scanInbox(userId: string) {
    // 1. Get tokens from Supabase
    const { data: profile } = await supabase
      .from('profiles')
      .select('gmail_tokens')
      .eq('id', userId)
      .single();

    if (!profile?.gmail_tokens) return;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET
    );
    oauth2Client.setCredentials(profile.gmail_tokens);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 2. Search for relevant emails (last 48h)
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'newer_than:2d (interview OR application OR "status update")',
    });

    if (!res.data.messages) return;

    for (const msg of res.data.messages) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id! });
      const body = detail.data.snippet || '';

      // 3. AI Analysis: Is this a status update?
      const analysis = await aiService.analyzeEmail(body);
      
      if (analysis.isUpdate) {
        console.log(`[Email] Found update for job: ${analysis.jobId}`);
        // Update application in DB
        await supabase
          .from('applications')
          .update({ status: analysis.newStatus })
          .eq('jobId', analysis.jobId);
      }
    }
  }

  async createDraft(userId: string, to: string, subject: string, body: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gmail_tokens')
      .eq('id', userId)
      .single();

    if (!profile?.gmail_tokens) return;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET
    );
    oauth2Client.setCredentials(profile.gmail_tokens);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const raw = Buffer.from(
      `To: ${to}\r\n` +
      `Subject: ${subject}\r\n\r\n` +
      `${body}`
    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: raw
        }
      }
    });
  }
}

export const emailService = new EmailService();
