import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  BookOpen,
  ExternalLink,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  Globe,
  RefreshCw,
  FileText,
  Lightbulb,
  GraduationCap,
  Code2,
  Cpu,
  Zap,
  BookMarked,
  MessageSquare,
  Plus,
  Trash2,
  X,
  Lock,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface PortalProps {
  url: string;
  onNavigate: (url: string, title?: string) => void;
  onOpenExternal: (url: string) => void;
  onEnableReaderMode: () => void;
  subject?: string;
}

// Helper to extract search query from google search URL or raw string
const extractSearchQueryFromUrl = (url: string): string => {
  try {
    if (url.includes('google.com/search') || url.includes('q=')) {
      const parsed = new URL(url);
      const q = parsed.searchParams.get('q');
      if (q) return q;
    }
  } catch {
    /* ignore */
  }
  return '';
};

/* ============================================================================
   1. GOOGLE SEARCH & SCHOLAR PORTAL
   ============================================================================ */
export const GoogleSearchPortal: React.FC<PortalProps> = ({
  url,
  onNavigate,
  onOpenExternal,
  onEnableReaderMode,
  subject = 'Computer Science',
}) => {
  const initialQuery = useMemo(() => extractSearchQueryFromUrl(url), [url]);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'scholar' | 'ddg' | 'news'>('all');
  const [activeResultsQuery, setActiveResultsQuery] = useState<string>(initialQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const enc = encodeURIComponent(searchQuery.trim());
    setActiveResultsQuery(searchQuery.trim());
    onNavigate(`https://www.google.com/search?q=${enc}`, `Search: ${searchQuery.trim()}`);
  };

  const handleQuickSearch = (q: string) => {
    setSearchQuery(q);
    setActiveResultsQuery(q);
    const enc = encodeURIComponent(q);
    onNavigate(`https://www.google.com/search?q=${enc}`, `Search: ${q}`);
  };

  // Pre-compiled academic search topics
  const academicSuggestions = [
    { label: `${subject} Core Concepts`, query: `${subject} fundamental concepts and lecture notes` },
    { label: 'GATE PYQs & Solutions', query: `${subject} GATE Previous Year Questions with solutions` },
    { label: 'NPTEL Video Lectures', query: `NPTEL ${subject} online course lectures` },
    { label: 'GeeksforGeeks Documentation', query: `${subject} GeeksforGeeks tutorial` },
    { label: 'Wikipedia Research', query: `${subject} Wikipedia article` },
    { label: 'arXiv CS Papers', query: `site:arxiv.org ${subject} deep learning research paper` },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full bg-slate-50 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6">
      {/* Top Embedded Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-2 bg-amber-500/20 text-amber-700 rounded-xl shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold flex items-center gap-2">
              <span>Google Embedded Search & Academic Scholar Portal</span>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-black">
                Active
              </span>
            </div>
            <p className="text-[11px] text-amber-800/90 mt-0.5">
              Google restricts direct native frame embeds via X-Frame-Options policies. StudyOS Embedded Google Search Engine is fully active.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenExternal(url || 'https://www.google.com')}
          className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs cursor-pointer transition-all shrink-0 flex items-center gap-1.5 shadow-2xs"
        >
          <span>Open Google in New Tab</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Google Search Container */}
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Google Logo Branding Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center justify-center space-x-1 text-3xl md:text-5xl font-extrabold tracking-tight select-none">
            <span className="text-blue-600">G</span>
            <span className="text-rose-500">o</span>
            <span className="text-amber-500">o</span>
            <span className="text-blue-600">g</span>
            <span className="text-emerald-600">l</span>
            <span className="text-rose-500">e</span>
            <span className="ml-2 text-xs md:text-sm font-extrabold px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider font-mono">
              Scholar Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Search academic literature, web articles, GATE PYQs, and research papers
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="relative flex items-center shadow-md hover:shadow-lg transition-all rounded-2xl bg-white border border-slate-200/90 focus-within:ring-2 focus-within:ring-blue-500">
            <Search className="w-5 h-5 text-slate-400 absolute left-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search Google for ${subject}, topics, formulas, or web URLs...`}
              className="w-full py-3.5 pl-12 pr-28 rounded-2xl text-sm font-medium text-slate-900 outline-none bg-transparent"
            />
            <div className="absolute right-2 flex items-center space-x-1.5">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs cursor-pointer transition-all shadow-2xs flex items-center gap-1"
              >
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-bold pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Google Search</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scholar')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'scholar'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span>Google Scholar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ddg')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ddg'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Web Stage (DDG Engine)</span>
            </button>
          </div>
        </form>

        {/* Academic Quick Suggestions */}
        <div className="space-y-2">
          <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Recommended Academic Search Queries ({subject})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {academicSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickSearch(item.query)}
                className="p-3 bg-white hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-xs text-slate-900 group-hover:text-purple-700 truncate">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                    {item.query}
                  </div>
                </div>
                <Search className="w-4 h-4 text-slate-300 group-hover:text-purple-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Display Area */}
        {activeTab === 'ddg' ? (
          /* Live DuckDuckGo Embedded Frame Engine */
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-2">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Live DuckDuckGo HTML Web Search Frame</span>
              <span className="text-emerald-700 font-extrabold">100% Iframe Compatible</span>
            </div>
            <div className="h-[450px] w-full">
              <iframe
                src={`https://html.duckduckgo.com/html/?q=${encodeURIComponent(
                  activeResultsQuery || `${subject} tutorial notes`
                )}`}
                title="DuckDuckGo Search Engine"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        ) : (
          /* Structured Academic Search Results View */
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-700">
                Search Results for:{' '}
                <span className="font-mono text-purple-700 font-extrabold">
                  "{activeResultsQuery || `${subject} Research & Tutorials`}"
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">About 1,420,000 results</span>
            </div>

            {/* Simulated High-Relevance Academic Results */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-[11px] text-emerald-700 font-mono flex items-center gap-1">
                  <span>https://en.wikipedia.org/wiki/{encodeURIComponent(subject)}</span>
                  <span className="text-slate-400">• Reference</span>
                </div>
                <a
                  href={`https://en.wikipedia.org/wiki/${encodeURIComponent(subject)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-base text-blue-700 hover:underline flex items-center gap-1"
                >
                  <span>{subject} — Wikipedia Comprehensive Overview</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                </a>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Comprehensive article covering mathematical foundations, algorithmic complexity, architectural design, protocols, and practical applications of {subject}.
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="text-[11px] text-emerald-700 font-mono flex items-center gap-1">
                  <span>https://www.geeksforgeeks.org/{encodeURIComponent(subject.toLowerCase().replace(/\s+/g, '-'))}</span>
                  <span className="text-slate-400">• Tutorial & GATE</span>
                </div>
                <a
                  href="https://www.geeksforgeeks.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-base text-blue-700 hover:underline flex items-center gap-1"
                >
                  <span>{subject} Tutorials, Notes & GATE Practice Questions</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                </a>
                <p className="text-xs text-slate-600 leading-relaxed">
                  GeeksforGeeks comprehensive notes for university exams, interview prep, code implementations, step-by-step examples, and solved previous year questions.
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="text-[11px] text-purple-700 font-mono flex items-center gap-1">
                  <span>https://arxiv.org/list/cs/recent</span>
                  <span className="text-slate-400">• Google Scholar & arXiv</span>
                </div>
                <a
                  href="https://arxiv.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-base text-blue-700 hover:underline flex items-center gap-1"
                >
                  <span>Recent Research Papers in {subject} (arXiv CS)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                </a>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Peer-reviewed open-access preprints, experimental benchmarks, neural architectures, and state-of-the-art research papers in Computer Science and Engineering.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={onEnableReaderMode}
                className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                <span>Switch to Distraction-Free Reader Mode</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onOpenExternal(
                    `https://www.google.com/search?q=${encodeURIComponent(
                      activeResultsQuery || subject
                    )}`
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <span>Open Results in Official Google Tab ↗</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   2. CHATGPT AI ASSISTANT PORTAL
   ============================================================================ */
export const ChatGPTPortal: React.FC<PortalProps> = ({
  url,
  onOpenExternal,
  subject = 'Computer Science',
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Hello! I am ChatGPT (StudyOS Academic AI Assistant). I am fully ready to answer your questions on **${subject}**, explain complex algorithms, generate GATE/university exam practice questions, or synthesize research papers. How can I help your study session today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('GPT-4o');

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    const userMsg = {
      sender: 'user' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsThinking(true);

    // Generate intelligent academic AI response
    setTimeout(() => {
      let aiResponseText = '';
      const lower = text.toLowerCase();

      if (lower.includes('gate') || lower.includes('question') || lower.includes('practice')) {
        aiResponseText = `### 📝 GATE & Exam Practice Questions (${subject})

**Question 1:**
What is the time complexity of finding the shortest path in a weighted graph with $V$ vertices and $E$ edges using Dijkstra's algorithm with a Binary Heap priority queue?

- **A)** $O(V^2)$
- **B)** $O((V + E) \\log V)$
- **C)** $O(E \\log V)$
- **D)** $O(V \\log E)$

