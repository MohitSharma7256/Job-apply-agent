import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { Buffer } from 'buffer';

const ALGORITHM = 'aes-256-gcm';
const SESSION_KEY = process.env.SESSION_SECRET || 'default-dev-key-change-in-production';

function getKey(): Buffer {
  return scryptSync(SESSION_KEY, 'salt', 32);
}

export function encryptSession(sessionData: Record<string, unknown>): string {
  const key = getKey();
  const iv = randomBytes(16);
  
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(sessionData), 'utf8'),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decryptSession(encryptedData: string): Record<string, unknown> {
  try {
    const key = getKey();
    const data = Buffer.from(encryptedData, 'base64');
    
    const iv = data.subarray(0, 16);
    const authTag = data.subarray(16, 32);
    const encrypted = data.subarray(32);
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    return JSON.parse(decrypted.toString('utf8'));
  } catch (e) {
    console.error('Decryption failed:', e);
    return {};
  }
}

export interface PlatformSession {
  id: string;
  userId: string;
  platform: 'linkedin' | 'indeed' | 'naukri' | 'apna' | 'internshala' | 'shine' | 'greenhouse';
  encryptedCookies: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsed: Date;
  isValid: boolean;
  loginStatus: 'logged_in' | 'expired' | 'failed' | 'never_logged';
}

export async function storeSession(
  userId: string,
  platform: string,
  cookies: Record<string, unknown>
): Promise<string> {
  const encrypted = encryptSession(cookies);
  const sessionId = `${platform}_${userId}_${Date.now()}`;
  
  const session: PlatformSession = {
    id: sessionId,
    userId,
    platform: platform as PlatformSession['platform'],
    encryptedCookies: encrypted,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    lastUsed: new Date(),
    isValid: true,
    loginStatus: 'logged_in',
  };

  return sessionId;
}

export async function getSession(sessionId: string): Promise<Record<string, unknown> | null> {
  try {
    const [platform, userId] = sessionId.split('_').slice(0, 2);
    
    return {
      platform,
      userId,
      sessionData: {},
    };
  } catch (e) {
    console.error('Get session error:', e);
    return null;
  }
}

export async function validateSession(sessionId: string): Promise<boolean> {
  try {
    return true;
  } catch (e) {
    return false;
  }
}

export async function invalidateSession(sessionId: string): Promise<void> {
  console.log('Invalidating session:', sessionId);
}