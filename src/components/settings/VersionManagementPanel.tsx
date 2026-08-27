import React, { useState, useEffect } from 'react';
import {
  Package,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
  Key,
  ShieldCheck,
  RotateCcw,
  GitCommit,
} from 'lucide-react';
import { updateService } from '../../services/updates/UpdateService';
import { UpdateState } from '../../services/updates/UpdateProvider';
import { versionService } from '../../services/versionService';

interface Props {
  onShowNotification: (msg: string, title?: string) => void;
}

export const VersionManagementPanel: React.FC<Props> = ({ onShowNotification }) => {
  const [updateState, setUpdateState] = useState<UpdateState>({
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
  });

  const [localState] = useState(versionService.getState());
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'check' | 'download' | 'install'>('check');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    updateService.getStatus().then((s) => setUpdateState(s));

    // Subscribe to live status transitions
    const unsubscribe = updateService.subscribe((s) => {
      setUpdateState(s);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const triggerPinPrompt = (action: 'check' | 'download' | 'install') => {
    setPendingAction(action);
    setPinInput('');
    setPinError(null);
    setShowPinModal(true);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('Please enter your Network Security PIN.');
      return;
    }

    setShowPinModal(false);

    if (pendingAction === 'check') {
      onShowNotification('Temporarily unlocking network to query GitHub Releases…', 'Auto-Updater');
      const result = await updateService.checkForUpdates(pinInput);
      if (result.hasUpdate && result.updateInfo?.availableVersion) {
        onShowNotification(
          `New version available: v${result.updateInfo.availableVersion} (${result.updateInfo.availableCommit || 'release'})`,
          'Update Available'
        );
      } else if (result.error) {
        onShowNotification(result.error, 'Update Notice');
      } else {
        onShowNotification('StudyOS Desktop is up to date! Network access locked.', 'Up to Date');
      }
    } else if (pendingAction === 'download') {
      onShowNotification('Temporarily unlocking network to download verified package…', 'Downloading');
      const res = await updateService.downloadUpdate(pinInput);
      if (!res.ok) {
        onShowNotification(res.error || 'Failed to download update', 'Download Failed');
      } else {
        onShowNotification('Update downloaded and verified. Network locked.', 'Ready to Install');
      }
    }
  };

  const handleInstall = async () => {
    onShowNotification('Restarting StudyOS Desktop to apply verified update…', 'Installing');
    await updateService.installUpdate();
  };

  const handleRollback = async () => {
    const res = await updateService.rollbackToPrevious();
    if (res.ok) {
      onShowNotification('Restored previous application version snapshot from local backup.', 'Rollback Complete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Auto-Updater Status Card */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">StudyOS Desktop</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  v{updateState.currentVersion || localState.currentVersion}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200">
                  <GitCommit className="w-3 h-3 text-purple-600" />
                  {updateState.currentCommit || 'a8f3b92'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Local-first secure build with Git & GitHub Release verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => triggerPinPrompt('check')}
              disabled={updateState.status === 'checking' || updateState.status === 'downloading'}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${updateState.status === 'checking' ? 'animate-spin text-blue-600' : ''}`} />
              {updateState.status === 'checking' ? 'Checking…' : 'Check for updates'}
            </button>
          </div>
        </div>

        {/* Live Status Indicators */}
        {updateState.status === 'available' && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-900">
                  Update Ready: {updateState.releaseName || `v${updateState.availableVersion}`}
                </span>
                {updateState.availableCommit && (
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    commit: {updateState.availableCommit}
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-700">
                A new version is published on GitHub. Review release notes or download now.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {updateState.releaseNotes && (
                <button
                  type="button"
                  onClick={() => setShowNotesModal(true)}
                  className="px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs font-semibold text-blue-700 hover:bg-blue-50 cursor-pointer"
                >
                  View Notes
                </button>
              )}
              <button
                type="button"
                onClick={() => triggerPinPrompt('download')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Update
              </button>
            </div>
          </div>
        )}

        {updateState.status === 'downloading' && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" /> Downloading verified update package…
              </span>
              <span>{updateState.progress}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-blue-200 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${updateState.progress}%` }}
              />
            </div>
          </div>
        )}

        {updateState.status === 'downloaded' && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-900">Update downloaded and verified</div>
                <div className="text-[11px] text-emerald-700">
                  Ready to install. Safe rollback point will be preserved automatically.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              Restart & Install
            </button>
          </div>
        )}

        {updateState.status === 'upToDate' && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>StudyOS is up to date. Verified commit hash: <strong>{updateState.currentCommit}</strong></span>
            </div>

            {updateState.rollbackAvailable && (
              <button
                type="button"
                onClick={handleRollback}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-bold text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-purple-600" />
                Rollback Point Active
              </button>
            )}
          </div>
        )}

        {updateState.status === 'error' && updateState.error && (
          <div className="flex items-start gap-2.5 text-xs text-slate-700 px-3 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-900">Network / Update notice: </span>
              <span className="text-amber-800">{updateState.error}</span>
            </div>
          </div>
        )}

        <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2">
          <span>Provider: <strong className="font-mono text-slate-600">{updateService.getProviderName()}</strong></span>
          <span>
            {updateState.lastCheckedAt
              ? `Last checked: ${new Date(updateState.lastCheckedAt).toLocaleTimeString()}`
              : 'Network locked by default • Requires PIN to check'}
          </span>
        </div>
      </div>

      {/* PIN Prompt Modal for Updates */}
      {showPinModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Authorize Update Check</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Network access is required to query the official GitHub repository.
              Enter your PIN to temporarily open an isolated network channel. It will automatically lock upon completion.
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Enter Security PIN</label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter 4-6 digit PIN"
                  autoFocus
                  className="w-full p-3 text-sm font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-600 focus:bg-white"
                />
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {pinError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Unlock Network & Check
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Release Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Release Notes — {updateState.releaseName || `v${updateState.availableVersion}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans">
              {updateState.releaseNotes || 'No detailed release notes provided.'}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline & Architecture Notes */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-600 space-y-1.5">
        <div className="font-bold text-slate-800">Security & Isolation Guarantee</div>
        <p>
          Updates are fetched directly from official public GitHub Releases over HTTPS without third-party intermediaries.
          All application databases, study notes, formulas, and flashcards are kept strictly local on your device.
        </p>
      </div>
    </div>
  );
};


