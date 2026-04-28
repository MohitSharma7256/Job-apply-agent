"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiLetterService = exports.AiLetterService = void 0;
class AiLetterService {
    async generateCoverLetter(job, profile) {
        const name = profile.name || 'Candidate';
        const title = job.title || 'Position';
        const company = job.company || 'Company';
        return `
Dear Hiring Manager,

I am writing to express my strong interest in the ${title} position at ${company}. With my background in ${profile.skills?.slice(0, 3).join(', ')} and ${profile.experience || 1}+ years of experience, I am confident that I would be a valuable addition to your team.

My technical expertise aligns well with your requirements, and I am excited about the opportunity to contribute to your organization's success.

I would welcome the opportunity to discuss how my skills and experience can benefit ${company}.

Best regards,
${name}
`.trim();
    }
}
exports.AiLetterService = AiLetterService;
exports.aiLetterService = new AiLetterService();
