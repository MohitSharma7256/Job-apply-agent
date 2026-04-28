"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginManager = exports.LoginManager = void 0;
const dbService_1 = require("./dbService");
const encryption_1 = require("../lib/encryption");
class LoginManager {
    // Save session to Supabase (encrypted)
    async saveSession(userId, platform, sessionData) {
        try {
            const encryptedData = (0, encryption_1.encrypt)(JSON.stringify(sessionData));
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
            const { error } = await dbService_1.supabase
                .from('sessions')
                .upsert({
                id: `${userId}-${platform}`,
                platform,
                user_id: userId,
                encrypted_data: encryptedData,
                expires_at: expiresAt,
                is_valid: true,
                created_at: new Date().toISOString(),
            }, { onConflict: 'id' });
            if (error) {
                console.error('Session save error:', error);
                return false;
            }
            console.log(`✅ Session saved for ${platform}`);
            return true;
        }
        catch (e) {
            console.error('Session save failed:', e);
            return false;
        }
    }
    // Get session from Supabase (decrypted)
    async getSession(userId, platform) {
        try {
            const { data, error } = await dbService_1.supabase
                .from('sessions')
                .select('*')
                .eq('id', `${userId}-${platform}`)
                .eq('is_valid', true)
                .single();
            if (error || !data)
                return null;
            // Check expiry
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                await this.markSessionExpired(userId, platform);
                return null;
            }
            const decrypted = (0, encryption_1.decrypt)(data.encrypted_data);
            return JSON.parse(decrypted);
        }
        catch (e) {
            return null;
        }
    }
    // Get all sessions for a user
    async getAllSessions(userId) {
        try {
            const { data, error } = await dbService_1.supabase
                .from('sessions')
                .select('platform, is_valid, expires_at, created_at')
                .eq('user_id', userId);
            if (error || !data)
                return [];
            return data.map(d => ({
                platform: d.platform,
                isValid: d.is_valid && (!d.expires_at || new Date(d.expires_at) > new Date()),
                expiresAt: d.expires_at,
                createdAt: d.created_at,
            }));
        }
        catch {
            return [];
        }
    }
    // Mark session as expired
    async markSessionExpired(userId, platform) {
        await dbService_1.supabase
            .from('sessions')
            .update({ is_valid: false })
            .eq('id', `${userId}-${platform}`);
    }
    // Delete session
    async deleteSession(userId, platform) {
        const { error } = await dbService_1.supabase
            .from('sessions')
            .delete()
            .eq('id', `${userId}-${platform}`);
        return !error;
    }
    // Validate session by checking if cookies are still fresh
    validateSession(session) {
        if (!session?.cookies || session.cookies.length === 0)
            return false;
        const capturedAt = new Date(session.capturedAt);
        const ageInDays = (Date.now() - capturedAt.getTime()) / (1000 * 60 * 60 * 24);
        // Sessions older than 25 days are considered stale
        return ageInDays < 25;
    }
}
exports.LoginManager = LoginManager;
exports.loginManager = new LoginManager();
