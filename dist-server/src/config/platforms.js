"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_CONFIG = exports.RATE_LIMITS = exports.DAILY_APPLICATION_LIMIT = exports.DEFAULT_LOCATIONS = exports.DEFAULT_SEARCH_KEYWORDS = exports.GREENHOUSE_COMPANIES = exports.PLATFORMS = void 0;
exports.PLATFORMS = {
    naukri: {
        name: 'Naukri.com',
        baseUrl: 'https://www.naukri.com',
        searchUrl: 'https://www.naukri.com/jobs-search',
        useApi: false,
        rateLimit: 1000,
        requiresAuth: true,
    },
    apna: {
        name: 'Apna',
        baseUrl: 'https://www.apna.co',
        searchUrl: 'https://www.apna.co/jobs',
        useApi: false,
        rateLimit: 1000,
        requiresAuth: true,
    },
    linkedin: {
        name: 'LinkedIn',
        baseUrl: 'https://www.linkedin.com',
        searchUrl: 'https://www.linkedin.com/jobs/search',
        useApi: false,
        rateLimit: 2000,
        requiresAuth: true,
    },
    indeed: {
        name: 'Indeed',
        baseUrl: 'https://www.indeed.com',
        searchUrl: 'https://www.indeed.com/jobs',
        useApi: false,
        rateLimit: 1500,
        requiresAuth: false,
    },
    greenhouse: {
        name: 'Greenhouse',
        baseUrl: 'https://boards.greenhouse.io',
        searchUrl: '',
        useApi: true,
        apiEndpoint: 'https://boards-api.greenhouse.io/v1/boards/{company}/jobs',
        rateLimit: 500,
        requiresAuth: false,
    },
    internshala: {
        name: 'Internshala',
        baseUrl: 'https://internshala.com',
        searchUrl: 'https://internshala.com/internships',
        useApi: false,
        rateLimit: 1000,
        requiresAuth: false,
    },
};
exports.GREENHOUSE_COMPANIES = [
    'stripe', 'airbnb', 'uber', 'lyft', 'dropbox', 'slack', 'zoom',
    'coinbase', 'shopify', 'atlassian', 'datadog', 'snowflake', 'mongodb',
    'twilio', 'cloudflare', 'elastic', 'github', 'gitlab', 'hashicorp',
    'pagerduty', 'squarespace', 'twilio', 'zendesk', 'asana', 'notion',
    'canva', 'figma', 'linear', 'vercel', 'supabase', 'planetscale',
];
exports.DEFAULT_SEARCH_KEYWORDS = [
    'software engineer',
    'frontend developer',
    'backend developer',
    'full stack developer',
    'devops engineer',
    'data scientist',
    'machine learning',
    'product manager',
];
exports.DEFAULT_LOCATIONS = [
    'Bangalore',
    'Mumbai',
    'Delhi',
    'Hyderabad',
    'Chennai',
    'Pune',
    'Remote',
];
exports.DAILY_APPLICATION_LIMIT = 50;
exports.RATE_LIMITS = {
    scraping: 2000,
    api: 500,
    application: 3000,
};
exports.AI_CONFIG = {
    provider: process.env.AI_PROVIDER || 'google',
    model: process.env.AI_MODEL || 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 2000,
};
