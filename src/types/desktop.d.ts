export interface StudyOSDesktopAPI {
  platform: string;
  isDesktop: boolean;
  isOffline: boolean;
  getVersion: () => Promise<string>;
  getUserDataPath: () => Promise<string>;
  saveFile: (opts: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
    content: string;
    encoding?: string;
  }) => Promise<{ ok: boolean; path?: string; error?: string }>;
  openFile: (opts: {
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<{ ok: boolean; path?: string; content?: string; error?: string }>;
  showNotification?: (title: string, body: string) => void;
  getStudyMode?: () => Promise<boolean>;
  setStudyMode?: (mode: boolean) => Promise<boolean>;
  setAlwaysOnTop?: (flag: boolean) => Promise<boolean>;
  setKioskMode?: (flag: boolean) => Promise<boolean>;
  setExamMode?: (flag: boolean, allowlist?: string[]) => Promise<boolean>;
  onMenuExportBackup: (cb: () => void) => () => void;
  checkForUpdates?: () => Promise<{ ok: boolean; error?: string; state?: any }>;
  downloadUpdate?: () => Promise<{ ok: boolean; error?: string; state?: any }>;
  installUpdate?: () => Promise<{ ok: boolean; error?: string }>;
  getUpdateStatus?: () => Promise<any>;
  onUpdateStatusChanged?: (cb: (state: any) => void) => () => void;
}

declare global {
  interface Window {
    studyosDesktop?: StudyOSDesktopAPI;
  }
}

export {};
