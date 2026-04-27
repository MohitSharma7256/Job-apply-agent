import { Job, JobSearchParams } from '@/types';
import crypto from 'crypto';

export abstract class JobSearchAdapter {
  abstract platformName: string;
  
  abstract search(params: JobSearchParams): Promise<Job[]>;
  
  /**
   * Helper to execute search with retries and timeout
   */
  protected async executeSearch(
    searchFn: () => Promise<Job[]>,
    maxRetries = 2,
    timeoutMs = 15000
  ): Promise<Job[]> {
    let lastError: any;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        );
        
        const result = await Promise.race([searchFn(), timeoutPromise]);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`[${this.platformName}] Attempt ${i + 1} failed: ${error.message}`);
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
      }
    }
    
    console.error(`[${this.platformName}] All ${maxRetries + 1} attempts failed.`);
    return [];
  }

  /**
   * Generate a unique hash for deduplication
   */
  protected generateJobHash(job: Partial<Job>): string {
    const raw = `${job.title}-${job.company}-${job.location}`.toLowerCase().replace(/\s+/g, '');
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  protected parseExperienceLevel(exp: string): 'fresher' | 'mid' | 'senior' | 'lead' | 'any' {
    if (!exp) return 'any';
    const lower = exp.toLowerCase();
    if (lower.includes('fresher') || lower.includes('0') || lower.includes('entry')) return 'fresher';
    if (lower.includes('senior') || lower.includes('lead') || lower.includes('manager')) return 'senior';
    if (lower.includes('mid') || lower.includes('2-5')) return 'mid';
    return 'any';
  }

  protected extractSkills(text: string): string[] {
    const skillKeywords = [
      'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
      'node', 'express', 'django', 'flask', 'spring', 'aws', 'azure', 'gcp',
      'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql', 'redis',
      'git', 'linux', 'machine learning', 'data science', 'tensorflow', 'pytorch',
      'html', 'css', 'sass', 'tailwind', 'next', 'nuxt', 'graphql', 'rest',
    ];
    
    const found: string[] = [];
    const lower = text.toLowerCase();
    
    skillKeywords.forEach(skill => {
      if (lower.includes(skill)) {
        found.push(skill);
      }
    });

    return [...new Set(found)];
  }
}
