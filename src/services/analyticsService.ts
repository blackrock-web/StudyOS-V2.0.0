/**
 * AnalyticsService — fresh production Analytics engine (v2)
 * Single source of truth. Starts at zero. Collects only real user activity.
 * No seed data. No placeholder insights.
 */

import { db } from './db';
import { syncService } from './syncService';
import { TaskItem, TaskHistoryRecord, FocusSessionRecord } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'study_session'
  | 'lecture_started'
  | 'lecture_completed'
  | 'focus_started'
  | 'focus_ended'
  | 'break_started'
  | 'break_ended'
  | 'task_created'
  | 'task_started'
  | 'task_paused'
  | 'task_resumed'
  | 'task_completed'
  | 'task_missed'
  | 'note_created'
  | 'revision_session'
  | 'timetable_synced'
  | 'day_rollover'
  | 'week_rollover'
  | 'custom';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string;
  date: string;
  examId?: string;
  subject?: string;
  topic?: string;
  course?: string;
  durationMinutes?: number;
  breakMinutes?: number;
  details?: Record<string, unknown>;
}

export interface DayRecord {
  date: string;
  studyMinutes: number;
  focusMinutes: number;
  breakMinutes: number;
  tasksCompleted: number;
  tasksMissed: number;
  lecturesCompleted: number;
  notesCreated: number;
  revisionMinutes: number;
  productivityScore: number;
  events: string[];
}

export interface WeeklyArchive {
  id: string;
  weekStart: string;
  weekEnd: string;
  totalStudyMinutes: number;
  totalFocusMinutes: number;
  totalBreakMinutes: number;
  tasksCompleted: number;
  lecturesCompleted: number;
  productivityScore: number;
  subjectProgress: Record<string, number>;
  dailySummaries: DayRecord[];
  archivedAt: string;
}

export type StoragePolicy = 'keep_all' | 'archive_yearly';

export interface AnalyticsStore {
  version: 2;
  initializedAt: string;
  events: AnalyticsEvent[];
  focusSessions?: FocusSessionRecord[];
  days: Record<string, DayRecord>;
  weeklyArchives: WeeklyArchive[];
  streakCurrent: number;
  streakLastActiveDate: string;
  storagePolicy: StoragePolicy;
  lastWeekRollover: string;
  lastDayRollover: string;
}

export interface AnalyticsSnapshot {
  studyHours: number;
  focusHours: number;
  breakHours: number;
  completedTasks: number;
  completedLectures: number;
  productivityScore: number;
  studyStreak: number;
  learningProgress: number;
  todayStudyMinutes: number;
  todayFocusMinutes: number;
  todayBreakMinutes: number;
  todayTasksCompleted: number;
  todayLecturesCompleted: number;
  weekStudyMinutes: number;
  weekFocusMinutes: number;
  weekTasksCompleted: number;
  weekLecturesCompleted: number;
  weekProductivity: number;
}

type Listener = () => void;

const STORAGE_KEY = 'studyos_analytics_v2';

function todayStr(): string {
  return new Date().toISOString().split('T')[0] || '';
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyDay(date: string): DayRecord {
  return {
    date,
    studyMinutes: 0,
    focusMinutes: 0,
    breakMinutes: 0,
    tasksCompleted: 0,
    tasksMissed: 0,
    lecturesCompleted: 0,
    notesCreated: 0,
    revisionMinutes: 0,
    productivityScore: 0,
    events: [],
  };
}

function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0] || dateStr;
}

