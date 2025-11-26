export type Tab = 'scan' | 'generate' | 'history';

export type Language = 'en' | 'tr';

export type ScanType = 'text' | 'url' | 'wifi' | 'unknown';

export interface HistoryItem {
  id: string;
  text: string;
  type: ScanType;
  timestamp: number;
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