import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Flame,
  Play,
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Award,
  ChevronRight,
  RefreshCw,
  Zap,
  Check,
  ListTodo,
  FileText,
  BrainCircuit,
  Cpu,
  BarChart3,
  CheckSquare,
  Square,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';
import { db } from '../../services/db';
import { FocusModePlan, PWLectureRecord } from '../../types';
import { focusTimerService, FocusTimerEngineState } from '../../services/focusTimerService';
import { AISchedulePlannerModal } from '../planner/AISchedulePlannerModal';
import {
  subjectFocusService,
  SubjectSyllabusChapter,
  SubjectLecturePlan,
  SingleDayFocusPlanResult,
} from '../../services/focus/subjectFocusService';
import { localModelManager } from '../../services/models/LocalModelManager';
import { getAllSubjectOptions } from '../../data/subjectRegistry';

export const SingleSubjectFocusView: React.FC = () => {
  const [activeExam, setActiveExam] = useState(() => db.getActiveExam());
  const [focusPlan, setFocusPlan] = useState<FocusModePlan>(() => db.getFocusModePlan());
  const [examSubjects, setExamSubjects] = useState<string[]>(() => {
    const subs = db.getCurrentExamSubjects();
    return subs.length > 0 ? subs : getAllSubjectOptions();
  });

  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    const plan = db.getFocusModePlan();
    const subs = db.getCurrentExamSubjects();
    return plan.subjectName || subs[0] || 'Operating Systems';
  });

  const [continuousMode, setContinuousMode] = useState(true);
  const [timerState, setTimerState] = useState<FocusTimerEngineState>(() => focusTimerService.getState());

  // Dynamic Syllabus & Lecture Planner State
  const [syllabusData, setSyllabusData] = useState<{
    chapters: SubjectSyllabusChapter[];
    totalTopics: number;
    completedTopics: number;
    averageConfidence: number;
    completionPercentage: number;
  } | null>(null);

  const [lecturePlan, setLecturePlan] = useState<SubjectLecturePlan | null>(null);
  const [focusPlanResult, setFocusPlanResult] = useState<SingleDayFocusPlanResult | null>(null);
  const [isGeneratingFocus, setIsGeneratingFocus] = useState(false);
  const [activityChecks, setActivityChecks] = useState<Record<string, boolean>>({});

  // Modals & Notifications
  const [isAISchedulerOpen, setIsAISchedulerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Local Model Tracker
  const [activeModel, setActiveModel] = useState(() => localModelManager.getActiveModel());

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Main load function for currently selected subject
  const loadSubjectData = async (subject: string) => {
    if (!subject) return;

    const examId = db.getActiveExamId();
    const sData = subjectFocusService.getSyllabusForSubject(subject, examId);
    const lData = subjectFocusService.getLecturePlannerForSubject(subject, examId);

    setSyllabusData(sData);
    setLecturePlan(lData);

    setIsGeneratingFocus(true);
    try {
      const plan = await subjectFocusService.generateSingleDayFocus(subject, examId);
      setFocusPlanResult(plan);

      // Initialize activity checks
      const checks: Record<string, boolean> = {};
      plan.actionableActivities.forEach((a) => {
        checks[a.id] = false;
      });
      setActivityChecks(checks);
    } catch (e) {
      console.error('Error generating subject focus plan:', e);
    } finally {
      setIsGeneratingFocus(false);
    }
  };

  useEffect(() => {
    const exam = db.getActiveExam();
    setActiveExam(exam);
    const subs = db.getCurrentExamSubjects();
    if (subs.length > 0) setExamSubjects(subs);

    loadSubjectData(selectedSubject);

    const handleModelChange = () => {
      setActiveModel(localModelManager.getActiveModel());
    };

    const handleDbUpdate = () => {
      loadSubjectData(selectedSubject);
    };

    window.addEventListener('studyos_model_changed', handleModelChange);
    window.addEventListener('studyos_focus_mode_updated', handleDbUpdate);
    window.addEventListener('studyos_exams_updated', handleDbUpdate);
    window.addEventListener('studyos_syllabus_updated', handleDbUpdate);
    window.addEventListener('studyos_tasks_updated', handleDbUpdate);
    window.addEventListener('studyos_db_updated', handleDbUpdate);

    const unsubTimer = focusTimerService.subscribe((s) => setTimerState(s));

    return () => {
      window.removeEventListener('studyos_model_changed', handleModelChange);
      window.removeEventListener('studyos_focus_mode_updated', handleDbUpdate);
      window.removeEventListener('studyos_exams_updated', handleDbUpdate);
      window.removeEventListener('studyos_syllabus_updated', handleDbUpdate);
      window.removeEventListener('studyos_tasks_updated', handleDbUpdate);
      window.removeEventListener('studyos_db_updated', handleDbUpdate);
      unsubTimer();
    };
  }, [selectedSubject]);

  const handleSelectSubject = (subj: string) => {
    setSelectedSubject(subj);
    db.saveFocusModePlan({ subjectName: subj });
    loadSubjectData(subj);
  };

  const handleToggleActivity = (actId: string) => {
    setActivityChecks((prev) => ({
      ...prev,
      [actId]: !prev[actId],
    }));
  };

  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const handleApplyFocusPlanToPlanner = () => {
    if (!focusPlanResult) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const examId = db.getActiveExamId();
    const { addedCount, updatedCount } = subjectFocusService.applyFocusPlanToTasks(focusPlanResult, todayStr, examId);
    setAppliedSuccess(true);
    showNotification(`✓ Applied ${addedCount + updatedCount} focus tasks for ${selectedSubject} to your daily planner!`);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  const handleStartFocusTimer = () => {
    if (!focusPlanResult) return;

    if (focusPlanResult.linkedLecture) {
      focusTimerService.startLectureFocus(focusPlanResult.linkedLecture, { continuousMode });
      showNotification(`Started focus session for ${focusPlanResult.linkedLecture.title || focusPlanResult.primaryTopic}`);
    } else {
      // Start precision topic focus session
      const todayStr = new Date().toISOString().split('T')[0];
      const mockLec: PWLectureRecord = {
        id: `topic-focus-${Date.now()}`,
        subject: selectedSubject,
        chapter: focusPlanResult.chapter,
        title: focusPlanResult.primaryTopic,
        lectureNumber: 1,
        originalDate: todayStr,
        reanchoredDate: todayStr,
        dpp: '',
        weeklyTest: '',
        status: 'Pending',
        watchSpeed: 1,
        durationMinutes: focusPlanResult.targetDurationMinutes || 45,
        timeSpentMinutes: 0,
        dppCompleted: false,
        notes: '',
        bookmarkTimestamp: '',
        revisionCount: 0,
        confidence: 3,
        mistakesLogged: '',
      };
      focusTimerService.startLectureFocus(mockLec, { continuousMode });
      showNotification(`Started ${focusPlanResult.targetDurationMinutes}m study session on ${focusPlanResult.primaryTopic}!`);
    }
  };

  const isFocusRunning =
    timerState.status === 'running' &&
    timerState.activeLecture?.subject.toLowerCase() === selectedSubject.toLowerCase();

  return (
    <div id="single-subject-focus-view" className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn text-slate-900">
      {/* Floating Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-indigo-200 text-slate-900 shadow-2xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2.5">
            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              {activeExam?.title || 'Active Exam'} • Single-Subject Focus Engine
            </span>
            <span className="text-xs text-indigo-600 font-bold flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" /> 100% Offline Local AI
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            Subject-Based Focus Planning
          </h1>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Select any subject to dynamically fetch its syllabus, active lecture planner queue, and generate a precision single-day focus plan powered by your offline local LLM.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 w-full md:w-auto">
          <button
            type="button"
            onClick={() => loadSubjectData(selectedSubject)}
            disabled={isGeneratingFocus}
            className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isGeneratingFocus ? 'animate-spin' : ''}`} />
            <span>{isGeneratingFocus ? 'Synthesizing...' : 'Regenerate Focus'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAISchedulerOpen(true)}
            className="py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>✨ AI Auto-Planner</span>
          </button>
        </div>
      </div>

      {/* Dynamic Subject Selection Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Select Academic Subject ({examSubjects.length} Available in Syllabus):
          </label>
          <span className="text-xs font-semibold text-indigo-600">
            Active: <strong>{selectedSubject}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-2 pt-1">
          {examSubjects.map((subj) => {
            const isSelected = subj.toLowerCase() === selectedSubject.toLowerCase();
            return (
              <button
                key={subj}
                type="button"
                onClick={() => handleSelectSubject(subj)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center space-x-2 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{subj}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Single Day Focus & Syllabus Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Single Day Focus Hero Card + Activities */}
        <div className="lg:col-span-2 space-y-6">
          {focusPlanResult ? (
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-indigo-100 shadow-sm space-y-6">
              {/* Top Banner with Priority & AI Engine Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                        Today's High-Yield Focus
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700">
                        {focusPlanResult.chapter}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mt-0.5">
                      {focusPlanResult.primaryTopic}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      focusPlanResult.priority === 'Critical'
                        ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    🔥 {focusPlanResult.priority} Priority
                  </span>
                </div>
              </div>

              {/* AI Why Statement */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <BrainCircuit className="w-4 h-4 text-indigo-600" />
                  <span>Why This Topic Today (Syllabus & Planner Analysis):</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {focusPlanResult.reason}
                </p>
              </div>

              {/* Duration & Model Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Duration</span>
                  <span className="text-sm font-black text-indigo-600 mt-1 block font-mono">
                    ⏱️ {focusPlanResult.targetDurationMinutes} Minutes
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Syllabus Coverage</span>
                  <span className="text-sm font-black text-emerald-600 mt-1 block font-mono">
                    📈 {focusPlanResult.overallSubjectProgress}% Completed
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Local AI</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block truncate">
                    🤖 {activeModel?.name || 'SmolLM2 135M'}
                  </span>
                </div>
              </div>

              {/* Actionable Activities Checklist */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-indigo-600" /> Actionable Focus Tasks for Today:
                </h3>

                <div className="space-y-2">
                  {focusPlanResult.actionableActivities.map((act) => {
                    const isChecked = !!activityChecks[act.id];
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => handleToggleActivity(act.id)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/50 border-emerald-200 text-slate-500'
                            : 'bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-800'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0 text-indigo-600">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-semibold block ${isChecked ? 'line-through' : ''}`}>
                            {act.text}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">
                          ~{act.estimatedMins}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Key Revision Concepts & Formulas */}
              {focusPlanResult.keyRevisionConcepts.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60 space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" /> 📚 Core Revision Concepts ({focusPlanResult.chapter}):
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {focusPlanResult.keyRevisionConcepts.map((pt, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span className="font-medium leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Practice Problems */}
              {focusPlanResult.recommendedPractice.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-600" /> 📝 Recommended Target Practice:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {focusPlanResult.recommendedPractice.map((p) => (
                      <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">
                            {p.type}
                          </span>
                          <span className={`text-[9px] font-bold ${p.difficulty === 'Hard' ? 'text-rose-600' : 'text-amber-600'}`}>
                            {p.difficulty}
                          </span>
                        </div>
                        <p className="font-medium text-slate-800 line-clamp-2">{p.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleApplyFocusPlanToPlanner}
                  className={`w-full py-4 rounded-2xl font-black text-sm border shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    appliedSuccess
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900 hover:border-indigo-300'
                  }`}
                >
                  {appliedSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  )}
                  <span>
                    {appliedSuccess
                      ? '✓ Plan Applied to Daily Tasks'
                      : `Apply Plan to Daily Tasks (${focusPlanResult.actionableActivities.length} items)`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleStartFocusTimer}
                  className={`w-full py-4 rounded-2xl font-black text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    isFocusRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>
                    {isFocusRunning
                      ? `Focus Session In Progress for ${selectedSubject}`
                      : `Start Single-Day Focus Session (${focusPlanResult.targetDurationMinutes}m)`}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-bold">
                Fetching syllabus & lecture planner for {selectedSubject}...
              </p>
            </div>
          )}
        </div>

        {/* Right Col: Syllabus Breakdown & Lecture Planner Queue */}
        <div className="space-y-6">
          {/* Syllabus Progress Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                {selectedSubject} Syllabus
              </h3>
              <span className="text-xs font-bold text-indigo-600">
                {syllabusData?.completionPercentage || 0}% Done
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${syllabusData?.completionPercentage || 0}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Topics Done</span>
                <span className="font-black text-slate-800 mt-0.5 block">
                  {syllabusData?.completedTopics || 0} / {syllabusData?.totalTopics || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Confidence</span>
                <span className="font-black text-purple-700 mt-0.5 block">
                  {syllabusData?.averageConfidence || 3.0} / 5.0
                </span>
              </div>
            </div>

            {/* Chapters Accordion list */}
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pt-1">
              {syllabusData?.chapters.map((chap) => (
                <div
                  key={chap.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="truncate">{chap.name}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {chap.completedTopics}/{chap.totalTopics}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{
                        width: `${chap.totalTopics > 0 ? (chap.completedTopics / chap.totalTopics) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lecture Planner Tracker for Selected Subject */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-indigo-500" />
                Lecture Planner ({lecturePlan?.pendingCount || 0} Pending)
              </h3>
              <span className="text-xs font-bold text-emerald-600">
                {lecturePlan?.completedCount || 0} Completed
              </span>
            </div>

            {lecturePlan && lecturePlan.pendingLectures.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {lecturePlan.pendingLectures.slice(0, 6).map((lec, idx) => (
                  <div
                    key={lec.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">
                        {lec.chapter && lec.lectureNumber
                          ? `${lec.chapter} - Lec ${lec.lectureNumber}`
                          : lec.title || `${selectedSubject} Lecture`}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px] shrink-0">
                      {lec.durationMinutes || 60}m
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  All scheduled lectures for {selectedSubject} are completed, or plan via AI Scheduler.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Schedule Planner Modal */}
      <AISchedulePlannerModal
        isOpen={isAISchedulerOpen}
        onClose={() => setIsAISchedulerOpen(false)}
        onApplied={() => {
          loadSubjectData(selectedSubject);
          showNotification('AI schedule applied to database successfully!');
        }}
      />
    </div>
  );
};

export default SingleSubjectFocusView;
