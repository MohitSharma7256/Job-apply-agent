import { Job } from '@/types';

interface CacheEntry {
  data: Job[];
  timestamp: number;
}

export class JobCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL = 10 * 60 * 1000; // 10 minutes

  get(key: string): Job[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: Job[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  generateKey(params: any): string {
    return JSON.stringify(params);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const jobCacheService = new JobCacheService();
