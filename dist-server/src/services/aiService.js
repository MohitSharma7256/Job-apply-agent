"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const SKILL_KEYWORDS = [
    'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
    'node', 'express', 'django', 'flask', 'spring', 'aws', 'azure', 'gcp',
    'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql', 'redis',
    'git', 'linux', 'machine learning', 'data science', 'tensorflow', 'pytorch',
    'html', 'css', 'sass', 'tailwind', 'next', 'nuxt', 'graphql', 'rest',
    'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    'react native', 'flutter', 'ios', 'android', 'firebase',
    'graphql', 'grpc', 'microservices', 'CI/CD', 'devops',
    'mern', 'mean', 'lamp', 'wordpress', 'shopify',
    'figma', 'photoshop', 'sketch', 'adobe', 'ui/ux',
    'agile', 'scrum', 'jira', 'confluence',
    'communication', 'leadership', 'problem solving',
    'teamwork', 'time management', 'analytical',
    'excel', 'powerpoint', 'word', 'ppt',
    'seo', 'sem', 'google ads', 'facebook ads', 'analytics',
    'content writing', 'copywriting', 'blogging',
    'sales', 'marketing', 'branding', 'social media',
    'accounting', 'finance', 'tally', 'tax',
    'hr', 'recruitment', 'payroll', 'training',
    'data analysis', 'excel macros', 'vba',
    'power bi', 'tableau', 'looker', 'dashboard',
];
class AIService {
    constructor() {
        this.useAI = true;
        this.retryCount = 0;
        this.maxRetries = 2;
        this.apiKey = process.env.GOOGLE_AI_API_KEY || process.env.OPENAI_API_KEY || '';
        this.model = process.env.AI_MODEL || 'gemini-2.0-flash';
        if (!this.apiKey) {
            console.log('No AI API key found - using keyword-based fallback scoring');
            this.useAI = false;
        }
    }
    async scoreJobMatch(job, profile) {
        if (!this.useAI) {
            return this.keywordBasedScoring(job, profile);
        }
        try {
            return await this.aiScoringWithFallback(job, profile);
        }
        catch (error) {
            console.error('AI scoring failed, using fallback:', error.message);
            return this.keywordBasedScoring(job, profile);
        }
    }
    async aiScoringWithFallback(job, profile) {
        const prompt = this.buildScoringPrompt(job, profile);
        try {
            const response = await this.callAI(prompt);
            return this.parseScoringResponse(response, profile);
        }
        catch (error) {
            if (error.message.includes('429') || error.message.includes('quota')) {
                console.log('AI quota exceeded, using keyword fallback');
                this.retryCount++;
                if (this.retryCount > this.maxRetries) {
                    this.useAI = false;
                }
                return this.keywordBasedScoring(job, profile);
            }
            throw error;
        }
    }
    async callAI(prompt) {
        const isGoogle = !process.env.OPENAI_API_KEY;
        let url;
        let body;
        if (isGoogle) {
            url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            body = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1000,
                },
            };
        }
        else {
            url = 'https://api.openai.com/v1/chat/completions';
            body = {
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 1000,
            };
        }
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errText = await response.text();
            const errorMsg = `AI API error: ${response.status} - ${errText.substring(0, 150)}`;
            throw new Error(errorMsg);
        }
        const data = await response.json();
        if (isGoogle) {
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
        else {
            return data.choices?.[0]?.message?.content || '';
        }
    }
    async tailorResume(job, profile, jobDescription) {
        if (!this.useAI) {
            return this.simpleResumeTailoring(job, profile, jobDescription);
        }
        try {
            const prompt = this.buildResumeTailoringPrompt(job, profile, jobDescription);
            const response = await this.callAI(prompt);
            return this.parseResumeResponse(response);
        }
        catch (error) {
            console.error('Resume tailoring failed, using simple tailoring:', error);
            return this.simpleResumeTailoring(job, profile, jobDescription);
        }
    }
    keywordBasedScoring(job, profile) {
        const jobSkills = this.extractSkills(job.description + ' ' + job.skills.join(' '));
        const profileSkills = profile.skills.map(s => s.toLowerCase());
        const profileText = profile.resumeText?.toLowerCase() || '';
        const matched = [];
        const missing = [];
        let skillScore = 0;
        let resumeScore = 0;
        for (const jobSkill of jobSkills) {
            const found = profileSkills.find(ps => ps.includes(jobSkill) || jobSkill.includes(ps));
            if (found) {
                matched.push(found);
                skillScore += 2;
            }
            else if (profileText.includes(jobSkill)) {
                matched.push(jobSkill);
                skillScore += 1;
                resumeScore += 1;
            }
            else {
                missing.push(jobSkill);
            }
        }
        let roleScore = 0;
        const jobTitleLower = job.title.toLowerCase();
        const targetRoles = profile.targetRoles.map(r => r.toLowerCase());
        for (const role of targetRoles) {
            if (jobTitleLower.includes(role) || role.includes(jobTitleLower)) {
                roleScore += 3;
            }
            else if (jobTitleLower.split(' ').some(word => role.includes(word))) {
                roleScore += 1;
            }
        }
        const expYears = profile.experience || 0;
        if (job.experienceLevel === 'senior' && expYears >= 5)
            roleScore += 2;
        if (job.experienceLevel === 'fresher' && expYears <= 2)
            roleScore += 2;
        const locationFit = job.location.toLowerCase().includes('remote') ||
            profile.targetLocations.some(l => job.location.toLowerCase().includes(l.toLowerCase()));
        if (locationFit)
            roleScore += 1;
        const rawScore = (skillScore * 50 / Math.max(jobSkills.length, 1)) +
            (roleScore * 30 / 10) +
            (resumeScore * 20 / 10);
        const matchScore = Math.min(10, Math.max(1, rawScore));
        return {
            matchScore: Math.round(matchScore * 10) / 10,
            matchedSkills: matched.slice(0, 5),
            missingSkills: missing.slice(0, 3),
            reasoning: `${matched.length} skills matched. ${job.title} at ${job.company}.`,
            tailoringNotes: matched.length > 0
                ? `Highlight ${matched.slice(0, 3).join(', ')} in your resume.`
                : 'Customize your summary to match job requirements.',
            skillGapAnalysis: {
                critical: missing.slice(0, 2),
                suggested: this.findAdjacentSkills(missing)
            }
        };
    }
    extractSkills(text) {
        const lower = text.toLowerCase();
        return SKILL_KEYWORDS.filter(skill => lower.includes(skill));
    }
    findAdjacentSkills(missing) {
        const adjacencyMap = {
            'react': ['react native', 'next.js'],
            'javascript': ['typescript', 'react'],
            'python': ['django', 'flask', 'machine learning'],
            'java': ['spring', 'spring boot'],
            'node': ['express', 'node.js', 'graphql'],
            'aws': ['azure', 'gcp', 'devops'],
            'sql': ['postgresql', 'mysql', 'mongodb'],
            'docker': ['kubernetes', 'CI/CD', 'devops'],
        };
        const suggested = [];
        for (const skill of missing.slice(0, 2)) {
            const adj = adjacencyMap[skill];
            if (adj)
                suggested.push(...adj);
        }
        return [...new Set(suggested)].slice(0, 3);
    }
    buildScoringPrompt(job, profile) {
        return `
Evaluate job match (1-10 score), return JSON only:

CANDIDATE: ${profile.name}, Skills: ${profile.skills.join(', ') || 'none'}, Exp: ${profile.experience}y

JOB: ${job.title} at ${job.company}, ${job.location}

Return: {"matchScore": num, "matchedSkills": [], "missingSkills": [], "reasoning": "text", "tailoringNotes": "text"}
`;
    }
    buildResumeTailoringPrompt(job, profile, jobDescription) {
        return `
Tailor resume for "${job.title}" at "${job.company}". 

Resume: ${profile.resumeText || 'No resume text'}

Return JSON: {"tailoredContent": "...", "matchedSkills": [], "missingSkills": [], "summary": "..."}
`;
    }
    parseScoringResponse(response, profile) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    matchScore: Math.min(10, Math.max(1, parsed.matchScore || 5)),
                    matchedSkills: parsed.matchedSkills || [],
                    missingSkills: parsed.missingSkills || [],
                    reasoning: parsed.reasoning || '',
                    tailoringNotes: parsed.tailoringNotes || '',
                    skillGapAnalysis: parsed.skillGapAnalysis || { critical: [], suggested: [] }
                };
            }
        }
        catch (e) {
            console.error('Parse error:', e);
        }
        return this.keywordBasedScoring({}, profile);
    }
    parseResumeResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    tailoredContent: parsed.tailoredContent || response,
                    matchedSkills: parsed.matchedSkills || [],
                    missingSkills: parsed.missingSkills || [],
                    summary: parsed.summary || '',
                };
            }
        }
        catch (e) {
            console.error('Parse error:', e);
        }
        return {
            tailoredContent: response,
            matchedSkills: [],
            missingSkills: [],
            summary: 'Resume tailored.',
        };
    }
    simpleResumeTailoring(job, profile, jobDescription) {
        const jobSkills = this.extractSkills(jobDescription || job.description);
        const profileSkills = profile.skills.map(s => s.toLowerCase());
        const matched = jobSkills.filter(s => profileSkills.some(ps => ps.includes(s) || s.includes(ps)));
        const missing = jobSkills.filter(s => !profileSkills.some(ps => ps.includes(s) || s.includes(ps)));
        const summary = matched.length > 0
            ? `Matched skills: ${matched.join(', ')}. Add: ${missing.slice(0, 2).join(', ')}`
            : 'Tailored resume - highlight relevant experience';
        return {
            tailoredContent: profile.resumeText || `Resume for ${profile.name}`,
            matchedSkills: matched,
            missingSkills: missing,
            summary
        };
    }
    async analyzeEmail(body) {
        if (!this.useAI) {
            return { isUpdate: false, jobId: '', newStatus: '' };
        }
        const prompt = `
Analyze if this email is a job application status update.
EMAIL: "${body}"
Return JSON only: {"isUpdate": boolean, "jobId": "string", "newStatus": "applied|interview|rejected|offered"}
`;
        try {
            const response = await this.callAI(prompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    isUpdate: !!parsed.isUpdate,
                    jobId: parsed.jobId || '',
                    newStatus: parsed.newStatus || 'applied'
                };
            }
        }
        catch (e) {
            console.error('Email analysis failed:', e);
        }
        return { isUpdate: false, jobId: '', newStatus: '' };
    }
    isUsingAI() {
        return this.useAI;
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
