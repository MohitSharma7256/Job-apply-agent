import { supabase } from '@/services/dbService';

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
    const cached = await this.getFromCache(companyName);
    if (cached) return cached;

    const profile: CompanyProfile = {
      name: companyName,
      size: '500-1000 employees',
      funding: 'Series C',
      rating: 4.2,
      recentNews: [],
      description: `${companyName} is a leading innovator in technology services.`
    };

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
    } catch (e) {}
  }
}

export const companyResearchService = new CompanyResearchService();
