import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.SESSION_SECRET || 'v3ry_s3cr3t_k3y_32_ch4rs_l3ngth_!!!';
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text) as any, cipher.final() as any]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const textParts = text.split(':');
  const ivStr = textParts.shift();
  if (!ivStr) return '';
  
  const iv = Buffer.from(ivStr, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText) as any, decipher.final() as any]);
  return decrypted.toString();
}
