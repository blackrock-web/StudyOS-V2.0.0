import {
  UpdateProvider,
  UpdateState,
  UpdateCheckResult,
  UpdateInfo,
} from './UpdateProvider';
import type { StudyOSDesktopAPI } from '../../types/desktop';

export interface GitHubReleaseConfig {
  owner: string;
  repo: string;
}

const getDesktopAPI = (): StudyOSDesktopAPI | undefined => {
  if (typeof window !== 'undefined') {
    return (window as any).studyosDesktop;
  }
  return undefined;
};

export class GitHubReleaseUpdateProvider implements UpdateProvider {
  public readonly name = 'GitHubReleaseUpdateProvider';
  private config: GitHubReleaseConfig;
  private fallbackState: UpdateState = {
    status: 'idle',
    currentVersion: '1.0.0',
    availableVersion: null,
    releaseName: null,
    releaseNotes: null,
    releaseDate: null,
    progress: 0,
    error: null,
    lastCheckedAt: null,
  };
  private listeners: Set<(state: UpdateState) => void> = new Set();

  constructor(config?: Partial<GitHubReleaseConfig>) {
    this.config = {
      owner: config?.owner || 'studyos-org',
      repo: config?.repo || 'studyos-desktop',
    };

    // If running in Electron, subscribe to native status changes
    const desktop = getDesktopAPI();
    if (desktop?.onUpdateStatusChanged) {
      desktop.onUpdateStatusChanged((nativeState: UpdateState) => {
        this.fallbackState = { ...this.fallbackState, ...nativeState };
        this.notifyListeners();
      });
    }
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener({ ...this.fallbackState });
      } catch (err) {
        console.error('[GitHubReleaseUpdateProvider] Error in listener:', err);
      }
    }
  }

  public async getStatus(): Promise<UpdateState> {
    const desktop = getDesktopAPI();
    if (desktop?.getUpdateStatus) {
      try {
        const nativeState = await desktop.getUpdateStatus();
        if (nativeState) {
          this.fallbackState = { ...this.fallbackState, ...nativeState };
        }
      } catch (err) {
        console.warn('[GitHubReleaseUpdateProvider] Failed to fetch native update status:', err);
      }
    }
    return { ...this.fallbackState };
  }

  public async checkForUpdates(): Promise<UpdateCheckResult> {
    this.fallbackState.status = 'checking';
    this.fallbackState.error = null;
    this.fallbackState.lastCheckedAt = new Date().toISOString();
    this.notifyListeners();

    const desktop = getDesktopAPI();
    if (desktop?.checkForUpdates) {
      try {
        const res = await desktop.checkForUpdates();
        if (!res.ok) {
          this.fallbackState.status = 'error';
          this.fallbackState.error = res.error || 'Failed to check updates';
          this.notifyListeners();
          return {
            hasUpdate: false,
            error: this.fallbackState.error,
          };
        }

        const currentStatus = await this.getStatus();
        const hasUpdate = currentStatus.status === 'available';
        return {
          hasUpdate,
          updateInfo: hasUpdate
            ? {
                currentVersion: currentStatus.currentVersion,
                availableVersion: currentStatus.availableVersion,
                releaseName: currentStatus.releaseName,
                releaseNotes: currentStatus.releaseNotes,
                releaseDate: currentStatus.releaseDate,
              }
            : undefined,
        };
      } catch (err: any) {
        this.fallbackState.status = 'error';
        this.fallbackState.error = err?.message || 'Update check failed (offline or network error)';
        this.notifyListeners();
        return {
          hasUpdate: false,
          error: this.fallbackState.error,
        };
      }
    }

    // In web preview / mock environment without Electron bridge
    this.fallbackState.status = 'upToDate';
    this.notifyListeners();
    return {
      hasUpdate: false,
    };
  }

  public async downloadUpdate(): Promise<{ ok: boolean; error?: string }> {
    this.fallbackState.status = 'downloading';
    this.fallbackState.progress = 0;
    this.notifyListeners();

    const desktop = getDesktopAPI();
    if (desktop?.downloadUpdate) {
      try {
        const res = await desktop.downloadUpdate();
        if (!res.ok) {
          this.fallbackState.status = 'error';
          this.fallbackState.error = res.error || 'Download failed';
          this.notifyListeners();
          return { ok: false, error: this.fallbackState.error };
        }
        return { ok: true };
      } catch (err: any) {
        this.fallbackState.status = 'error';
        this.fallbackState.error = err?.message || 'Download failed';
        this.notifyListeners();
        return { ok: false, error: this.fallbackState.error };
      }
    }

    // Web simulation
    this.fallbackState.status = 'downloaded';
    this.fallbackState.progress = 100;
    this.notifyListeners();
    return { ok: true };
  }

  public async installUpdate(): Promise<{ ok: boolean; error?: string }> {
    this.fallbackState.status = 'installing';
    this.notifyListeners();

    const desktop = getDesktopAPI();
    if (desktop?.installUpdate) {
      try {
        const res = await desktop.installUpdate();
        if (!res.ok) {
          this.fallbackState.status = 'error';
          this.fallbackState.error = res.error || 'Install failed';
          this.notifyListeners();
          return { ok: false, error: this.fallbackState.error };
        }
        return { ok: true };
      } catch (err: any) {
        this.fallbackState.status = 'error';
        this.fallbackState.error = err?.message || 'Install failed';
        this.notifyListeners();
        return { ok: false, error: this.fallbackState.error };
      }
    }

    // Web simulation
    return { ok: true };
  }

  public subscribeToStatus(callback: (state: UpdateState) => void): () => void {
    this.listeners.add(callback);
    callback({ ...this.fallbackState });
    return () => {
      this.listeners.delete(callback);
    };
  }
}
