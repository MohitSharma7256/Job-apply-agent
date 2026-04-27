import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || 'job-agent-default-key-32-chars!!'; // Must be 32 chars
const ALGORITHM = 'aes-256-cbc';

export function encrypt(text: string): string {
  try {
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (e) {
    // Fallback: base64 encode if crypto fails
    return Buffer.from(text).toString('base64');
  }
}

export function decrypt(text: string): string {
  try {
    if (!text.includes(':')) {
      // Fallback: base64 decode
      return Buffer.from(text, 'base64').toString('utf8');
    }
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch (e) {
    return text;
  }
}
