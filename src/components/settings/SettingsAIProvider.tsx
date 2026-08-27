import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Globe,
  Key,
  Server,
  Lock,
  Cpu,
  RefreshCw,
  ExternalLink,
  Shield,
  Check,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import {
  getActiveProviderId,
  setActiveProviderId,
  getAllProviders,
  getActiveProvider,
  dispatchAIReviewEvent,
} from '../../services/aiProvider';
import { secureStorage } from '../../services/secureStorage';
import { GlassCard } from '../shared/GlassCard';

interface SettingsAIProviderProps {
  onShowNotification: (msg: string, title?: string) => void;
}

export const SettingsAIProvider: React.FC<SettingsAIProviderProps> = ({ onShowNotification }) => {
  const [activeId, setActiveId] = useState<string>(() => getActiveProviderId());
  const [openAiKey, setOpenAiKey] = useState<string>('');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');
  const [ollamaUrl, setOllamaUrl] = useState<string>('http://localhost:11434');

  useEffect(() => {
    // Load stored API keys securely
    try {
      setOpenAiKey(secureStorage.getItem('openai_api_key') || '');
      setGeminiKey(secureStorage.getItem('gemini_api_key') || '');
      setAnthropicKey(secureStorage.getItem('anthropic_api_key') || '');
      setOllamaUrl(secureStorage.getItem('ollama_host_url') || 'http://localhost:11434');
    } catch (e) {
      // Ignore fallback
    }

    const handleProviderChange = () => {
      setActiveId(getActiveProviderId());
    };

    window.addEventListener('studyos_ai_provider_changed', handleProviderChange);
    return () => {
      window.removeEventListener('studyos_ai_provider_changed', handleProviderChange);
    };
  }, []);

  const handleSelectProvider = (id: string) => {
    setActiveProviderId(id);
    setActiveId(id);
    onShowNotification(`Active AI Provider set to ${id === 'manual' ? 'Manual Import' : 'Browser Convenience'}`, 'AI Provider Layer');
  };

  const handleSaveApiKey = (keyName: string, val: string, label: string) => {
    secureStorage.setItem(keyName, val);
    onShowNotification(`${label} API configuration saved securely in encrypted local vault`, 'Secure Storage');
  };

  const handleResetNotice = () => {
    localStorage.removeItem('studyos_browser_convenience_notice_seen');
    onShowNotification('Browser Convenience instruction notice reset! It will show on next generation.', 'AI Settings');
  };

  const handleTestActiveProvider = async () => {
    const provider = getActiveProvider();
    const sampleText = `Relational Database Normalization:
1NF requires atomic values.
2NF eliminates partial functional dependency.
3NF eliminates transitive functional dependency.
BCNF requires every determinant to be a candidate key.`;

    onShowNotification(`Testing active provider (${provider.name})...`, 'AI Test');
    await provider.generateNotes(sampleText, {
      subject: 'Database Management Systems',
      topic: 'Normalization Forms',
    });
  };

  const providers = getAllProviders();

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              Unified Pluggable AI Engine Layer
            </div>
            <h2 className="text-xl font-bold tracking-tight">AI Provider & Generation Gateway</h2>
            <p className="text-xs text-purple-200/80 max-w-2xl leading-relaxed">
              StudyOS routes every AI generation request (Notes, Flashcards, Quizzes, Summaries, Mind Maps, Formula Sheets) through a pluggable provider interface. Features never depend on a single AI backend.
            </p>
          </div>
          <button
            onClick={handleTestActiveProvider}
            className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/30 flex items-center gap-2 transition-all shrink-0 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Test Active Flow
          </button>
        </div>
      </div>

      {/* Active Provider Selector Section */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-600" />
              Active Zero-Cost Providers (Ready to Use)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the primary AI provider for all generation tasks in StudyOS. Zero API key, zero cost, 100% student controlled.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Manual Import Provider */}
          <div
            onClick={() => handleSelectProvider('manual')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              activeId === 'manual'
                ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-md'
                : 'border-slate-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  Default / Always Available
                </span>
                {activeId === 'manual' ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-purple-600">
                    <CheckCircle2 className="w-4 h-4" /> Active
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400">Click to Select</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">1. Manual Import Provider</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Presents a clean import dialog. Paste text generated from any AI site, textbook, or study material. StudyOS automatically parses it into typed flashcards, notes, or quizzes.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium text-slate-700">Cost: $0.00 / Offline Safe</span>
              <span className="text-purple-600 font-semibold">100% Student Driven</span>
            </div>
          </div>

          {/* Browser Convenience Provider */}
          <div
            onClick={() => handleSelectProvider('browser')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              activeId === 'browser'
                ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-md'
                : 'border-slate-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  Copy & Paste Shortcut
                </span>
                {activeId === 'browser' ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-purple-600">
                    <CheckCircle2 className="w-4 h-4" /> Active
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400">Click to Select</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">2. Browser Convenience Provider</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Copies structured prompts directly to your clipboard and opens your web AI chat. Once generated, paste the output back into StudyOS for automatic review & import.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetNotice();
                }}
                className="text-purple-600 hover:underline font-medium"
              >
                Reset Instruction Notice
              </button>
              <span className="text-blue-600 font-semibold">Zero DOM Injection</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Future Extensibility & API Providers Section */}
      <GlassCard className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" />
              Future Direct API & Local Providers (Architecture Ready)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These provider extension slots are structured in <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded font-mono">aiProvider.ts</code> and ready to enable without changing feature code.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
            Pluggable Stubs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OpenAI API */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 opacity-90 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" /> OpenAI (GPT-4o)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Direct background execution using GPT-4o. Requires student API key (never shared).
            </p>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full p-2 text-xs font-mono bg-white border border-slate-200 rounded-xl"
                />
                <button
                  onClick={() => handleSaveApiKey('openai_api_key', openAiKey, 'OpenAI')}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Google Gemini API */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 opacity-90 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> Google Gemini API
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Direct generation using Google AI Studio Gemini 1.5 Flash/Pro.
            </p>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full p-2 text-xs font-mono bg-white border border-slate-200 rounded-xl"
                />
                <button
                  onClick={() => handleSaveApiKey('gemini_api_key', geminiKey, 'Gemini')}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Anthropic Claude API */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 opacity-90 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-600" /> Anthropic (Claude 3.5)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-slate-500">
              High accuracy reasoning for complex GATE CSE & DA theory problems.
            </p>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full p-2 text-xs font-mono bg-white border border-slate-200 rounded-xl"
                />
                <button
                  onClick={() => handleSaveApiKey('anthropic_api_key', anthropicKey, 'Anthropic')}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Ollama Local LLM */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 opacity-90 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-700" /> Ollama (Local LLM)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-slate-500">
              100% offline model execution running locally on student host.
            </p>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Server Endpoint</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full p-2 text-xs font-mono bg-white border border-slate-200 rounded-xl"
                />
                <button
                  onClick={() => handleSaveApiKey('ollama_host_url', ollamaUrl, 'Ollama Host')}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Security & Zero Data Leakage Commitment */}
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Zero Bulk Data Transmission Guarantee:</strong> StudyOS only formats and sends the specific source text you explicitly highlight or select. Your entire library or personal notes are never transmitted.
          </span>
        </div>
      </div>
    </div>
  );
};
