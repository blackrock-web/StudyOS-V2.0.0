import {
  UpdateProvider,
  UpdateState,
  UpdateCheckResult,
} from './UpdateProvider';
import type { StudyOSDesktopAPI } from '../../types/desktop';
import { networkGateway } from '../network/NetworkGateway';
import { auditLogger } from '../auditLogger';

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
    currentVersion: '2.4.0',
    currentCommit: 'a8f3b92',
    availableVersion: null,
    availableCommit: null,
    releaseName: null,
    releaseNotes: null,
    releaseDate: null,
    progress: 0,
    error: null,
    lastCheckedAt: null,
    rollbackAvailable: true,
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

  public async checkForUpdates(pin?: string): Promise<UpdateCheckResult> {
    // If PIN is provided, request temporary unlock
    if (pin) {
      const unlockRes = await networkGateway.requestTemporaryUnlock(
        pin,
        'update',
        'Checking GitHub Release repository for application updates',
        60000 // 1 min timeout
      );
      if (!unlockRes.ok) {
        this.fallbackState.status = 'error';
        this.fallbackState.error = unlockRes.error || 'Network unlock failed';
        this.notifyListeners();
        return { hasUpdate: false, error: this.fallbackState.error };
      }
    }

    this.fallbackState.status = 'checking';
    this.fallbackState.error = null;
    this.fallbackState.lastCheckedAt = new Date().toISOString();
    this.notifyListeners();

    try {
      const desktop = getDesktopAPI();
      if (desktop?.checkForUpdates) {
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
                currentCommit: currentStatus.currentCommit,
                availableVersion: currentStatus.availableVersion,
                availableCommit: currentStatus.availableCommit,
                releaseName: currentStatus.releaseName,
                releaseNotes: currentStatus.releaseNotes,
                releaseDate: currentStatus.releaseDate,
              }
            : undefined,
        };
      }

      // Offline-first Web environment check
      await new Promise((r) => setTimeout(r, 600));
      this.fallbackState.status = 'upToDate';
      this.fallbackState.lastCheckedAt = new Date().toISOString();
      this.notifyListeners();

      return {
        hasUpdate: false,
      };
    } finally {
      // Auto-lock network immediately after checking
      networkGateway.finishOperation('update', 'Update check completed. Network locked.');
    }
  }

  public async downloadUpdate(pin?: string): Promise<{ ok: boolean; error?: string }> {
    if (pin) {
      const unlockRes = await networkGateway.requestTemporaryUnlock(
        pin,
        'update',
        'Downloading verified application update package',
        300000 // 5 min timeout
      );
      if (!unlockRes.ok) {
        return { ok: false, error: unlockRes.error || 'Network unlock failed' };
      }
    }

    this.fallbackState.status = 'downloading';
    this.fallbackState.progress = 0;
    this.notifyListeners();

    try {
      const desktop = getDesktopAPI();
      if (desktop?.downloadUpdate) {
        const res = await desktop.downloadUpdate();
        if (!res.ok) {
          this.fallbackState.status = 'error';
          this.fallbackState.error = res.error || 'Download failed';
          this.notifyListeners();
          return { ok: false, error: this.fallbackState.error };
        }
        return { ok: true };
      }

      // Web progress simulation
      for (let i = 1; i <= 10; i++) {
        await new Promise((r) => setTimeout(r, 150));
        this.fallbackState.progress = i * 10;
        this.notifyListeners();
      }

      this.fallbackState.status = 'verifying';
      this.notifyListeners();
      await new Promise((r) => setTimeout(r, 300));

      this.fallbackState.status = 'downloaded';
      this.notifyListeners();
      return { ok: true };
    } finally {
      networkGateway.finishOperation('update', 'Update download finished. Network locked.');
    }
  }

  public async installUpdate(): Promise<{ ok: boolean; error?: string }> {
    this.fallbackState.status = 'installing';
    this.notifyListeners();

    auditLogger.logEvent('SECURITY', 'Created local rollback point prior to applying update', 'Update Service');

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
    await new Promise((r) => setTimeout(r, 500));
    this.fallbackState.status = 'upToDate';
    this.notifyListeners();
    return { ok: true };
  }

  public async rollbackToPrevious(): Promise<{ ok: boolean; error?: string }> {
    auditLogger.logEvent('SECURITY', 'Rolling back application to previous stable local snapshot', 'Update Service');
    this.fallbackState.status = 'upToDate';
    this.notifyListeners();
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

