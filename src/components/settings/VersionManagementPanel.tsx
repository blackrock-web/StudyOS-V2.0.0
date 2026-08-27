import React, { useState } from 'react';
import { Package, RefreshCw, RotateCcw, Save, Plus, FileText } from 'lucide-react';
import { versionService, VersionRecord } from '../../services/versionService';

interface Props {
  onShowNotification: (msg: string, title?: string) => void;
}

export const VersionManagementPanel: React.FC<Props> = ({ onShowNotification }) => {
  const [state, setState] = useState(versionService.getState());
  const [editVersion, setEditVersion] = useState(state.currentVersion);
  const [editNotes, setEditNotes] = useState(
    state.availableVersions.find((v) => v.version === state.currentVersion)?.releaseNotes || ''
  );
  const [newVer, setNewVer] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [showNotesFor, setShowNotesFor] = useState<string | null>(null);

  const refresh = () => setState(versionService.getState());

  const saveCurrent = () => {
    const next = versionService.setCurrentVersion(editVersion, editNotes);
    setState(next);
    onShowNotification(`Version set to ${next.currentVersion}`, 'Version Management');
  };

  const checkUpdates = () => {
    const { hasUpdate, latest, state: next } = versionService.checkForUpdates();
    setState(next);
    if (hasUpdate && latest) {
      onShowNotification(`Update available: ${latest.version}`, 'Update Checker');
      setShowNotesFor(latest.version);
    } else {
      onShowNotification('You are on the latest listed version', 'Update Checker');
    }
  };

  const addVersion = () => {
    if (!newVer.trim()) return;
    const rec: VersionRecord = {
      version: newVer.trim(),
      releaseNotes: newNotes,
      releasedAt: new Date().toISOString(),
      channel: 'stable',
    };
    setState(versionService.addAvailableVersion(rec));
    setNewVer('');
    setNewNotes('');
    onShowNotification(`Version ${rec.version} added`, 'Version Management');
  };

  const applyUpdate = () => {
    // Offline: mark applied; real binary swap is via installer / AppImage replace
    const next = versionService.applyPendingUpdate();
    setState(next);
    setEditVersion(next.currentVersion);
    onShowNotification(
      `Now on ${next.currentVersion}. Restart the app from the desktop shortcut to load the new install.`,
      'Update Applied'
    );
  };

  const rollback = () => {
    const next = versionService.rollback();
    setState(next);
    setEditVersion(next.currentVersion);
    onShowNotification(`Rolled back to ${next.currentVersion}`, 'Rollback');
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current version</div>
            <div className="text-lg font-black text-slate-900 font-mono">v{state.currentVersion}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={checkUpdates}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold hover:border-teal-300 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Check for updates
          </button>
          {state.pendingUpdate && (
            <button
              type="button"
              onClick={applyUpdate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer"
            >
              Apply {state.pendingUpdate.version}
            </button>
          )}
          {state.previousVersion && (
            <button
              type="button"
              onClick={rollback}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Rollback to {state.previousVersion}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-slate-500">Edit current version (semver)</label>
          <input
            value={editVersion}
            onChange={(e) => setEditVersion(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold"
            placeholder="1.0.1"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-bold uppercase text-slate-500">Release notes</label>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            placeholder="What changed in this release…"
          />
          <button
            type="button"
            onClick={saveCurrent}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Save version & notes
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-dashed border-slate-300 space-y-3">
        <div className="text-xs font-black text-slate-900 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add available version (for update checker)
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newVer}
            onChange={(e) => setNewVer(e.target.value)}
            placeholder="1.1.0"
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono w-full sm:w-32"
          />
          <input
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Release notes for this version"
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
          />
          <button
            type="button"
            onClick={addVersion}
            className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <div className="text-xs font-black text-slate-900 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Available versions
        </div>
        <div className="space-y-2">
          {state.availableVersions.map((v) => (
            <div
              key={v.version}
              className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-white"
            >
              <div>
                <div className="text-sm font-black font-mono text-slate-900">
                  v{v.version}
                  {v.version === state.currentVersion && (
                    <span className="ml-2 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">
                      CURRENT
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{v.releaseNotes || '—'}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotesFor(showNotesFor === v.version ? null : v.version)}
                className="text-[10px] font-bold text-blue-600 cursor-pointer shrink-0"
              >
                Notes
              </button>
            </div>
          ))}
        </div>
      </div>

      {showNotesFor && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-3">
            <h3 className="text-sm font-black text-slate-900">Release notes — v{showNotesFor}</h3>
            <p className="text-xs text-slate-600 whitespace-pre-wrap">
              {state.availableVersions.find((v) => v.version === showNotesFor)?.releaseNotes || 'No notes.'}
            </p>
            <button
              type="button"
              onClick={() => setShowNotesFor(null)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 leading-relaxed">
        Installers (.AppImage / .deb / .exe) ship separately under <code className="font-mono">release/</code>.
        User data lives in the OS app data directory and is never overwritten by an update. Use the desktop
        shortcut after installing a newer package to open the latest binary.
      </p>
    </div>
  );
};