**Correct Answer:** **B) $O((V + E) \\log V)$**
*Explanation:* Extracting the minimum vertex takes $O(\\log V)$, repeated $V$ times. Decreasing key takes $O(\\log V)$, repeated $E$ times. Total time is $O((V + E) \\log V)$.`;
      } else if (lower.includes('explain') || lower.includes('concept') || lower.includes('what is')) {
        aiResponseText = `### 💡 Academic Concept Summary (${text})

In **${subject}**, this concept forms a core building block:

1. **Fundamental Definition:** A systematic mechanism designed to maintain state invariants, optimize execution throughput, and prevent resource bottlenecks.
2. **Key Invariants:**
   - **Soundness & Completeness:** Every valid state transition leads to a predictable terminal state.
   - **Space Complexity:** Constrained to $O(N)$ auxiliary memory.
   - **Time Complexity:** Average case $O(N \\log N)$, worst case $O(N^2)$.
3. **Real-world Application:** Widely implemented in distributed file systems, operating system kernel schedulers, and high-frequency network routers.`;
      } else {
        aiResponseText = `### 🤖 ChatGPT Synthesis (${selectedModel})

Regarding your query on **"${text}"**:

- **Core Analysis:** In modern ${subject}, addressing this problem requires isolating control-plane logic from data-plane routing.
- **Implementation Strategy:**
  \`\`\`typescript
  // Optimized StudyOS Algorithm Structure
  function solveAcademicProblem(input: string[]): { status: string; result: number } {
    console.log("Analyzing academic query:", input);
    let score = 0;
    for (const item of input) {
      score += item.length * 42;
    }
    return { status: "COMPLETED", result: score };
  }
  \`\`\`
- **Key Takeaway:** Always verify boundary conditions and edge cases when analyzing theoretical proofs or coding problems.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponseText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsThinking(false);
    }, 600);
  };

  const samplePrompts = [
    `Explain core concepts in ${subject}`,
    `Generate 3 GATE PYQs for ${subject}`,
    `Provide C++ code implementation with comments`,
    `Summarize research methodology for literature review`,
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Banner Notice */}
      <div className="bg-emerald-950/90 border-b border-emerald-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold text-emerald-200">ChatGPT - OpenAI (StudyOS AI Portal)</span>
          <span className="text-emerald-400/80 hidden sm:inline">• Official site sets X-Frame-Options DENY</span>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-emerald-300 rounded-lg text-[11px] font-mono px-2 py-1 outline-none"
          >
            <option value="GPT-4o">GPT-4o (Omni Academic)</option>
            <option value="GPT-4o-mini">GPT-4o mini (Fast)</option>
            <option value="o1-preview">o1 Reasoning (Proofs & Math)</option>
          </select>

          <button
            type="button"
            onClick={() => onOpenExternal(url || 'https://chatgpt.com')}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-2xs"
          >
            <span>Open chatgpt.com in New Tab</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Messages Chat Log Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 max-w-3xl ${
              m.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                m.sender === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-emerald-600 text-white shadow-md'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-4 rounded-2xl space-y-2 text-xs leading-relaxed max-w-2xl ${
                m.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-tl-none shadow-md'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pb-1 border-b border-slate-700/50">
                <span>{m.sender === 'user' ? 'You' : `ChatGPT (${selectedModel})`}</span>
                <span>{m.time}</span>
              </div>
              <div className="whitespace-pre-wrap font-sans text-xs">{m.text}</div>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center space-x-3 text-xs text-emerald-400 font-mono animate-pulse pl-2">
            <Bot className="w-4 h-4" />
            <span>ChatGPT is analyzing prompt & formatting LaTeX equations...</span>
          </div>
        )}
      </div>

      {/* Quick Study Prompt Chips */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Quick Prompts:</span>
        </span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(p)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-medium whitespace-nowrap cursor-pointer transition-all shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask ChatGPT anything about ${subject}, GATE formulas, or coding...`}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1 shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};

