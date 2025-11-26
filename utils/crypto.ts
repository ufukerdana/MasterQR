
// Re-export specific helpers from payload to avoid breaking existing imports if any remain,
// though we will update App.tsx and components to use payload.ts
import { parsePayload, decryptPayload } from './payload';

export const isEncrypted = (text: string): boolean => {
    return parsePayload(text).isEncrypted;
};

export const extractEncryptedData = (text: string): string => {
    const payload = parsePayload(text);
    return payload.data || text;
};

export const decryptData = decryptPayload;

// Allow direct encryption for legacy/internal use if needed
import CryptoJS from 'crypto-js';
const PREFIX = 'MASTERQR:ENC:';
export const encryptData = (text: string, password: string): string => {
    if (!text || !password) return '';
    return PREFIX + CryptoJS.AES.encrypt(text, password).toString();
};
