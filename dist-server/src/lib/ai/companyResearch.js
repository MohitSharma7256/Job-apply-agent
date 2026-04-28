"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyResearchService = exports.CompanyResearchService = void 0;
const dbService_1 = require("../../services/dbService");
class CompanyResearchService {
    async getCompanyProfile(companyName) {
        const cached = await this.getFromCache(companyName);
        if (cached)
            return cached;
        const profile = {
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
    async getFromCache(name) {
        try {
            const { data } = await dbService_1.supabase
                .from('company_cache')
                .select('profile')
                .eq('name', name)
                .single();
            return data?.profile || null;
        }
        catch {
            return null;
        }
    }
    async saveToCache(name, profile) {
        try {
            await dbService_1.supabase
                .from('company_cache')
                .upsert({
                name,
                profile,
                cached_at: new Date().toISOString()
            });
        }
        catch (e) { }
    }
}
exports.CompanyResearchService = CompanyResearchService;
exports.companyResearchService = new CompanyResearchService();