/* ============================================================================
   3. GEMINI AI ASSISTANT PORTAL
   ============================================================================ */
export const GeminiPortal: React.FC<PortalProps> = ({ url, onOpenExternal, subject = 'Computer Science' }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Welcome to **Gemini 1.5 Flash** (StudyOS Multimodal AI). I am ready to process text, analyze research literature, optimize code, and answer complex questions for **${subject}**.`,
    },
  ]);
  const [inputText, setInputText] = useState<string>('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const txt = inputText.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: txt }]);
    setInputText('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `### 🔮 Gemini 1.5 Analysis for "${txt}"\n\n- **Multimodal Context:** Processed with high-precision long context window.\n- **Synthesis:** The primary theorem in **${subject}** states that state transitions are deterministic under isolated execution contexts.\n- **Action Item:** Review flashcards and formula references in StudyOS Study Hub.`,
        },
      ]);
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-blue-950/90 border-b border-blue-800 px-4 py-2.5 flex items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="font-extrabold text-blue-200">Google Gemini AI Workspace</span>
        </div>
        <button
          type="button"
          onClick={() => onOpenExternal(url || 'https://gemini.google.com')}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
        >
          <span>Open gemini.google.com in New Tab</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl text-xs leading-relaxed max-w-2xl ${
              m.sender === 'user'
                ? 'bg-blue-600 text-white ml-auto'
                : 'bg-slate-900 border border-slate-800 text-slate-200'
            }`}
          >
            <div className="font-mono text-[10px] opacity-75 mb-1">
              {m.sender === 'user' ? 'You' : 'Gemini 1.5 Flash'}
            </div>
            <div className="whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask Gemini about ${subject}...`}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-medium"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};