function sundayOf(monday: string): string {
  const d = new Date(monday + 'T12:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0] || monday;
}

function emptyStore(): AnalyticsStore {
  const t = todayStr();
  return {
    version: 2,
    initializedAt: new Date().toISOString(),
    events: [],
    focusSessions: [],
    days: { [t]: emptyDay(t) },
    weeklyArchives: [],
    streakCurrent: 0,
    streakLastActiveDate: '',
    storagePolicy: 'keep_all',
    lastWeekRollover: mondayOf(t),
    lastDayRollover: t,
  };
}

class AnalyticsService {
  private store: AnalyticsStore;
  private listeners = new Set<Listener>();
  private wired = false;

  constructor() {
    this.store = this.load();
    if (typeof window !== 'undefined') {
      setTimeout(() => this.wireSync(), 0);
    }
  }

  private load(): AnalyticsStore {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyStore();
      const parsed = JSON.parse(raw) as AnalyticsStore;
      if (!parsed || parsed.version !== 2) return emptyStore();
      return parsed;
    } catch {
      return emptyStore();
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
    } catch (e) {
      console.warn('[AnalyticsService] persist failed', e);
    }
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public resetAll(): void {
    this.store = emptyStore();
    this.persist();
    this.notify();
  }

  public getStore(): AnalyticsStore {
    return this.store;
  }

  public setStoragePolicy(policy: StoragePolicy): void {
    this.store.storagePolicy = policy;
    this.persist();
    this.notify();
  }

  public deleteDay(date: string): void {
    delete this.store.days[date];
    this.store.events = this.store.events.filter((e) => e.date !== date);
    this.persist();
    this.notify();
  }

  public deleteWeeklyArchive(id: string): void {
    this.store.weeklyArchives = this.store.weeklyArchives.filter((w) => w.id !== id);
    this.persist();
    this.notify();
  }

  public logEvent(partial: {
    type: AnalyticsEventType;
    examId?: string;
    subject?: string;
    topic?: string;
    course?: string;
    durationMinutes?: number;
    breakMinutes?: number;
    details?: Record<string, unknown>;
    timestamp?: string;
  }): AnalyticsEvent {
    const ts = partial.timestamp || new Date().toISOString();
    const date = ts.split('T')[0] || todayStr();
    const event: AnalyticsEvent = {
      id: uid('evt'),
      type: partial.type,
      timestamp: ts,
      date,
      examId: partial.examId || db.getActiveExamId(),
      subject: partial.subject,
      topic: partial.topic,
      course: partial.course,
      durationMinutes: partial.durationMinutes,
      breakMinutes: partial.breakMinutes,
      details: partial.details,
    };

    this.store.events.push(event);
    if (this.store.events.length > 5000) {
      this.store.events = this.store.events.slice(-5000);
    }

    this.applyEventToDay(event);
    this.updateStreak(date, event.type);
    this.persist();
    this.notify();
    return event;
  }

  private applyEventToDay(event: AnalyticsEvent): void {
    if (!this.store.days[event.date]) {
      this.store.days[event.date] = emptyDay(event.date);
    }
    const day = this.store.days[event.date]!;
    day.events.push(event.id);

    const mins = event.durationMinutes || 0;
    const brk = event.breakMinutes || 0;

    switch (event.type) {
      case 'study_session':
      case 'focus_ended':
      case 'revision_session':
        day.studyMinutes += mins;
        day.focusMinutes += mins;
        day.breakMinutes += brk;
        if (event.type === 'revision_session') day.revisionMinutes += mins;
        break;
      case 'break_started':
      case 'break_ended':
        day.breakMinutes += mins || brk;
        break;
      case 'lecture_completed':
        day.lecturesCompleted += 1;
        day.studyMinutes += mins;
        day.focusMinutes += mins;
        break;
      case 'task_completed':
        day.tasksCompleted += 1;
        day.studyMinutes += mins;
        day.focusMinutes += mins;
        break;
      case 'task_missed':
        day.tasksMissed += 1;
        break;
      case 'note_created':
        day.notesCreated += 1;
        break;
      default:
        if (mins > 0) {
          day.studyMinutes += mins;
          day.focusMinutes += mins;
        }
        break;
    }

    day.productivityScore = this.computeDayProductivity(day);
  }

  private computeDayProductivity(day: DayRecord): number {
    const focus = day.focusMinutes;
    const total = focus + day.breakMinutes;
    if (total <= 0 && day.tasksCompleted === 0 && day.lecturesCompleted === 0) return 0;
    const focusRatio = total > 0 ? focus / total : 0;
    const taskBoost = Math.min(30, day.tasksCompleted * 8);
    const lectureBoost = Math.min(20, day.lecturesCompleted * 5);
    return Math.min(100, Math.round(focusRatio * 50 + taskBoost + lectureBoost));
  }

  private updateStreak(date: string, type: AnalyticsEventType): void {
    const activeTypes: AnalyticsEventType[] = [
      'study_session',
      'focus_ended',
      'lecture_completed',
      'task_completed',
      'revision_session',
    ];
    if (!activeTypes.includes(type)) return;

    const last = this.store.streakLastActiveDate;
    if (!last) {
      this.store.streakCurrent = 1;
      this.store.streakLastActiveDate = date;
      return;
    }
    if (last === date) return;

    const lastD = new Date(last + 'T12:00:00');
    const curD = new Date(date + 'T12:00:00');
    const diffDays = Math.round((curD.getTime() - lastD.getTime()) / 86400000);

    if (diffDays === 1) {
      this.store.streakCurrent += 1;
    } else if (diffDays > 1) {
      this.store.streakCurrent = 1;
    }
    this.store.streakLastActiveDate = date;
  }

  public getSnapshot(): AnalyticsSnapshot {
    const t = todayStr();
    const day = this.store.days[t] || emptyDay(t);
    const weekStart = mondayOf(t);
    let weekStudy = 0;
    let weekFocus = 0;
    let weekTasks = 0;
    let weekLectures = 0;
    let weekProdSum = 0;
    let weekDays = 0;

    Object.values(this.store.days).forEach((d) => {
      if (d.date >= weekStart && d.date <= t) {
        weekStudy += d.studyMinutes;
        weekFocus += d.focusMinutes;
        weekTasks += d.tasksCompleted;
        weekLectures += d.lecturesCompleted;
        weekProdSum += d.productivityScore;
        weekDays += 1;
      }
    });

    let totalStudy = 0;
    let totalFocus = 0;
    let totalBreak = 0;
    let totalTasks = 0;
    let totalLectures = 0;
    Object.values(this.store.days).forEach((d) => {
      totalStudy += d.studyMinutes;
      totalFocus += d.focusMinutes;
      totalBreak += d.breakMinutes;
      totalTasks += d.tasksCompleted;
      totalLectures += d.lecturesCompleted;
    });

    const weekProd = weekDays > 0 ? Math.round(weekProdSum / weekDays) : 0;
    const learningProgress =
      weekStudy + weekTasks + weekLectures === 0
        ? 0
        : Math.min(100, Math.round(weekStudy / 10 + weekTasks * 5 + weekLectures * 3));

    return {
      studyHours: Math.round((totalStudy / 60) * 10) / 10,
      focusHours: Math.round((totalFocus / 60) * 10) / 10,
      breakHours: Math.round((totalBreak / 60) * 10) / 10,
      completedTasks: totalTasks,
      completedLectures: totalLectures,
      productivityScore: day.productivityScore || weekProd,
      studyStreak: this.store.streakCurrent,
      learningProgress,
      todayStudyMinutes: day.studyMinutes,
      todayFocusMinutes: day.focusMinutes,
      todayBreakMinutes: day.breakMinutes,
      todayTasksCompleted: day.tasksCompleted,
      todayLecturesCompleted: day.lecturesCompleted,
      weekStudyMinutes: weekStudy,
      weekFocusMinutes: weekFocus,
      weekTasksCompleted: weekTasks,
      weekLecturesCompleted: weekLectures,
      weekProductivity: weekProd,
    };
  }

  public getRecentEvents(limit = 50): AnalyticsEvent[] {
    return [...this.store.events].reverse().slice(0, limit);
  }

  public getDayRecords(limit = 30): DayRecord[] {
    return Object.values(this.store.days)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }

  public getWeeklyArchives(): WeeklyArchive[] {
    return [...this.store.weeklyArchives].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  }

  public getSubjectMinutes(daysBack = 30, examId?: string): { subject: string; minutes: number }[] {
    const targetExamId = examId || db.getActiveExamId();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);
    const cutoffStr = cutoff.toISOString().split('T')[0] || '';
    const map: Record<string, number> = {};
    this.store.events.forEach((e) => {
      if (e.date < cutoffStr) return;
      if (e.examId && e.examId !== targetExamId) return;
      if (!e.subject || !e.durationMinutes) return;
      map[e.subject] = (map[e.subject] || 0) + e.durationMinutes;
    });
    return Object.entries(map)
      .map(([subject, minutes]) => ({ subject, minutes }))
      .sort((a, b) => b.minutes - a.minutes);
  }

  public getTaskHistoryFromDb(): TaskHistoryRecord[] {
    try {
      return db.getTaskHistory().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    } catch {
      return [];
    }
  }

  public logFocusSession(session: FocusSessionRecord): void {
    if (!this.store.focusSessions) {
      this.store.focusSessions = [];
    }
    const scopedSession = {
      ...session,
      examId: session.examId || db.getActiveExamId(),
    };
    this.store.focusSessions.unshift(scopedSession);
    if (this.store.focusSessions.length > 2000) {
      this.store.focusSessions = this.store.focusSessions.slice(0, 2000);
    }
    this.persist();
    this.notify();
  }

  public getFocusSessions(filter?: {
    examId?: string;
    subject?: string;
    date?: string;
    limit?: number;
  }): FocusSessionRecord[] {
    let list = this.store.focusSessions || [];
    const targetExamId = filter?.examId || db.getActiveExamId();
    if (targetExamId) {
      list = list.filter((s) => !s.examId || s.examId === targetExamId);
    }
    if (filter?.subject && filter.subject !== 'ALL') {
      list = list.filter((s) => s.subject.toLowerCase() === filter.subject!.toLowerCase());
    }
    if (filter?.date) {
      list = list.filter((s) => s.date === filter.date);
    }
    const limit = filter?.limit || 50;
    return list.slice(0, limit);
  }

  public getStudyMetrics(examId?: string): {
    totalStudyMinutes: number;
    todayStudyMinutes: number;
    weekStudyMinutes: number;
    subjectWise: { subject: string; minutes: number; percentage: number }[];
    completedLectures: number;
    pendingLectures: number;
    averageFocusDuration: number;
    plannedVsActual: { plannedMinutes: number; actualMinutes: number; ratio: number };
    focusConsistency: number;
    dailyStreak: number;
    weeklyStreak: number;
  } {
    const targetExamId = examId || db.getActiveExamId();
    const snap = this.getSnapshot();
    const allSessions = this.getFocusSessions({ examId: targetExamId, limit: 1000 });

    // 1. Lectures from DB strictly scoped to targetExamId
    const lectures = db.getLectures(targetExamId);
    const completedLectures = lectures.filter((l) => l.status === 'Completed').length;
    const pendingLectures = lectures.filter((l) => l.status !== 'Completed').length;

    // 2. Subject Breakdown
    const subjectMap: Record<string, number> = {};
    let totalMins = snap.studyHours * 60;
    if (totalMins === 0 && allSessions.length > 0) {
      totalMins = allSessions.reduce((acc, s) => acc + s.actualDurationMinutes, 0);
    }

    allSessions.forEach((s) => {
      subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.actualDurationMinutes;
    });

    const subjectWise = Object.entries(subjectMap)
      .map(([subject, minutes]) => ({
        subject,
        minutes,
        percentage: totalMins > 0 ? Math.min(100, Math.round((minutes / totalMins) * 100)) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    // 3. Planned vs Actual Focus
    const totalPlanned = allSessions.reduce((acc, s) => acc + (s.plannedDurationMinutes || s.actualDurationMinutes), 0);
    const totalActual = allSessions.reduce((acc, s) => acc + s.actualDurationMinutes, 0);
    const ratio = totalPlanned > 0 ? Math.min(100, Math.round((totalActual / totalPlanned) * 100)) : 100;

    // 4. Average Focus Duration
    const averageFocusDuration =
      allSessions.length > 0
        ? Math.round(allSessions.reduce((acc, s) => acc + s.actualDurationMinutes, 0) / allSessions.length)
        : snap.todayFocusMinutes > 0
        ? snap.todayFocusMinutes
        : 45;

    // 5. Focus Consistency Score
    const recentDays = this.getDayRecords(7);
    const activeDayCount = recentDays.filter((d) => d.focusMinutes > 0 || d.studyMinutes > 0).length;
    const focusConsistency = Math.min(100, Math.round((activeDayCount / 7) * 85 + (ratio > 80 ? 15 : 0)));

    return {
      totalStudyMinutes: Math.round(snap.studyHours * 60),
      todayStudyMinutes: snap.todayStudyMinutes,
      weekStudyMinutes: snap.weekStudyMinutes,
      subjectWise,
      completedLectures,
      pendingLectures,
      averageFocusDuration,
      plannedVsActual: {
        plannedMinutes: totalPlanned,
        actualMinutes: totalActual,
        ratio,
      },
      focusConsistency,
      dailyStreak: snap.studyStreak,
      weeklyStreak: Math.max(1, Math.ceil(snap.studyStreak / 7)),
    };
  }

  public ensureDayRollover(): void {
    const t = todayStr();
    if (this.store.lastDayRollover === t) {
      if (!this.store.days[t]) {
        this.store.days[t] = emptyDay(t);
        this.persist();
      }
      return;
    }

    this.logEvent({
      type: 'day_rollover',
      details: { previous: this.store.lastDayRollover, today: t },
    });
    this.store.lastDayRollover = t;
    if (!this.store.days[t]) this.store.days[t] = emptyDay(t);
    this.ensureWeekRollover();
    this.persist();
    this.notify();
  }

  public ensureWeekRollover(): void {
    const t = todayStr();
    const thisMonday = mondayOf(t);
    if (this.store.lastWeekRollover === thisMonday) return;

    const prevMonday = this.store.lastWeekRollover;
    const prevSunday = sundayOf(prevMonday);
    const dailySummaries = Object.values(this.store.days)
      .filter((d) => d.date >= prevMonday && d.date <= prevSunday)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (dailySummaries.length > 0) {
      const subjectProgress: Record<string, number> = {};
      this.store.events
        .filter((e) => e.date >= prevMonday && e.date <= prevSunday && e.subject && e.durationMinutes)
        .forEach((e) => {
          subjectProgress[e.subject!] = (subjectProgress[e.subject!] || 0) + (e.durationMinutes || 0);
        });

      const archive: WeeklyArchive = {
        id: uid('week'),
        weekStart: prevMonday,
        weekEnd: prevSunday,
        totalStudyMinutes: dailySummaries.reduce((s, d) => s + d.studyMinutes, 0),
        totalFocusMinutes: dailySummaries.reduce((s, d) => s + d.focusMinutes, 0),
        totalBreakMinutes: dailySummaries.reduce((s, d) => s + d.breakMinutes, 0),
        tasksCompleted: dailySummaries.reduce((s, d) => s + d.tasksCompleted, 0),
        lecturesCompleted: dailySummaries.reduce((s, d) => s + d.lecturesCompleted, 0),
        productivityScore:
          dailySummaries.length > 0
            ? Math.round(
                dailySummaries.reduce((s, d) => s + d.productivityScore, 0) / dailySummaries.length
              )
            : 0,
        subjectProgress,
        dailySummaries,
        archivedAt: new Date().toISOString(),
      };
      this.store.weeklyArchives.unshift(archive);
      this.logEvent({
        type: 'week_rollover',
        details: { weekStart: prevMonday, weekEnd: prevSunday },
      });
    }

    this.store.lastWeekRollover = thisMonday;

    if (this.store.storagePolicy === 'archive_yearly') {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      const cutoff = yearAgo.toISOString().split('T')[0] || '';
      Object.keys(this.store.days).forEach((d) => {
        if (d < cutoff) delete this.store.days[d];
      });
      this.store.events = this.store.events.filter((e) => e.date >= cutoff);
    }

    this.persist();
    this.notify();
  }

  private wireSync(): void {
    if (this.wired) return;
    this.wired = true;
    this.ensureDayRollover();

    try {
      syncService.subscribe('*', (payload) => {
        this.handleSyncPayload(payload as { type?: string; task?: TaskItem; taskId?: string; minutes?: number });
      });
    } catch (e) {
      console.warn('[AnalyticsService] sync wire failed', e);
    }

    if (typeof window !== 'undefined') {
      setInterval(() => this.ensureDayRollover(), 30000);
      window.addEventListener('focus', () => this.ensureDayRollover());
    }
  }

  private handleSyncPayload(payload: {
    type?: string;
    task?: TaskItem;
    taskId?: string;
    minutes?: number;
  }): void {
    const type = payload.type;
    if (!type) return;
    const task = payload.task;

    switch (type) {
      case 'task_started':
        this.logEvent({
          type: 'task_started',
          subject: task?.subject,
          topic: task?.title,
          details: { taskId: task?.id || payload.taskId },
        });
        this.logEvent({ type: 'focus_started', subject: task?.subject, topic: task?.title });
        break;
      case 'task_paused':
        this.logEvent({
          type: 'task_paused',
          subject: task?.subject,
          topic: task?.title,
          durationMinutes: typeof payload.minutes === 'number' ? payload.minutes : undefined,
          details: { taskId: task?.id || payload.taskId },
        });
        this.logEvent({
          type: 'break_started',
          subject: task?.subject,
          durationMinutes: typeof payload.minutes === 'number' ? payload.minutes : undefined,
        });
        break;
      case 'task_completed':
        this.logEvent({
          type: 'task_completed',
          subject: task?.subject,
          topic: task?.title,
          durationMinutes: task?.actualDurationMinutes || task?.estimatedMinutes,
          details: { taskId: task?.id || payload.taskId },
        });
        break;
      case 'analytics_refresh':
        this.notify();
        break;
      default:
        break;
    }
  }

  public trackLectureStarted(subject: string, topic?: string, course?: string): void {
    this.logEvent({ type: 'lecture_started', subject, topic, course });
  }

  public trackLectureCompleted(
    subject: string,
    topic?: string,
    durationMinutes?: number,
    course?: string
  ): void {
    this.logEvent({ type: 'lecture_completed', subject, topic, course, durationMinutes });
  }

  public trackFocusSession(
    subject: string,
    focusMinutes: number,
    breakMinutes = 0,
    topic?: string
  ): void {
    this.logEvent({
      type: 'study_session',
      subject,
      topic,
      durationMinutes: focusMinutes,
      breakMinutes,
    });
  }

  public trackNoteCreated(subject?: string): void {
    this.logEvent({ type: 'note_created', subject });
  }

  public trackRevision(subject: string, minutes: number, topic?: string): void {
    this.logEvent({ type: 'revision_session', subject, topic, durationMinutes: minutes });
  }

  public trackTaskFromItem(task: TaskItem, eventType: AnalyticsEventType): void {
    this.logEvent({
      type: eventType,
      subject: task.subject,
      topic: task.title,
      durationMinutes: task.actualDurationMinutes || task.estimatedMinutes,
      details: {
        taskId: task.id,
        status: task.status,
        dueDate: task.dueDate,
        startTime: task.startTime,
        endTime: task.endTime,
      },
    });
  }
}

export const analyticsService = new AnalyticsService();
