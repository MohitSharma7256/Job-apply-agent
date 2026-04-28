"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class NotificationService {
    initialize() {
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            this.transporter = nodemailer_1.default.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
    }
    async sendApplicationNotification(job) {
        if (!this.transporter)
            return;
        const to = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER;
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: `Applied: ${job.title} at ${job.company}`,
            html: `
        <h2>Job Application Submitted</h2>
        <p><strong>Position:</strong> ${job.title}</p>
        <p><strong>Company:</strong> ${job.company}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Platform:</strong> ${job.platform}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><a href="${job.url}">View Job</a></p>
      `,
        });
    }
    async sendDailyDigest(stats) {
        if (!this.transporter)
            return;
        const to = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER;
        const jobsHtml = stats.topJobs
            .map(job => `
        <li>
          <strong>${job.title}</strong> at ${job.company}
          <br>Match Score: ${job.matchScore}/10
          <br><a href="${job.url}">Apply</a>
        </li>
      `)
            .join('');
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: `Job Agent Daily Digest - ${stats.jobsMatched} Matching Jobs`,
            html: `
        <h1>Daily Job Digest</h1>
        <h2>Summary</h2>
        <ul>
          <li>Jobs Found: ${stats.jobsFound}</li>
          <li>Matching Jobs: ${stats.jobsMatched}</li>
          <li>Applications Sent: ${stats.jobsApplied}</li>
        </ul>
        
        <h2>Top Matching Jobs</h2>
        <ul>${jobsHtml}</ul>
        
        <p style="color: #666; font-size: 12px;">
          This is an automated message from your Job Apply Agent.
        </p>
      `,
        });
    }
    async sendAlert(message, type = 'info') {
        if (!this.transporter)
            return;
        const to = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER;
        const colors = {
            error: '#dc3545',
            warning: '#ffc107',
            info: '#0dcaf0',
        };
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: `[Job Agent ${type.toUpperCase()}] Alert`,
            html: `
        <div style="padding: 20px; border-left: 4px solid ${colors[type]};">
          <p>${message}</p>
          <p style="color: #666; font-size: 12px;">
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
        });
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
