import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export interface PlatformSession {
  id: string;
  platform: string;
  userId: string;
  cookies: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  lastUsed: string;
  isActive: boolean;
}

export interface PlatformCredentials {
  platform: string;
  email: string;
  password: string;
}

export class SessionManager {
  private userId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.userId = localStorage.getItem('user_id') || this.generateUserId();
    }
  }

  private generateUserId(): string {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('user_id', id);
    return id;
  }

  getUserId(): string {
    return this.userId || this.generateUserId();
  }

  async saveSession(platform: string, sessionData: any): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase.from('platform_sessions').upsert({
      platform,
      user_id: this.getUserId(),
      cookies: JSON.stringify(sessionData.cookies || {}),
      user_agent: sessionData.userAgent || '',
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      last_used: new Date().toISOString(),
      is_active: true,
    }, {
      onConflict: 'platform,user_id'
    });
  }

  async getSession(platform: string): Promise<PlatformSession | null> {
    const { data, error } = await supabase
      .from('platform_sessions')
      .select('*')
      .eq('platform', platform)
      .eq('user_id', this.getUserId())
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('last_used', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      ...data,
      cookies: data.cookies,
    };
  }

  async invalidateSession(platform: string): Promise<void> {
    await supabase
      .from('platform_sessions')
      .update({ is_active: false })
      .eq('platform', platform)
      .eq('user_id', this.getUserId());
  }

  async getAllActiveSessions(): Promise<PlatformSession[]> {
    const { data, error } = await supabase
      .from('platform_sessions')
      .select('*')
      .eq('user_id', this.getUserId())
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    return data || [];
  }

  async getSessionHealth(): Promise<Record<string, { healthy: boolean; lastUsed: string }>> {
    const sessions = await this.getAllActiveSessions();
    
    const health: Record<string, { healthy: boolean; lastUsed: string }> = {};
    
    for (const session of sessions) {
      const lastUsed = new Date(session.last_used);
      const hoursSinceUsed = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60);
      
      health[session.platform] = {
        healthy: hoursSinceUsed < 24,
        lastUsed: session.last_used,
      };
    }
    
    return health;
  }
}

export const sessionManager = new SessionManager();
