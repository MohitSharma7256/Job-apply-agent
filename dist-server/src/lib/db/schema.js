"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationsRelations = exports.jobsRelations = exports.usersRelations = exports.platformCredentials = exports.autoApplyConfig = exports.activityLog = exports.companyCache = exports.coverLetters = exports.resumeVariants = exports.platformSessions = exports.jobQueue = exports.applications = exports.jobs = exports.userProfiles = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    authId: (0, pg_core_1.varchar)('auth_id', { length: 255 }).notNull().unique(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    name: (0, pg_core_1.text)('name'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.userProfiles = (0, pg_core_1.pgTable)('user_profiles', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(() => exports.users.id).notNull(),
    location: (0, pg_core_1.varchar)('location', { length: 255 }),
    headline: (0, pg_core_1.text)('headline'),
    summary: (0, pg_core_1.text)('summary'),
    skills: (0, pg_core_1.text)('skills').array(),
    experience: (0, pg_core_1.integer)('experience'),
    education: (0, pg_core_1.text)('education'),
    targetRoles: (0, pg_core_1.text)('target_roles').array(),
    targetLocations: (0, pg_core_1.text)('target_locations').array(),
    targetSalary: (0, pg_core_1.integer)('target_salary'),
    experienceLevel: (0, pg_core_1.varchar)('experience_level', { length: 50 }),
    resumeUrl: (0, pg_core_1.varchar)('resume_url', { length: 500 }),
    resumeText: (0, pg_core_1.text)('resume_text'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.jobs = (0, pg_core_1.pgTable)('jobs', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    externalJobId: (0, pg_core_1.varchar)('external_job_id', { length: 255 }),
    title: (0, pg_core_1.varchar)('title', { length: 500 }).notNull(),
    company: (0, pg_core_1.varchar)('company', { length: 255 }).notNull(),
    companyDomain: (0, pg_core_1.varchar)('company_domain', { length: 255 }),
    location: (0, pg_core_1.varchar)('location', { length: 255 }),
    salaryMin: (0, pg_core_1.integer)('salary_min'),
    salaryMax: (0, pg_core_1.integer)('salary_max'),
    salaryCurrency: (0, pg_core_1.varchar)('salary_currency', { length: 10 }),
    description: (0, pg_core_1.text)('description'),
    requirements: (0, pg_core_1.text)('requirements').array(),
    url: (0, pg_core_1.varchar)('url', { length: 1000 }).notNull(),
    platform: (0, pg_core_1.varchar)('platform', { length: 50 }).notNull(),
    postedAt: (0, pg_core_1.timestamp)('posted_at'),
    platformJobId: (0, pg_core_1.varchar)('platform_job_id', { length: 255 }),
    matchScore: (0, pg_core_1.real)('match_score'),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('new'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.applications = (0, pg_core_1.pgTable)('applications', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    jobId: (0, pg_core_1.integer)('job_id').references(() => exports.jobs.id).notNull(),
    userId: (0, pg_core_1.integer)('user_id').references(() => exports.users.id).notNull(),
    platform: (0, pg_core_1.varchar)('platform', { length: 50 }).notNull(),
    resumeVariantId: (0, pg_core_1.integer)('resume_variant_id').references(() => exports.resumeVariants.id),
    coverLetterId: (0, pg_core_1.integer)('cover_letter_id').references(() => exports.coverLetters.id),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('pending'),
    appliedAt: (0, pg_core_1.timestamp)('applied_at'),
    result: (0, pg_core_1.jsonb)('result'),
    errorMessage: (0, pg_core_1.text)('error_message'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.jobQueue = (0, pg_core_1.pgTable)('job_queue', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    jobId: (0, pg_core_1.integer)('job_id').references(() => exports.jobs.id).notNull(),
    userId: (0, pg_core_1.integer)('user_id').references(() => exports.users.id).notNull(),
    priority: (0, pg_core_1.integer)('priority').default(0),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('queued'),
    attempts: (0, pg_core_1.integer)('attempts').default(0),
    maxAttempts: (0, pg_core_1.integer)('max_attempts').default(3),
    lastError: (0, pg_core_1.text)('last_error'),
    scheduledAt: (0, pg_core_1.timestamp)('scheduled_at'),
    startedAt: (0, pg_core_1.timestamp)('started_at'),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.platformSessions = (0, pg_core_1.pgTable)('platform_sessions', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(() => exports.users.id).notNull(),
    platform: (0, pg_core_1.varchar)('platform', { length: 50 }).notNull(),
    encryptedCookies: (0, pg_core_1.text)('encrypted_cookies'),
    userAgent: (0, pg_core_1.varchar)('user_agent', { length: 500 }),
    isValid: (0, pg_core_1.boolean)('is_valid').default(true),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    lastUsed: (0, pg_core_1.timestamp)('last_used'),
    loginStatus: (0, pg_core_1.varchar)('login_status', { length: 50 }).default('never_logged'),
    lastLoginError: (0, pg_core_1.text)('last_login_error'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.resumeVariants = (0, pg_core_1.pgTable)('resume_variants', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(() => exports.users.id).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    fileUrl: (0, pg_core_1.varchar)('file_url', { length: 500 }),
    parsedText: (0, pg_core_1.text)('parsed_text'),
    isDefault: (0, pg_core_1.boolean)('is_default').default(false),
    tags: (0, pg_core_1.text)('tags').array(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.coverLetters = (0, pg_core_1.pgTable)('cover_letters', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    applicationId: (0, pg_core_1.integer)('application_id').references(() => exports.applications.id),
    userId: (0, pg_core_1.integer)('user_id').references(() => exports.users.id).notNull(),
    jobId: (0, pg_core_1.integer)('job_id').references(() => exports.jobs.id),
    variant: (0, pg_core_1.varchar)('variant', { length: 50 }),
    content: (0, pg_core_1.text)('content').notNull(),
    wordCount: (0, pg_core_1.integer)('word_count'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.companyCache = (0, pg_core_1.pgTable)('company_cache', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    domain: (0, pg_core_1.varchar)('domain', { length: 255 }).notNull().unique(),
    companyName: (0, pg_core_1.varchar)('company_name', { length: 255 }),
    profile: (0, pg_core_1.jsonb)('profile'),
    cachedAt: (0, pg_core_1.timestamp)('cached_at').defaultNow().notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
});
exports.activityLog = (0, pg_core_1.pgTable)('activity_log', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(() => exports.users.id).notNull(),
    eventType: (0, pg_core_1.varchar)('event_type', { length: 100 }).notNull(),
    payload: (0, pg_core_1.jsonb)('payload'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.autoApplyConfig = (0, pg_core_1.pgTable)('auto_apply_config', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(() => exports.users.id).notNull(),
    enabled: (0, pg_core_1.boolean)('enabled').default(false),
    minMatchScore: (0, pg_core_1.integer)('min_match_score').default(70),
    maxPerDay: (0, pg_core_1.integer)('max_per_day').default(50),
    blacklistCompanies: (0, pg_core_1.text)('blacklist_companies').array(),
    blacklistKeywords: (0, pg_core_1.text)('blacklist_keywords').array(),
    whitelistCompanies: (0, pg_core_1.text)('whitelist_companies').array(),
    whitelistKeywords: (0, pg_core_1.text)('whitelist_keywords').array(),
    applyTimeStart: (0, pg_core_1.varchar)('apply_time_start', { length: 10 }),
    applyTimeEnd: (0, pg_core_1.varchar)('apply_time_end', { length: 10 }),
    pauseOnWeekends: (0, pg_core_1.boolean)('pause_on_weekends').default(true),
    platformLimits: (0, pg_core_1.jsonb)('platform_limits'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.platformCredentials = (0, pg_core_1.pgTable)('platform_credentials', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(() => exports.users.id).notNull(),
    platform: (0, pg_core_1.varchar)('platform', { length: 50 }).notNull(),
    encryptedEmail: (0, pg_core_1.text)('encrypted_email').notNull(),
    encryptedPassword: (0, pg_core_1.text)('encrypted_password').notNull(),
    loginUrl: (0, pg_core_1.varchar)('login_url', { length: 500 }),
    isValid: (0, pg_core_1.boolean)('is_valid').default(false),
    lastValidated: (0, pg_core_1.timestamp)('last_validated'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ one }) => ({
    profile: one(exports.userProfiles, {
        fields: [exports.users.id],
        references: [exports.userProfiles.userId],
    }),
}));
exports.jobsRelations = (0, drizzle_orm_1.relations)(exports.jobs, ({ many }) => ({
    applications: many(exports.applications),
    queueItems: many(exports.jobQueue),
}));
exports.applicationsRelations = (0, drizzle_orm_1.relations)(exports.applications, ({ one }) => ({
    job: one(exports.jobs, {
        fields: [exports.applications.jobId],
        references: [exports.jobs.id],
    }),
    user: one(exports.users, {
        fields: [exports.applications.userId],
        references: [exports.users.id],
    }),
}));
