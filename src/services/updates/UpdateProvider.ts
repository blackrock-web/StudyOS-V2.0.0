export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'upToDate'
  | 'error';

export interface UpdateInfo {
  currentVersion: string;
  availableVersion?: string | null;
  releaseName?: string | null;
  releaseNotes?: string | null;
  releaseDate?: string | null;
  downloadUrl?: string | null;
}

export interface UpdateState {
  status: UpdateStatus;
  currentVersion: string;
  availableVersion?: string | null;
  releaseName?: string | null;
  releaseNotes?: string | null;
  releaseDate?: string | null;
  progress: number;
  error?: string | null;
  lastCheckedAt?: string | null;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  updateInfo?: UpdateInfo;
  error?: string;
}

export interface UpdateProvider {
  readonly name: string;
  checkForUpdates(): Promise<UpdateCheckResult>;
  downloadUpdate(): Promise<{ ok: boolean; error?: string }>;
  installUpdate(): Promise<{ ok: boolean; error?: string }>;
  getStatus(): Promise<UpdateState>;
  subscribeToStatus(callback: (state: UpdateState) => void): () => void;
}
