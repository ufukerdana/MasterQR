
export type Tab = 'scan' | 'generate' | 'history';

export type Language = 'en' | 'tr';

export type ScanType = 'text' | 'url' | 'wifi' | 'audio' | 'vcard' | 'crypto' | 'unknown';

export interface QrMeta {
  color?: string;
}

export interface HistoryItem {
  id: string;
  text: string;
  type: ScanType;
  timestamp: number;
  expiresAt?: number | null;
  meta?: QrMeta;
  source?: 'scan' | 'generate';
}

export interface ScanResult {
  text: string;
  format?: string;
  timestamp: number;
}

export interface GeneratorState {
  text: string;
  isGenerated: boolean;
}
