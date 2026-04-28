import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.SESSION_SECRET || 'v3ry_s3cr3t_k3y_32_ch4rs_l3ngth_!!!'; // Must be 32 chars
const IV_LENGTH = 16;

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key as any, iv as any);
    
    const encrypted = Buffer.concat([(cipher as any).update(text, 'utf8'), (cipher as any).final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    try {
        const textParts = text.split(':');
        const ivPart = textParts.shift();
        if (!ivPart) throw new Error('Invalid IV');
        
        const iv = Buffer.from(ivPart, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
        const decipher = crypto.createDecipheriv(ALGORITHM, key as any, iv as any);
        
        const decrypted = Buffer.concat([(decipher as any).update(encryptedText), (decipher as any).final()]);
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption failed:', error);
        return '';
    }
}
