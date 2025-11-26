export type Tab = 'scan' | 'generate';

export type Language = 'en' | 'tr';

export interface ScanResult {
  text: string;
  format?: string;
  timestamp: number;
}

export interface GeneratorState {
  text: string;
  isGenerated: boolean;
}