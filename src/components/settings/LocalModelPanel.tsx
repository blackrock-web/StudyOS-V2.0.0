import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Key,
  HardDrive,
  Activity,
  ShieldCheck,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { localModelManager } from '../../services/models/LocalModelManager';
import { LocalModelDescriptor } from '../../types';
import { networkGateway } from '../../services/network/NetworkGateway';

interface Props {
  onShowNotification: (msg: string, title?: string) => void;
}

export const LocalModelPanel: React.FC<Props> = ({ onShowNotification }) => {
  const [models, setModels] = useState<LocalModelDescriptor[]>(localModelManager.getModels());
  const [activeModelId, setActiveModelId] = useState<string | null>(localModelManager.getActiveModel()?.id || null);
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetModelId, setTargetModelId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const unsub = localModelManager.subscribe((updatedModels, activeId) => {
      setModels(updatedModels);
      setActiveModelId(activeId);
    });
    return () => unsub();
  }, []);

  const handleStartDownload = (modelId: string) => {
    setTargetModelId(modelId);
    setPinError(null);
    setPinInput('');
    setShowPinModal(true);
  };

  const handleConfirmDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetModelId) return;

    if (!pinInput) {
      setPinError('Please enter your Network Security PIN.');
      return;
    }

    setShowPinModal(false);
    setDownloadingModelId(targetModelId);
    onShowNotification('Temporarily unlocking network to download vetted local model...', 'Local AI');

    const res = await localModelManager.downloadAndInstallModel(
      targetModelId,
      pinInput,
      (pct, speed, bytes) => {
        // Live progress handled via subscriber
      }
    );

    setDownloadingModelId(null);
    if (res.ok) {
      onShowNotification('Local model installed and verified! Network locked.', 'Model Installed');
    } else {
      onShowNotification(res.error || 'Failed to download model', 'Error');
    }
  };

  const handleSelectActive = (modelId: string) => {
    localModelManager.setActiveModel(modelId);
    onShowNotification(`Active offline model set to ${modelId}`, 'AI Engine');
  };

  const handleRemove = async (modelId: string) => {
    const res = await localModelManager.removeModel(modelId);
    if (res.ok) {
      onShowNotification('Model removed from local storage.', 'Storage Freed');
    }
  };

  const handleTestInference = async () => {
    setIsTesting(true);
    setTestOutput(null);
    try {
      const output = await localModelManager.executeOfflineInference(
        'Generate study revision notes on Database Functional Dependencies and Armstrong Axioms for GATE CSE.'
      );
      setTestOutput(output);
      onShowNotification('Offline local inference completed successfully with 0 network calls!', 'Offline AI');
    } catch (e: any) {
      setTestOutput(`Inference error: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#E7E0F8] shadow-xs space-y-6">
        <div className="border-b border-[#E7E0F8] pb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-600" /> Models & Local AI Engine (100% Offline)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Run real local LLMs directly on your device CPU/GPU. Zero API keys, zero internet required for inference.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestInference}
            disabled={isTesting}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Running Local AI…' : 'Test Offline Generation'}
          </button>
        </div>

        {/* Test Output Box */}
        {testOutput && (
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between text-purple-400 font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Offline Local AI Output
              </span>
              <button
                type="button"
                onClick={() => setTestOutput(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto text-[11px]">
              {testOutput}
            </pre>
          </div>
        )}

        {/* Local Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((m) => {
            const isInstalled = m.status === 'installed';
            const isActive = activeModelId === m.id;
            const isDownloading = m.status === 'downloading' || m.status === 'verifying';

            return (
              <div
                key={m.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isActive
                    ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-sm'
                    : isInstalled
                    ? 'border-emerald-200 bg-white hover:border-emerald-300'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 font-mono">
                        {m.format} • {m.parameterSize}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        {m.diskSizeFormatted}
                      </span>
                    </div>

                    {isActive && (
                      <span className="flex items-center gap-1 text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{m.name}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{m.tagline}</p>
                  </div>

                  {/* Specs Matrix */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400">RAM: </span>
                      <span className="text-slate-700 font-bold">{m.recommendedRam}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Speed: </span>
                      <span className="text-emerald-700 font-bold">{m.inferenceSpeed}</span>
                    </div>
                  </div>

                  {/* Checksum & Security */}
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    SHA-256: {m.sha256.slice(0, 16)}…
                  </div>

                  {/* Progress Bar if Downloading */}
                  {isDownloading && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-purple-50 border border-purple-200">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3 animate-spin text-purple-600" />
                          {m.status === 'verifying' ? 'Verifying SHA-256 Checksum…' : 'Downloading model weights…'}
                        </span>
                        <span>{m.downloadProgress || 0}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-purple-200 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                          style={{ width: `${m.downloadProgress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isInstalled ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSelectActive(m.id)}
                        disabled={isActive}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-purple-100 text-purple-700 cursor-default'
                            : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                        }`}
                      >
                        {isActive ? 'Active Engine' : 'Use This Model'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(m.id)}
                        className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartDownload(m.id)}
                      disabled={isDownloading}
                      className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Model ({m.diskSizeFormatted})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PIN Authorization Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Authorize Model Download</h3>
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
              Downloading this model will temporarily enable network access exclusively to <strong>HuggingFace</strong>.
              Upon verification, network access will immediately auto-lock.
            </p>

            <form onSubmit={handleConfirmDownload} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Enter Network Security PIN</label>
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
                  Unlock & Download Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
