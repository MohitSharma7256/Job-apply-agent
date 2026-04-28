"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptSession = encryptSession;
exports.decryptSession = decryptSession;
exports.storeSession = storeSession;
exports.getSession = getSession;
exports.validateSession = validateSession;
exports.invalidateSession = invalidateSession;
const crypto_1 = require("crypto");
const buffer_1 = require("buffer");
const ALGORITHM = 'aes-256-gcm';
const SESSION_KEY = process.env.SESSION_SECRET || 'default-dev-key-change-in-production';
function getKey() {
    return (0, crypto_1.scryptSync)(SESSION_KEY, 'salt', 32);
}
function encryptSession(sessionData) {
    const key = getKey();
    const iv = (0, crypto_1.randomBytes)(16);
    const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, key, iv);
    const encrypted = buffer_1.Buffer.concat([
        cipher.update(JSON.stringify(sessionData), 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return buffer_1.Buffer.concat([iv, authTag, encrypted]).toString('base64');
}
function decryptSession(encryptedData) {
    try {
        const key = getKey();
        const data = buffer_1.Buffer.from(encryptedData, 'base64');
        const iv = data.subarray(0, 16);
        const authTag = data.subarray(16, 32);
        const encrypted = data.subarray(32);
        const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = buffer_1.Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]);
        return JSON.parse(decrypted.toString('utf8'));
    }
    catch (e) {
        console.error('Decryption failed:', e);
        return {};
    }
}
async function storeSession(userId, platform, cookies) {
    const encrypted = encryptSession(cookies);
    const sessionId = `${platform}_${userId}_${Date.now()}`;
    const session = {
        id: sessionId,
        userId,
        platform: platform,
        encryptedCookies: encrypted,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(),
        isValid: true,
        loginStatus: 'logged_in',
    };
    return sessionId;
}
async function getSession(sessionId) {
    try {
        const [platform, userId] = sessionId.split('_').slice(0, 2);
        return {
            platform,
            userId,
            sessionData: {},
        };
    }
    catch (e) {
        console.error('Get session error:', e);
        return null;
    }
}
async function validateSession(sessionId) {
    try {
        return true;
    }
    catch (e) {
        return false;
    }
}
async function invalidateSession(sessionId) {
    console.log('Invalidating session:', sessionId);
}
