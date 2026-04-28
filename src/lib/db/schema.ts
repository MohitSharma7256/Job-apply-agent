import { pgTable, text, timestamp, integer, boolean, jsonb, varchar, serial, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  authId: varchar('auth_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  location: varchar('location', { length: 255 }),
  headline: text('headline'),
  summary: text('summary'),
  skills: text('skills').array(),
  experience: integer('experience'),
  education: text('education'),
  targetRoles: text('target_roles').array(),
  targetLocations: text('target_locations').array(),
  targetSalary: integer('target_salary'),
  experienceLevel: varchar('experience_level', { length: 50 }),
  resumeUrl: varchar('resume_url', { length: 500 }),
  resumeText: text('resume_text'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  externalJobId: varchar('external_job_id', { length: 255 }),
  
  title: varchar('title', { length: 500 }).notNull(),
  company: varchar('company', { length: 255 }).notNull(),
  companyDomain: varchar('company_domain', { length: 255 }),
  location: varchar('location', { length: 255 }),
  
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  salaryCurrency: varchar('salary_currency', { length: 10 }),
  
  description: text('description'),
  requirements: text('requirements').array(),
  url: varchar('url', { length: 1000 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  
  postedAt: timestamp('posted_at'),
  platformJobId: varchar('platform_job_id', { length: 255 }),
  
  matchScore: real('match_score'),
  status: varchar('status', { length: 50 }).default('new'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobs.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  platform: varchar('platform', { length: 50 }).notNull(),
  resumeVariantId: integer('resume_variant_id').references(() => resumeVariants.id),
  coverLetterId: integer('cover_letter_id').references(() => coverLetters.id),
  
  status: varchar('status', { length: 50 }).default('pending'),
  appliedAt: timestamp('applied_at'),
  result: jsonb('result'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const jobQueue = pgTable('job_queue', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobs.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  priority: integer('priority').default(0),
  status: varchar('status', { length: 50 }).default('queued'),
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  lastError: text('last_error'),
  
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const platformSessions = pgTable('platform_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  
  encryptedCookies: text('encrypted_cookies'),
  userAgent: varchar('user_agent', { length: 500 }),
  
  isValid: boolean('is_valid').default(true),
  expiresAt: timestamp('expires_at'),
  lastUsed: timestamp('last_used'),
  
  loginStatus: varchar('login_status', { length: 50 }).default('never_logged'),
  lastLoginError: text('last_login_error'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const resumeVariants = pgTable('resume_variants', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 500 }),
  parsedText: text('parsed_text'),
  isDefault: boolean('is_default').default(false),
  tags: text('tags').array(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const coverLetters = pgTable('cover_letters', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id),
  userId: integer('user_id').references(() => users.id).notNull(),
  jobId: integer('job_id').references(() => jobs.id),
  
  variant: varchar('variant', { length: 50 }),
  content: text('content').notNull(),
  wordCount: integer('word_count'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const companyCache = pgTable('company_cache', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }),
  
  profile: jsonb('profile'),
  cachedAt: timestamp('cached_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
});

export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload'),
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const autoApplyConfig = pgTable('auto_apply_config', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  enabled: boolean('enabled').default(false),
  minMatchScore: integer('min_match_score').default(70),
  maxPerDay: integer('max_per_day').default(50),
  
  blacklistCompanies: text('blacklist_companies').array(),
  blacklistKeywords: text('blacklist_keywords').array(),
  whitelistCompanies: text('whitelist_companies').array(),
  whitelistKeywords: text('whitelist_keywords').array(),
  
  applyTimeStart: varchar('apply_time_start', { length: 10 }),
  applyTimeEnd: varchar('apply_time_end', { length: 10 }),
  pauseOnWeekends: boolean('pause_on_weekends').default(true),
  
  platformLimits: jsonb('platform_limits'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const platformCredentials = pgTable('platform_credentials', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  
  encryptedEmail: text('encrypted_email').notNull(),
  encryptedPassword: text('encrypted_password').notNull(),
  loginUrl: varchar('login_url', { length: 500 }),
  
  isValid: boolean('is_valid').default(false),
  lastValidated: timestamp('last_validated'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
}));

export const jobsRelations = relations(jobs, ({ many }) => ({
  applications: many(applications),
  queueItems: many(jobQueue),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type JobQueue = typeof jobQueue.$inferSelect;
export type PlatformSession = typeof platformSessions.$inferSelect;
export type ResumeVariant = typeof resumeVariants.$inferSelect;
export type CoverLetter = typeof coverLetters.$inferSelect;
export type AutoApplyConfig = typeof autoApplyConfig.$inferSelect;
export type PlatformCredential = typeof platformCredentials.$inferSelect;