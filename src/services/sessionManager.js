import { supabase } from './dbService';
import { encrypt, decrypt } from '../lib/encryption';

class LoginManager {
  async saveSession(userId, platform, sessionData) {
    try {
      const encryptedData = encrypt(JSON.stringify(sessionData));
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
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

      if (error) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  async getSession(userId, platform) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', `${userId}-${platform}`)
        .eq('is_valid', true)
        .single();

      if (error || !data) return null;

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        await this.markSessionExpired(userId, platform);
        return null;
      }

      const decrypted = decrypt(data.encrypted_data);
      return JSON.parse(decrypted);
    } catch (e) {
      return null;
    }
  }

  async markSessionExpired(userId, platform) {
    await supabase
      .from('sessions')
      .update({ is_valid: false })
      .eq('id', `${userId}-${platform}`);
  }
}

export const loginManager = new LoginManager();
