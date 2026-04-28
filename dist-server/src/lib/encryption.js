"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.SESSION_SECRET || 'v3ry_s3cr3t_k3y_32_ch4rs_l3ngth_!!!';
const IV_LENGTH = 16;
function encrypt(text) {
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    // @ts-ignore
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    // @ts-ignore
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
function decrypt(text) {
    const textParts = text.split(':');
    const ivStr = textParts.shift();
    if (!ivStr)
        return '';
    const iv = Buffer.from(ivStr, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    // @ts-ignore
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    // @ts-ignore
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
}
