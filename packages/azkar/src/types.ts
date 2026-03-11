export interface Zikr {
  id: string;
  label: string;
  count: number;
  lastAccuracy: number;
  href?: string;
  render?: boolean;
}

export interface AzkarConfig {
  id: string;
  label: string;
  render?: boolean;
}

export interface ZikrInfo {
  id: string;
  text: string;
  source: string;
}
