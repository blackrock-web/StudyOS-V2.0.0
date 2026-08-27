import React, { useEffect } from "react";
import {
  Highlighter,
  FileText,
  Brain,
  Calculator,
  Camera,
  Star,
  Copy,
  CheckSquare,
  Tag,
  CalendarRange,
  X,
  Sparkles
} from "lucide-react";
import { getActiveProvider } from "../../services/aiProvider";

interface FloatingSelectionToolbarProps {
  x: number;
  y: number;
  selectedText: string;
  hasRect: boolean;
  onApplyMarkup: (type: "highlight" | "underline" | "strikethrough") => void;
  onCreateNote: () => void;
  onCreateFlashcard: () => void;
  onCreateFormula: () => void;
  onCaptureRegion: () => void;
  onToggleBookmark: () => void;
  onCopyText: () => void;
  onCreateTask: () => void;
  onAddTag: () => void;
  onAddToRevision: () => void;
  onCollectSelection: () => void;
  onClose: () => void;
}

export const FloatingSelectionToolbar: React.FC<FloatingSelectionToolbarProps> = ({
  x,
  y,
  selectedText,
  hasRect,
  onApplyMarkup,
  onCreateNote,
  onCreateFlashcard,
  onCreateFormula,
  onCaptureRegion,
  onToggleBookmark,
  onCopyText,
  onCreateTask,
  onAddTag,
  onAddToRevision,
  onCollectSelection,
  onClose,
}) => {
  // Setup Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        top: `${y}px`,
        left: `${x}px`,
        transform: "translate(-50%, -100%) translateY(-16px)",
      }}
      className="floating-selection-toolbar absolute z-[999] flex items-center bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-2xl border border-slate-700/60 shadow-2xl select-none text-white animate-fadeIn"
    >
      <div className="flex items-center gap-0.5 border-r border-slate-700/60 pr-1.5 mr-1.5">
        <button
          onClick={() => onApplyMarkup("highlight")}
          title="Highlight Text"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
        >
          <Highlighter className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onCopyText}
          title="Copy to Clipboard"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 border-r border-slate-700/60 pr-1.5 mr-1.5">
        <button
          onClick={onCreateNote}
          title="Create Study Note"
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-bold text-blue-400 hover:text-blue-300 transition-all cursor-pointer whitespace-nowrap"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Note</span>
        </button>

        <button
          onClick={async () => {
            const provider = getActiveProvider();
            await provider.generateFlashcards(selectedText || 'Sample selection');
          }}
          title="AI Generate Flashcards / Notes from Selection"
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-purple-950 rounded-lg text-xs font-bold text-purple-300 hover:text-purple-200 transition-all cursor-pointer whitespace-nowrap bg-purple-900/50 border border-purple-700/50"
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>AI Generate</span>
        </button>

        <button
          onClick={onCreateFlashcard}
          title="Create Active Recall Flashcard"
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-bold text-pink-400 hover:text-pink-300 transition-all cursor-pointer whitespace-nowrap"
        >
          <Brain className="h-3.5 w-3.5" />
          <span>Recall</span>
        </button>

        <button
          onClick={onCreateFormula}
          title="Create Formula Book entry"
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer whitespace-nowrap"
        >
          <Calculator className="h-3.5 w-3.5" />
          <span>Formula</span>
        </button>

        <button
          onClick={onCaptureRegion}
          title="Capture region screenshot"
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-bold text-sky-400 hover:text-sky-300 transition-all cursor-pointer whitespace-nowrap"
        >
          <Camera className="h-3.5 w-3.5" />
          <span>Capture</span>
        </button>

        <button
          onClick={onCollectSelection}
          title="Collect selection for multi-selection bundle"
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-all cursor-pointer whitespace-nowrap"
        >
          <span>📥 Collect</span>
        </button>
      </div>

      <div className="flex items-center gap-1 mr-1">
        <button
          onClick={onToggleBookmark}
          title="Bookmark Page"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-amber-500 hover:text-amber-400 transition-all cursor-pointer"
        >
          <Star className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onCreateTask}
          title="Create Linked Study Task"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-purple-400 hover:text-purple-300 transition-all cursor-pointer"
        >
          <CheckSquare className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onAddTag}
          title="Add Custom Tag"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
        >
          <Tag className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onAddToRevision}
          title="Add to Revision Planner"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
        >
          <CalendarRange className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        onClick={onClose}
        title="Dismiss popup"
        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all ml-1 cursor-pointer border-l border-slate-700/60 pl-1.5"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
