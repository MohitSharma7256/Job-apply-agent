"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sheetService = exports.SheetService = void 0;
const googleapis_1 = require("googleapis");
const date_fns_1 = require("date-fns");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const LOCAL_DATA_FILE = path.join(process.cwd(), 'data', 'applications.json');
class SheetService {
    constructor(config) {
        this.useLocalStorage = false;
        this.spreadsheetId = config?.spreadsheetId || process.env.GOOGLE_SHEETS_ID || '';
        if (config?.credentials && this.spreadsheetId) {
            const auth = new googleapis_1.google.auth.GoogleAuth({
                credentials: config.credentials,
                scopes: SHEETS_SCOPES,
            });
            this.sheets = googleapis_1.google.sheets({ version: 'v4', auth });
        }
        else {
            this.useLocalStorage = true;
            this.ensureDataFile();
        }
    }
    ensureDataFile() {
        try {
            if (!fs.existsSync(path.dirname(LOCAL_DATA_FILE))) {
                fs.mkdirSync(path.dirname(LOCAL_DATA_FILE), { recursive: true });
            }
            if (!fs.existsSync(LOCAL_DATA_FILE)) {
                fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify([], null, 2));
            }
        }
        catch (error) {
            console.error('Error creating data file:', error);
        }
    }
    readLocalData() {
        try {
            const data = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error reading local data:', error);
            return [];
        }
    }
    writeLocalData(records) {
        try {
            fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(records, null, 2));
        }
        catch (error) {
            console.error('Error writing local data:', error);
        }
    }
    async initializeSheet() {
        if (!this.sheets)
            return;
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
        }
        catch (error) {
            if (error.code !== 409) { // 409 = already exists
                throw error;
            }
        }
    }
    async addApplication(record) {
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
            (0, date_fns_1.format)(now, 'yyyy-MM-dd'),
            (0, date_fns_1.format)(now, 'HH:mm:ss'),
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
        }
        catch (error) {
            console.error('Error adding to sheet:', error);
            throw error;
        }
    }
    async updateApplicationStatus(id, status, notes) {
        if (!this.sheets)
            return;
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
        }
        catch (error) {
            console.error('Error updating sheet:', error);
        }
    }
    async getAllApplications() {
        if (this.useLocalStorage) {
            return this.readLocalData();
        }
        if (!this.sheets)
            return [];
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Sheet1!A:L',
            });
            const rows = response.data.values || [];
            const headers = rows[0] || [];
            const applications = [];
            rows.slice(1).forEach(row => {
                if (row[0]) {
                    applications.push({
                        id: row[0],
                        jobId: row[0],
                        jobTitle: row[3] || '',
                        company: row[4] || '',
                        location: row[5] || '',
                        salary: row[6] === 'NA' ? undefined : row[6],
                        platform: row[7] || 'other',
                        appliedAt: row[1] ? `${row[1]} ${row[2]}` : '',
                        resumeFile: row[8],
                        status: row[9] || 'unknown',
                        notes: row[11],
                    });
                }
            });
            return applications;
        }
        catch (error) {
            console.error('Error reading sheet:', error);
            return [];
        }
    }
    async getTodayApplications() {
        const all = await this.getAllApplications();
        const today = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
        return all.filter(app => app.appliedAt.startsWith(today));
    }
    async getDailyStats() {
        const all = await this.getAllApplications();
        const now = new Date();
        const today = (0, date_fns_1.format)(now, 'yyyy-MM-dd');
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
            today: all.filter(app => app.appliedAt.startsWith(today)).length,
            thisWeek: all.filter(app => new Date(app.appliedAt) >= weekAgo).length,
            thisMonth: all.filter(app => new Date(app.appliedAt) >= monthAgo).length,
        };
    }
}
exports.SheetService = SheetService;
exports.sheetService = new SheetService();