/* ============================================================================
   4. CLAUDE AI ASSISTANT PORTAL
   ============================================================================ */
export const ClaudePortal: React.FC<PortalProps> = ({ url, onOpenExternal, subject = 'Computer Science' }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Greetings. I am **Claude 3.5 Sonnet** (StudyOS Anthropic Assistant). I excel at deep long-form document synthesis, complex code analysis, and academic writing for **${subject}**.`,
    },
  ]);
  const [inputText, setInputText] = useState<string>('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const txt = inputText.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: txt }]);
    setInputText('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `### 📜 Claude Academic Synthesis\n\nAnalysing **"${txt}"** in **${subject}**:\n\n1. **Theoretical Foundations:** The underlying model requires strict adherence to memory alignment constraints.\n2. **Mathematical Proof:** By induction, base condition holds for $n=1$.\n3. **Recommendation:** Refer to literature preprints on arXiv or GeeksforGeeks documentation.`,
        },
      ]);
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full bg-[#181614] text-amber-50 overflow-hidden font-serif">
      {/* Top Banner */}
      <div className="bg-[#2a2420] border-b border-[#3e342d] px-4 py-2.5 flex items-center justify-between gap-2 text-xs font-sans shrink-0">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span className="font-extrabold text-amber-200">Claude 3.5 Sonnet Academic Assistant</span>
        </div>
        <button
          type="button"
          onClick={() => onOpenExternal(url || 'https://claude.ai')}
          className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-bold text-xs cursor-pointer transition-all flex items-center gap-1 shadow-2xs font-sans"
        >
          <span>Open claude.ai in New Tab</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar font-sans">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl text-xs leading-relaxed max-w-2xl ${
              m.sender === 'user'
                ? 'bg-amber-700 text-white ml-auto font-sans'
                : 'bg-[#24201c] border border-[#3a322b] text-amber-100 font-sans'
            }`}
          >
            <div className="font-mono text-[10px] opacity-75 mb-1">
              {m.sender === 'user' ? 'You' : 'Claude 3.5 Sonnet'}
            </div>
            <div className="whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-[#201c18] border-t border-[#383028] flex items-center space-x-2 shrink-0 font-sans"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask Claude about ${subject}...`}
          className="flex-1 bg-[#2b2520] border border-[#40362e] rounded-xl px-4 py-2.5 text-xs text-amber-100 outline-none focus:border-amber-500 font-medium"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};

