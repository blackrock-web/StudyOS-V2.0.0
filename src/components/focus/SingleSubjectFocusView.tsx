import React, { useState, useEffect } from 'react';
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
  Settings2,
  BookOpen,
  Award,
  ChevronRight,
  RefreshCw,
  Zap,
  Check,
  ListTodo,
} from 'lucide-react';
import { db } from '../../services/db';
import { FocusModePlan, StudyPlanningMode, PWLectureRecord, TaskItem } from '../../types';
import { focusTimerService, FocusTimerEngineState } from '../../services/focusTimerService';
import { AISchedulePlannerModal } from '../planner/AISchedulePlannerModal';

export const SingleSubjectFocusView: React.FC = () => {
  const [activeExam, setActiveExam] = useState(() => db.getActiveExam());
  const [focusPlan, setFocusPlan] = useState<FocusModePlan>(() => db.getFocusModePlan());
  const [examSubjects, setExamSubjects] = useState<string[]>(() => db.getCurrentExamSubjects());
  const [selectedSubject, setSelectedSubject] = useState(focusPlan.subjectName || '');
  const [continuousMode, setContinuousMode] = useState(true);

  // Lectures & Tasks for selected subject
  const [pendingLectures, setPendingLectures] = useState<PWLectureRecord[]>([]);
  const [completedLectures, setCompletedLectures] = useState<PWLectureRecord[]>([]);
  const [timerState, setTimerState] = useState<FocusTimerEngineState>(() => focusTimerService.getState());

  // Modals & Notifications
  const [isAISchedulerOpen, setIsAISchedulerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshData = () => {
    const exam = db.getActiveExam();
    setActiveExam(exam);
    const subs = db.getCurrentExamSubjects();
    setExamSubjects(subs);
    const plan = db.getFocusModePlan();
    setFocusPlan(plan);

    const currentSubj = selectedSubject || plan.subjectName || subs[0] || 'Physics';
    if (!selectedSubject) setSelectedSubject(currentSubj);

    const allLectures = db.getLectures();
    const subLectures = allLectures.filter(
      (l) => l.subject.toLowerCase() === currentSubj.toLowerCase()
    );

    setPendingLectures(subLectures.filter((l) => l.status !== 'Completed'));
    setCompletedLectures(subLectures.filter((l) => l.status === 'Completed'));
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();

    window.addEventListener('studyos_focus_mode_updated', handleUpdate);
    window.addEventListener('studyos_exams_updated', handleUpdate);
    window.addEventListener('studyos_syllabus_updated', handleUpdate);
    window.addEventListener('studyos_tasks_updated', handleUpdate);
    window.addEventListener('studyos_db_updated', handleUpdate);

    const unsubTimer = focusTimerService.subscribe((s) => setTimerState(s));

    return () => {
      window.removeEventListener('studyos_focus_mode_updated', handleUpdate);
      window.removeEventListener('studyos_exams_updated', handleUpdate);
      window.removeEventListener('studyos_syllabus_updated', handleUpdate);
      window.removeEventListener('studyos_tasks_updated', handleUpdate);
      window.removeEventListener('studyos_db_updated', handleUpdate);
      unsubTimer();
    };
  }, [selectedSubject]);

  const handleSelectSubject = (subj: string) => {
    setSelectedSubject(subj);
    db.saveFocusModePlan({ subjectName: subj });
    const allLectures = db.getLectures();
    const subLectures = allLectures.filter(
      (l) => l.subject.toLowerCase() === subj.toLowerCase()
    );
    setPendingLectures(subLectures.filter((l) => l.status !== 'Completed'));
    setCompletedLectures(subLectures.filter((l) => l.status === 'Completed'));
  };

  const handleStartLectureFocus = (lecture: PWLectureRecord) => {
    focusTimerService.startLectureFocus(lecture, { continuousMode });
    setToastMessage(`Focus session started for ${lecture.title || lecture.chapter}!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const nextPendingLecture = pendingLectures[0] || null;
  const isCurrentLectureRunning =
    timerState.status === 'running' &&
    timerState.activeLecture?.id === nextPendingLecture?.id;

  return (
    <div id="single-subject-focus-view" className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn text-slate-900">
      {/* Toast */}
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
              {activeExam?.title || 'Active Exam'} • Single-Subject Focus
            </span>
            <span className="text-xs text-indigo-600 font-bold">
              Continuous Flow Engine
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            Single-Subject Focus Mode
          </h1>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Select a subject to automatically fetch planned lectures, start precision timers, track actual duration, and advance your syllabus seamlessly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 w-full md:w-auto">
          <button
            onClick={() => setIsAISchedulerOpen(true)}
            className="py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>✨ AI Auto-Planner</span>
          </button>
        </div>
      </div>

      {/* Subject Selection Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-2">
        {examSubjects.map((subj) => {
          const isSelected = subj.toLowerCase() === selectedSubject.toLowerCase();
          return (
            <button
              key={subj}
              onClick={() => handleSelectSubject(subj)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center space-x-2 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{subj}</span>
            </button>
          );
        })}
      </div>

      {/* Main Focus Card Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Next Lecture / Start Focus Hero */}
        <div className="lg:col-span-2 space-y-6">
          {nextPendingLecture ? (
            /* ACTIVE / NEXT PENDING LECTURE CARD */
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                      Next Planned Lecture
                    </span>
                    <h2 className="text-xl font-black text-slate-900">
                      {nextPendingLecture.chapter && nextPendingLecture.lectureNumber
                        ? `${nextPendingLecture.chapter} - Lec ${nextPendingLecture.lectureNumber}`
                        : nextPendingLecture.title || `${selectedSubject} Lecture`}
                    </h2>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    nextPendingLecture.priority === 'High'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  {nextPendingLecture.priority || 'High'} Priority
                </span>
              </div>

              {/* Lecture Metadata Pill Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Subject</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">
                    {nextPendingLecture.subject}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Planned Duration</span>
                  <span className="text-xs font-black text-indigo-600 mt-1 block font-mono">
                    {nextPendingLecture.durationMinutes || 60} Minutes
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheduled Date</span>
                  <span className="text-xs font-bold text-slate-700 mt-1 block">
                    {nextPendingLecture.reanchoredDate || nextPendingLecture.originalDate || 'Today'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <span className="text-xs font-bold text-amber-600 mt-1 block">
                    {nextPendingLecture.status === 'Paused' ? 'In Progress' : 'Pending Study'}
                  </span>
                </div>
              </div>

              {/* Continuous Mode Toggle */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Flame className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Continuous Single-Subject Study
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Auto-advances to next pending lecture upon session completion
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={continuousMode}
                  onChange={(e) => {
                    setContinuousMode(e.target.checked);
                    focusTimerService.setContinuousMode(e.target.checked);
                  }}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Start Focus Button */}
              <button
                onClick={() => handleStartLectureFocus(nextPendingLecture)}
                className={`w-full py-4 rounded-2xl font-black text-sm shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  isCurrentLectureRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {isCurrentLectureRunning
                    ? 'Focus Session In Progress (View in Global Bar)'
                    : `Start Focus Session (${nextPendingLecture.durationMinutes || 60}m)`}
                </span>
              </button>
            </div>
          ) : (
            /* NO LECTURE PLANNED STATE */
            <div className="p-8 md:p-12 rounded-3xl bg-white border border-slate-200 shadow-2xs text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-900">
                  No lecture is planned for {selectedSubject} today
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  You have completed all scheduled lectures or haven't scheduled any for {selectedSubject} yet. Use the AI Auto-Planner to instantly generate your lecture schedule.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsAISchedulerOpen(true)}
                  className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center space-x-2 mx-auto transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>✨ Generate Study Plan (AI Scheduler)</span>
                </button>
              </div>
            </div>
          )}

          {/* Pending Lectures Queue */}
          {pendingLectures.length > 1 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-indigo-500" />
                  Upcoming Lectures in {selectedSubject} ({pendingLectures.length - 1} Remaining)
                </h3>
              </div>

              <div className="space-y-2">
                {pendingLectures.slice(1, 6).map((lec, idx) => (
                  <div
                    key={lec.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 2}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">
                        {lec.chapter && lec.lectureNumber
                          ? `${lec.chapter} - Lec ${lec.lectureNumber}`
                          : lec.title || `${selectedSubject} Lecture`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="font-mono text-slate-500">{lec.durationMinutes || 60}m</span>
                      <button
                        onClick={() => handleStartLectureFocus(lec)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold transition-all border border-indigo-200 cursor-pointer"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Subject Progress & Completed Lectures */}
        <div className="space-y-6">
          {/* Completed Lectures Counter */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {selectedSubject} Progress
              </h3>
              <span className="text-xs font-bold text-emerald-600">
                {completedLectures.length} Done
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-800">
                Total Completed Lectures
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {completedLectures.length}{' '}
                <span className="text-xs font-normal text-slate-500">
                  / {completedLectures.length + pendingLectures.length} Total
                </span>
              </p>
            </div>

            {completedLectures.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {completedLectures.map((lec) => (
                  <div
                    key={lec.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2 text-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-slate-600 truncate font-medium">
                      {lec.chapter && lec.lectureNumber
                        ? `${lec.chapter} - Lec ${lec.lectureNumber}`
                        : lec.title || `${selectedSubject} Lecture`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-2 font-medium">
                No lectures completed yet for {selectedSubject}.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI Schedule Planner Modal */}
      <AISchedulePlannerModal
        isOpen={isAISchedulerOpen}
        onClose={() => setIsAISchedulerOpen(false)}
        onApplied={() => {
          refreshData();
          setToastMessage('AI schedule generated & applied successfully!');
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />
    </div>
  );
};

export default SingleSubjectFocusView;
