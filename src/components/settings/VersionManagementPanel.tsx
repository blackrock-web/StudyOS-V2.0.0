import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Download, CheckCircle2, AlertCircle, Sparkles, FileText, ArrowRight, ExternalLink } from 'lucide-react';
import { updateService } from '../../services/updates/UpdateService';
import { UpdateState } from '../../services/updates/UpdateProvider';
import { versionService, VersionRecord } from '../../services/versionService';

interface Props {
  onShowNotification: (msg: string, title?: string) => void;
}

export const VersionManagementPanel: React.FC<Props> = ({ onShowNotification }) => {
  const [updateState, setUpdateState] = useState<UpdateState>({
    status: 'idle',
    currentVersion: '1.0.0',
    availableVersion: null,
    releaseName: null,
    releaseNotes: null,
    releaseDate: null,
    progress: 0,
    error: null,
    lastCheckedAt: null,
  });

  const [localState, setLocalState] = useState(versionService.getState());
  const [showNotesModal, setShowNotesModal] = useState(false);

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

  const handleCheckUpdates = async () => {
    onShowNotification('Checking GitHub Releases for updates…', 'Auto-Updater');
    const result = await updateService.checkForUpdates();
    if (result.hasUpdate && result.updateInfo?.availableVersion) {
      onShowNotification(
        `New version available: v${result.updateInfo.availableVersion}`,
        'Update Available'
      );
    } else if (result.error) {
      onShowNotification(result.error, 'Update Notice');
    } else {
      onShowNotification('StudyOS Desktop is up to date!', 'Up to Date');
    }
  };

  const handleDownload = async () => {
    onShowNotification('Downloading update in the background…', 'Download Started');
    const res = await updateService.downloadUpdate();
    if (!res.ok) {
      onShowNotification(res.error || 'Failed to download update', 'Download Failed');
    }
  };

  const handleInstall = async () => {
    onShowNotification('Restarting StudyOS Desktop to apply the update…', 'Installing');
    await updateService.installUpdate();
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
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Local-first secure build with GitHub Release distribution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCheckUpdates}
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
                onClick={handleDownload}
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
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" /> Downloading update package…
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
                <div className="text-xs font-bold text-emerald-900">Update downloaded successfully</div>
                <div className="text-[11px] text-emerald-700">
                  Ready to install. Restart StudyOS Desktop to complete installation.
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
          <div className="flex items-center gap-2.5 text-xs text-slate-600 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>StudyOS is up to date with the latest GitHub release.</span>
          </div>
        )}

        {updateState.status === 'error' && updateState.error && (
          <div className="flex items-start gap-2.5 text-xs text-slate-700 px-3 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-900">Offline / Network check notice: </span>
              <span className="text-amber-800">{updateState.error}</span>
            </div>
          </div>
        )}

        <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2">
          <span>Provider: <strong className="font-mono text-slate-600">{updateService.getProviderName()}</strong></span>
          <span>
            {updateState.lastCheckedAt
              ? `Last checked: ${new Date(updateState.lastCheckedAt).toLocaleTimeString()}`
              : 'Automatic background check on startup'}
          </span>
        </div>
      </div>

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
        <div className="font-bold text-slate-800">Security & Architecture Guarantee</div>
        <p>
          Updates are fetched directly from official public GitHub Releases over HTTPS without third-party intermediaries.
          All application databases, study notes, formulas, and flashcards are kept strictly local on your device.
        </p>
      </div>
    </div>
  );
};

