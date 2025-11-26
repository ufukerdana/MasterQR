
import CryptoJS from 'crypto-js';

const PREFIX = 'MASTERQR:ENC:';

export interface PayloadData {
    raw: string;
    isEncrypted: boolean;
    expiresAt: number | null;
    isExpired: boolean;
    data: string | null; // The usable data (if not encrypted, or same as raw)
}

// Helper to clean URL from the actual App URL to get parameters
const getParamsFromText = (text: string): URLSearchParams | null => {
    if (!text) return null;
    try {
        const url = new URL(text);
        // Only consider it a "Payload URL" if it has 'd' (data) parameter
        if (url.searchParams.has('d')) {
            return url.searchParams;
        }
    } catch (e) {
        // Fallback for partial strings like "?d=..."
        if (text.includes('?d=')) {
            const qs = text.substring(text.indexOf('?'));
            return new URLSearchParams(qs);
        }
    }
    return null;
};

export const createPayloadUrl = (data: string, encryptionPass: string, expiryMs: number | null): string => {
    let finalData = data;
    
    // 1. Encrypt if needed
    if (encryptionPass) {
        finalData = PREFIX + CryptoJS.AES.encrypt(data, encryptionPass).toString();
    }

    // 2. Build URL
    const baseUrl = window.location.origin + window.location.pathname;
    const cleanBase = baseUrl.replace(/([^:]\/)\/+/g, "$1");
    
    const params = new URLSearchParams();
    params.set('d', finalData);
    
    if (expiryMs) {
        const expiryTimestamp = Date.now() + expiryMs;
        params.set('exp', expiryTimestamp.toString());
    }

    return `${cleanBase}?${params.toString()}`;
};

export const parsePayload = (text: string): PayloadData => {
    const params = getParamsFromText(text);
    
    let rawContent = text;
    let expiresAt: number | null = null;
    
    // If it's a deep link, extract params
    if (params) {
        const d = params.get('d');
        const exp = params.get('exp');
        
        if (d) rawContent = decodeURIComponent(d);
        if (exp) {
            const ts = parseInt(exp, 10);
            if (!isNaN(ts)) expiresAt = ts;
        }
    }

    const isEncrypted = rawContent.startsWith(PREFIX);
    const isExpired = expiresAt !== null && Date.now() > expiresAt;

    return {
        raw: text,
        data: rawContent, // This might be encrypted string or plain text
        isEncrypted,
        expiresAt,
        isExpired
    };
};

export const decryptPayload = (encryptedText: string, password: string): string | null => {
    if (!encryptedText.startsWith(PREFIX)) return encryptedText; // Should not happen if logic is correct
    
    const actualCipher = encryptedText.replace(PREFIX, '');
    try {
        const bytes = CryptoJS.AES.decrypt(actualCipher, password);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || null;
    } catch (e) {
        return null;
    }
};
