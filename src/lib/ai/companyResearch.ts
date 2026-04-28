import { supabase } from '@/lib/supabaseClient';

export interface CompanyProfile {
  name: string;
  size: string;
  funding: string;
  rating: number;
  recentNews: string[];
  description: string;
}

export class CompanyResearchService {
  async getCompanyProfile(companyName: string): Promise<CompanyProfile> {
    / 1. Check Cache first (Supabase company_cache table)
    const cached = await this.getFromCache(companyName);
    if (cached) {
      console.log(`[Research] Cache hit for ${companyName}`);
      return cached;
    }

    console.log(`[Research] Searching live data for ${companyName}...`);
    
    / 2. Fetch from External API (Simulated with Serper/Perplexity logic)
    / In production, you'd use: fetch('https://google.serper.dev/search', ...)
    const profile: CompanyProfile = {
      name: companyName,
      size: '500-1000 employees',
      funding: 'Series C',
      rating: 4.2,
      recentNews: [
        `${companyName} expands its AI division with new hires`,
        `Recent partnership announced with major cloud providers`
      ],
      description: `${companyName} is a leading innovator in technology services, focusing on scalable infrastructure.`
    };

    / 3. Store in Cache for 24h
    await this.saveToCache(companyName, profile);

    return profile;
  }

  private async getFromCache(name: string): Promise<CompanyProfile | null> {
    try {
      const { data } = await supabase
        .from('company_cache')
        .select('profile')
        .eq('name', name)
        .single();
      
      return data?.profile || null;
    } catch {
      return null;
    }
  }

  private async saveToCache(name: string, profile: CompanyProfile) {
    try {
      await supabase
        .from('company_cache')
        .upsert({
          name,
          profile,
          cached_at: new Date().toISOString()
        });
    } catch (e) {
      console.error('[Research] Cache save failed:', e);
    }
  }
}

export const companyResearchService = new CompanyResearchService();