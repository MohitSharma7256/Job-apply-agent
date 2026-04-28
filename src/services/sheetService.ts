import { google } from 'googleapis';
import { ApplicationRecord } from '@/types';
import { format } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';

const SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const LOCAL_DATA_FILE = path.join(process.cwd(), 'data', 'applications.json');

interface SheetConfig {
  spreadsheetId: string;
  credentials: {
    client_email: string;
    private_key: string;
  };
}

export class SheetService {
  private sheets: any;
  private spreadsheetId: string;
  private useLocalStorage: boolean = false;

  constructor(config?: SheetConfig) {
    this.spreadsheetId = config?.spreadsheetId || process.env.GOOGLE_SHEETS_ID || '';
    
    if (config?.credentials && this.spreadsheetId) {
      const auth = new google.auth.GoogleAuth({
        credentials: config.credentials,
        scopes: SHEETS_SCOPES,
      });
      this.sheets = google.sheets({ version: 'v4', auth });
    } else {
      this.useLocalStorage = true;
      this.ensureDataFile();
    }
  }

  private ensureDataFile(): void {
    try {
      if (!fs.existsSync(path.dirname(LOCAL_DATA_FILE))) {
        fs.mkdirSync(path.dirname(LOCAL_DATA_FILE), { recursive: true });
      }
      if (!fs.existsSync(LOCAL_DATA_FILE)) {
        fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('Error creating data file:', error);
    }
  }

  private readLocalData(): ApplicationRecord[] {
    try {
      const data = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading local data:', error);
      return [];
    }
  }

  private writeLocalData(records: ApplicationRecord[]): void {
    try {
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(records, null, 2));
    } catch (error) {
      console.error('Error writing local data:', error);
    }
  }

  async initializeSheet(): Promise<void> {
    if (!this.sheets) return;

    const headers = [
      'ID',
      'Date Applied',
      'Time Applied',
      'Job Title',
      'Company Name',
      'Location',
      'Salary',
      'Platform',
      'Resume File',
      'Status',
      'Job URL',
      'Notes'
    ];

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A1:L1',
        valueInputOption: 'RAW',
        resource: {
          values: [headers],
        },
      });
      console.log('Sheet initialized with headers');
    } catch (error: any) {
      if (error.code !== 409) { // 409 = already exists
        throw error;
      }
    }
  }

  async addApplication(record: ApplicationRecord): Promise<void> {
    if (this.useLocalStorage) {
      const records = this.readLocalData();
      records.push(record);
      this.writeLocalData(records);
      console.log(`Added application to local file: ${record.company} - ${record.jobTitle}`);
      return;
    }

    if (!this.sheets) {
      console.log('Google Sheets not configured, logging to console:', record);
      return;
    }

    const now = new Date(record.appliedAt);
    const row = [
      record.id,
      format(now, 'yyyy-MM-dd'),
      format(now, 'HH:mm:ss'),
      record.jobTitle,
      record.company,
      record.location,
      record.salary || 'NA',
      record.platform,
      record.resumeFile || '',
      record.status,
      '',
      record.notes || ''
    ];

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:L',
        valueInputOption: 'RAW',
        resource: {
          values: [row],
        },
      });
      console.log(`Added application to sheet: ${record.company} - ${record.jobTitle}`);
    } catch (error) {
      console.error('Error adding to sheet:', error);
      throw error;
    }
  }

  async updateApplicationStatus(id: string, status: string, notes?: string): Promise<void> {
    if (!this.sheets) return;

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:L',
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);

      if (rowIndex > 0) {
        const updateRange = `Sheet1!J${rowIndex + 1}:L${rowIndex + 1}`;
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: updateRange,
          valueInputOption: 'RAW',
          resource: {
            values: [[status, '', notes || '']],
          },
        });
      }
    } catch (error) {
      console.error('Error updating sheet:', error);
    }
  }

  async getAllApplications(): Promise<ApplicationRecord[]> {
    if (this.useLocalStorage) {
      return this.readLocalData();
    }

    if (!this.sheets) return [];

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:L',
      });

      const rows = response.data.values || [];
      const headers = rows[0] || [];
      const applications: ApplicationRecord[] = [];

      rows.slice(1).forEach(row => {
        if (row[0]) {
          applications.push({
            id: row[0],
            jobId: row[0],
            jobTitle: row[3] || '',
            company: row[4] || '',
            location: row[5] || '',
            salary: row[6] === 'NA' ? undefined : row[6],
            platform: row[7] as any || 'other',
            appliedAt: row[1] ? `${row[1]} ${row[2]}` : '',
            resumeFile: row[8],
            status: row[9] || 'unknown',
            notes: row[11],
          });
        }
      });

      return applications;
    } catch (error) {
      console.error('Error reading sheet:', error);
      return [];
    }
  }

  async getTodayApplications(): Promise<ApplicationRecord[]> {
    const all = await this.getAllApplications();
    const today = format(new Date(), 'yyyy-MM-dd');
    
    return all.filter(app => app.appliedAt.startsWith(today));
  }

  async getDailyStats(): Promise<{ today: number; thisWeek: number; thisMonth: number }> {
    const all = await this.getAllApplications();
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      today: all.filter(app => app.appliedAt.startsWith(today)).length,
      thisWeek: all.filter(app => new Date(app.appliedAt) >= weekAgo).length,
      thisMonth: all.filter(app => new Date(app.appliedAt) >= monthAgo).length,
    };
  }
}

export const sheetService = new SheetService();
