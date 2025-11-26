import CryptoJS from 'crypto-js';

const PREFIX = 'MASTERQR:ENC:';

export const encryptData = (text: string, password: string): string => {
  if (!text || !password) return '';
  const encrypted = CryptoJS.AES.encrypt(text, password).toString();
  return PREFIX + encrypted;
};

export const decryptData = (cipherText: string, password: string): string | null => {
  if (!cipherText.startsWith(PREFIX)) return null;
  
  const actualCipher = cipherText.replace(PREFIX, '');
  try {
    const bytes = CryptoJS.AES.decrypt(actualCipher, password);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || null;
  } catch (e) {
    return null;
  }
};

export const isEncrypted = (text: string): boolean => {
  return text.startsWith(PREFIX);
};