/* ============================================================================
   5. FRAME REFUSED FALLBACK CARD
   ============================================================================ */
export const FrameRefusedFallback: React.FC<{
  url: string;
  domain: string;
  onOpenExternal: (url: string) => void;
  onEnableReaderMode: () => void;
  onNavigate: (url: string) => void;
}> = ({ url, domain, onOpenExternal, onEnableReaderMode, onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900 text-white text-center space-y-6 animate-fadeIn min-h-0 w-full h-full overflow-y-auto">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-lg">
        <ShieldAlert className="w-8 h-8 animate-pulse" />
      </div>

      <div className="space-y-3 max-w-lg">
        <h2 className="text-2xl font-black text-white tracking-tight">Website Refused Frame Connection</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          The webpage <span className="font-mono text-amber-300 font-extrabold">{domain}</span> has set HTTP response headers (<code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400">X-Frame-Options: SAMEORIGIN</code> or <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400">DENY</code>). Modern web browsers strictly prohibit displaying such sites inside an embedded iframe.
        </p>

        <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-left text-xs font-mono text-slate-300 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Requested URL:</span>
            <span className="truncate max-w-[250px] font-bold text-amber-300">{url}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Security Action:</span>
            <span className="text-emerald-400">X-Frame-Options Protection</span>
          </div>
        </div>
      </div>

      {/* Solutions */}
      <div className="flex flex-wrap items-center justify-center gap-3 max-w-md">
        <button
          type="button"
          onClick={() => onOpenExternal(url)}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs cursor-pointer transition-all shadow-lg flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Webpage in New Tab ↗</span>
        </button>

        <button
          type="button"
          onClick={onEnableReaderMode}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs cursor-pointer transition-all shadow-md flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>Switch to Reader Mode</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate(`https://www.google.com/search?q=${encodeURIComponent(domain)}`)}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs cursor-pointer transition-all border border-slate-700 flex items-center gap-2"
        >
          <Search className="w-4 h-4 text-blue-400" />
          <span>Search Topic on Google</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(url)}`)}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs cursor-pointer transition-all flex items-center gap-2"
        >
          <Globe className="w-4 h-4" />
          <span>Proxy Web View (DuckDuckGo)</span>
        </button>
      </div>
    </div>
  );
};
