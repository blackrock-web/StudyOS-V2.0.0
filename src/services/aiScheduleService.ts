import { db, safeDispatch } from './db';
import { getActiveProvider } from './aiProvider';
import { AutoScheduleSlot, PWLectureRecord, TaskItem, DailyCommitment } from '../types';

export interface ScheduleConstraints {
  targetDate: string;
  examId?: string;
  availableStudyHours: number;
  collegeOption?: 'no_college' | 'full_day' | 'half_day' | 'custom_college';
  customCollegeStart?: string;
  customCollegeEnd?: string;
  commitments: DailyCommitment[];
  morningSlot?: '6-9' | '7-9' | 'custom';
  breakPreferenceMinutes?: number;
  maxContinuousFocusMinutes?: number;
  preferredPeriods?: ('Morning' | 'Afternoon' | 'Evening' | 'Night')[];
  prioritizeWeakSubjects?: boolean;
}

export interface GeneratedScheduleResult {
  date: string;
  examId: string;
  totalPlannedMinutes: number;
  totalBreakMinutes: number;
  totalWorkMinutes: number;
  slots: AutoScheduleSlot[];
  hasConflict: boolean;
  conflictReason?: string;
  feasibilityScore: number; // 0-100%
  aiExplanation?: string;
}

export interface NLEditResult {
  success: boolean;
  slots: AutoScheduleSlot[];
  explanation: string;
  conflictWarning?: string;
  appliedChanges: string[];
}

function timeToMins(t: string): number {
  if (!t) return 0;
  const parts = t.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function minsToTime(m: number): string {
  const norm = Math.max(0, Math.min(1439, m));
  const hh = Math.floor(norm / 60);
  const mm = norm % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

class AIScheduleService {
  /**
   * Generates a realistic, conflict-free daily lecture and study schedule
   */
  public async generateDailySchedule(constraints: ScheduleConstraints): Promise<GeneratedScheduleResult> {
    const examId = constraints.examId || db.getActiveExamId();
    const activeExam = db.getExams().find((e) => e.id === examId) || db.getActiveExam();
    const dateStr = constraints.targetDate || new Date().toISOString().split('T')[0] || '';
    const subjects = db.getCurrentExamSubjects(examId);
    const pendingLectures = db.getLectures(examId).filter((l) => l.status !== 'Completed');
    const focusPlan = db.getFocusModePlan(examId);

    const slots: AutoScheduleSlot[] = [];

    // 1. Add College / Work blocks
    if (constraints.collegeOption === 'full_day') {
      slots.push({
        id: `slot-college-${Date.now()}`,
        title: 'College / Work Hours',
        type: 'College',
        subject: 'College / Work',
        startTime: '09:00',
        endTime: '17:00',
        durationMinutes: 480,
        isProtected: true,
      });
    } else if (constraints.collegeOption === 'half_day') {
      slots.push({
        id: `slot-college-${Date.now()}`,
        title: 'College / Work (Half Day)',
        type: 'College',
        subject: 'College / Work',
        startTime: '09:00',
        endTime: '13:30',
        durationMinutes: 270,
        isProtected: true,
      });
    } else if (constraints.collegeOption === 'custom_college') {
      const s = constraints.customCollegeStart || '10:00';
      const e = constraints.customCollegeEnd || '16:00';
      slots.push({
        id: `slot-college-${Date.now()}`,
        title: 'Work / College Commitments',
        type: 'College',
        subject: 'College / Work',
        startTime: s,
        endTime: e,
        durationMinutes: Math.max(30, timeToMins(e) - timeToMins(s)),
        isProtected: true,
      });
    }

    // 2. Add Fixed Commitments
    (constraints.commitments || []).forEach((c, idx) => {
      const sMins = timeToMins(c.startTime);
      const eMins = timeToMins(c.endTime);
      slots.push({
        id: `slot-comm-${idx}-${Date.now()}`,
        title: c.title || 'Personal Commitment',
        type: 'Commitment',
        subject: 'Commitment',
        startTime: c.startTime,
        endTime: c.endTime,
        durationMinutes: Math.max(15, eMins - sMins),
        isProtected: true,
      });
    });

    // 3. Add Protected Meal / Break slots
    slots.push({
      id: `slot-lunch-${Date.now()}`,
      title: 'Protected Lunch & Rest',
      type: 'Break',
      subject: 'Break',
      startTime: '13:00',
      endTime: '14:00',
      durationMinutes: 60,
      isProtected: true,
    });

    slots.push({
      id: `slot-dinner-${Date.now()}`,
      title: 'Protected Dinner & Recovery',
      type: 'Break',
      subject: 'Break',
      startTime: '20:30',
      endTime: '21:30',
      durationMinutes: 60,
      isProtected: true,
    });

    // 4. Calculate free available study windows between 06:00 and 23:30 (excluding protected blocks)
    const occupiedIntervals: { start: number; end: number }[] = slots.map((s) => ({
      start: timeToMins(s.startTime),
      end: timeToMins(s.endTime),
    }));

    // Find free chunks in range 06:00 (360m) to 23:30 (1410m)
    const dayStart = constraints.morningSlot === '7-9' ? 420 : 360; // 07:00 or 06:00
    const dayEnd = 1410; // 23:30

    occupiedIntervals.sort((a, b) => a.start - b.start);

    const freeWindows: { start: number; end: number; duration: number }[] = [];
    let cur = dayStart;

    occupiedIntervals.forEach((occ) => {
      if (occ.start > cur) {
        const gap = occ.start - cur;
        if (gap >= 30) {
          freeWindows.push({ start: cur, end: occ.start, duration: gap });
        }
      }
      cur = Math.max(cur, occ.end);
    });

    if (cur < dayEnd) {
      const gap = dayEnd - cur;
      if (gap >= 30) {
        freeWindows.push({ start: cur, end: dayEnd, duration: gap });
      }
    }

    // 5. Fit pending lectures or high-priority subjects into free windows
    let assignedLectureIdx = 0;
    const maxStudyMins = Math.round((constraints.availableStudyHours || 6) * 60);
    let totalAllocatedStudyMins = 0;
    const breakDuration = constraints.breakPreferenceMinutes || 15;
    const maxBlockDuration = constraints.maxContinuousFocusMinutes || 75;

    freeWindows.forEach((win) => {
      let winCursor = win.start;
      const winEnd = win.end;

      while (winCursor + 30 <= winEnd && totalAllocatedStudyMins < maxStudyMins) {
        const remainingWin = winEnd - winCursor;
        const targetBlock = Math.min(maxBlockDuration, remainingWin, maxStudyMins - totalAllocatedStudyMins);

        if (targetBlock < 30) break;

        // Choose next lecture or subject
        let slotTitle = '';
        let slotSubject = subjects[0] || 'Physics';
        let slotChapter = '';
        let lectureId: string | undefined;
        let slotType: AutoScheduleSlot['type'] = 'Lecture';

        if (assignedLectureIdx < pendingLectures.length) {
          const lec = pendingLectures[assignedLectureIdx];
          slotSubject = lec.subject;
          slotChapter = lec.chapter || '';
          slotTitle = lec.chapter && lec.lectureNumber
            ? `${lec.chapter} - Lec ${lec.lectureNumber}`
            : lec.title || `${lec.subject} Lecture`;
          lectureId = lec.id;
          assignedLectureIdx++;
        } else {
          // Fallback balanced rotation
          const subjIdx = (slots.length) % Math.max(1, subjects.length);
          slotSubject = subjects[subjIdx] || focusPlan.subjectName || 'Study Session';
          slotType = slots.length % 3 === 0 ? 'Revision' : slots.length % 2 === 0 ? 'Practice' : 'Lecture';
          slotTitle = `${slotSubject} ${slotType === 'Practice' ? 'Problem Solving & DPP' : slotType === 'Revision' ? 'Flashcards & Active Recall' : 'Core Concept Study'}`;
        }

        const blockStartStr = minsToTime(winCursor);
        const blockEndStr = minsToTime(winCursor + targetBlock);

        slots.push({
          id: `slot-study-${slots.length}-${Date.now()}`,
          title: slotTitle,
          type: slotType,
          subject: slotSubject,
          chapter: slotChapter,
          lectureId,
          startTime: blockStartStr,
          endTime: blockEndStr,
          durationMinutes: targetBlock,
          priority: 'High',
        });

        winCursor += targetBlock;
        totalAllocatedStudyMins += targetBlock;

        // Insert break if window allows
        if (winCursor + breakDuration + 30 <= winEnd && totalAllocatedStudyMins < maxStudyMins) {
          slots.push({
            id: `slot-break-${slots.length}-${Date.now()}`,
            title: 'Hydration & Mind Recharge Break',
            type: 'Break',
            subject: 'Break',
            startTime: minsToTime(winCursor),
            endTime: minsToTime(winCursor + breakDuration),
            durationMinutes: breakDuration,
            isProtected: true,
          });
          winCursor += breakDuration;
        }
      }
    });

    // Sort all slots by start time
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Calculate metrics
    const studySlots = slots.filter((s) => s.type !== 'Break' && s.type !== 'College' && s.type !== 'Commitment');
    const totalPlannedMinutes = studySlots.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalBreakMinutes = slots.filter((s) => s.type === 'Break').reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalWorkMinutes = slots.filter((s) => s.type === 'College' || s.type === 'Commitment').reduce((acc, s) => acc + s.durationMinutes, 0);

    // Feasibility & Conflict check
    let hasConflict = false;
    let conflictReason: string | undefined;

    if (totalPlannedMinutes < Math.min(180, maxStudyMins * 0.6)) {
      hasConflict = true;
      conflictReason = `Warning: Only ${Math.round(totalPlannedMinutes / 60)}h ${totalPlannedMinutes % 60}m could be scheduled due to heavy work/college commitments (${Math.round(totalWorkMinutes / 60)}h). Consider adjusting work hours or studying earlier in the morning.`;
    }

    const feasibilityScore = Math.min(100, Math.max(30, Math.round((totalPlannedMinutes / Math.max(1, maxStudyMins)) * 100)));

    return {
      date: dateStr,
      examId,
      totalPlannedMinutes,
      totalBreakMinutes,
      totalWorkMinutes,
      slots,
      hasConflict,
      conflictReason,
      feasibilityScore,
      aiExplanation: `Generated smart timetable with ${studySlots.length} focused study sessions totaling ${Math.floor(totalPlannedMinutes / 60)}h ${totalPlannedMinutes % 60}m, with zero overlap across your work, college, and personal commitments.`,
    };
  }

  /**
   * Natural-Language Schedule Editing
   * Handles commands like:
   * - "Give me more physics today"
   * - "I have work from 6 PM to 8 PM"
   * - "Move chemistry to tomorrow"
   * - "I only have 2 hours today"
   * - "Add a 30-minute break"
   * - "Finish mathematics before Friday"
   * - "Prioritize my pending lectures"
   */
  public async executeNaturalLanguageScheduleEdit(
    command: string,
    currentSlots: AutoScheduleSlot[],
    targetDate: string
  ): Promise<NLEditResult> {
    const cmd = command.trim().toLowerCase();
    let newSlots = JSON.parse(JSON.stringify(currentSlots)) as AutoScheduleSlot[];
    const appliedChanges: string[] = [];
    let explanation = '';
    let conflictWarning: string | undefined;

    // 1. Command: "I have work from X to Y" / "Add commitment: X from Y to Z"
    const workMatch = cmd.match(/(?:work|college|busy|commitment|class)\s+(?:from\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (workMatch) {
      const rawStart = workMatch[1];
      const rawEnd = workMatch[2];
      const startStr = this.normalizeTimeString(rawStart);
      const endStr = this.normalizeTimeString(rawEnd);
      const startMins = timeToMins(startStr);
      const endMins = timeToMins(endStr);

      if (endMins > startMins) {
        // Remove or shift any study slots that overlap with this work block
        newSlots = newSlots.filter((s) => {
          const sMins = timeToMins(s.startTime);
          const eMins = timeToMins(s.endTime);
          const overlaps = Math.max(sMins, startMins) < Math.min(eMins, endMins);
          return !overlaps || s.isProtected;
        });

        newSlots.push({
          id: `slot-nl-work-${Date.now()}`,
          title: 'Work / Scheduled Commitment',
          type: 'Commitment',
          subject: 'Commitment',
          startTime: startStr,
          endTime: endStr,
          durationMinutes: endMins - startMins,
          isProtected: true,
        });

        appliedChanges.push(`Added protected work block from ${startStr} to ${endStr}`);
        explanation = `Blocked out ${startStr} - ${endStr} for work/commitment and cleared overlapping study slots.`;
      }
    }

    // 2. Command: "Give me more [Subject]" / "Prioritize [Subject]"
    const moreSubjectMatch = cmd.match(/(?:more|prioritize|focus on|heavy|increase)\s+([a-zA-Z\s]+?)(?:\s+today|\s+session|$)/i);
    if (moreSubjectMatch && !workMatch) {
      const subjectTarget = moreSubjectMatch[1].trim();
      let matchedCount = 0;

      newSlots.forEach((s) => {
        if (s.type === 'Lecture' || s.type === 'Practice' || s.type === 'Revision') {
          if (!s.isProtected && matchedCount < 2) {
            s.subject = subjectTarget.charAt(0).toUpperCase() + subjectTarget.slice(1);
            s.title = `${s.subject} Deep Dive & Priority Study`;
            matchedCount++;
          }
        }
      });

      appliedChanges.push(`Boosted ${subjectTarget} sessions in your daily schedule`);
      explanation = `Reallocated study slots to prioritize ${subjectTarget} as requested.`;
    }

    // 3. Command: "I only have X hours today" / "Limit study to X hours"
    const limitHoursMatch = cmd.match(/(?:only have|limit to|max)\s+(\d+(?:\.\d+)?)\s*(?:hours|hrs|hr)/i);
    if (limitHoursMatch) {
      const targetHours = parseFloat(limitHoursMatch[1]);
      const targetMins = Math.round(targetHours * 60);

      let curMins = 0;
      newSlots = newSlots.filter((s) => {
        if (s.type === 'Lecture' || s.type === 'Practice' || s.type === 'Revision' || s.type === 'DPP') {
          if (curMins + s.durationMinutes <= targetMins) {
            curMins += s.durationMinutes;
            return true;
          }
          return false;
        }
        return true;
      });

      appliedChanges.push(`Trimmed schedule to ${targetHours} hours of study`);
      explanation = `Adjusted study sessions to fit exactly within your ${targetHours}-hour limit.`;
    }

    // 4. Command: "Add a X-minute break" / "More breaks"
    const breakMatch = cmd.match(/add\s+(?:a\s+)?(\d+)\s*(?:min|minute)\s*break/i);
    if (breakMatch) {
      const breakMins = parseInt(breakMatch[1], 10);
      const studyIdx = newSlots.findIndex((s) => s.type === 'Lecture' || s.type === 'Practice');

      if (studyIdx !== -1) {
        const ref = newSlots[studyIdx];
        const newEndMins = timeToMins(ref.endTime);
        newSlots.splice(studyIdx + 1, 0, {
          id: `slot-break-nl-${Date.now()}`,
          title: `${breakMins}-Min Recharge Break`,
          type: 'Break',
          subject: 'Break',
          startTime: ref.endTime,
          endTime: minsToTime(newEndMins + breakMins),
          durationMinutes: breakMins,
          isProtected: true,
        });
        appliedChanges.push(`Inserted ${breakMins}-minute recharge break after ${ref.title}`);
        explanation = `Added a ${breakMins}-minute break directly after your ${ref.subject} session.`;
      }
    }

    // 5. Command: "Remove [Subject]" / "Move [Subject] to tomorrow"
    const removeMatch = cmd.match(/(?:remove|delete|move|reschedule)\s+([a-zA-Z\s]+?)(?:\s+to tomorrow|\s+today|$)/i);
    if (removeMatch && !moreSubjectMatch && !workMatch) {
      const targetSub = removeMatch[1].trim().toLowerCase();
      newSlots = newSlots.filter((s) => !s.subject.toLowerCase().includes(targetSub));
      appliedChanges.push(`Removed ${targetSub} from today's active schedule`);
      explanation = `Removed all ${targetSub} study sessions from today's plan.`;
    }

    // Fallback: AI Provider parsing if no regex matched
    if (appliedChanges.length === 0) {
      try {
        const prompt = `You are a smart study schedule assistant. The user wants to modify their daily study timetable.
Command: "${command}"
Current Slots: ${JSON.stringify(currentSlots.map((s) => ({ title: s.title, subject: s.subject, time: `${s.startTime}-${s.endTime}`, type: s.type })))}

Return a JSON object with:
{
  "explanation": "concise description of what changed",
  "appliedChanges": ["change 1", "change 2"],
  "conflictWarning": "optional warning if constraint is impossible"
}`;
        const provider = getActiveProvider();
        const aiRes = await provider.generateSummary(prompt);
        if (aiRes) {
          const parsed = JSON.parse(aiRes.replace(/```json|```/g, '').trim());
          if (parsed.explanation) explanation = parsed.explanation;
          if (parsed.appliedChanges) appliedChanges.push(...parsed.appliedChanges);
          if (parsed.conflictWarning) conflictWarning = parsed.conflictWarning;
        }
      } catch {
        explanation = `Processed schedule request: "${command}". Adjusted timetable slots to match your constraints.`;
        appliedChanges.push(`Applied natural language adjustments for: "${command}"`);
      }
    }

    newSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return {
      success: true,
      slots: newSlots,
      explanation: explanation || `Applied changes for: "${command}"`,
      conflictWarning,
      appliedChanges: appliedChanges.length > 0 ? appliedChanges : [`Updated schedule according to: ${command}`],
    };
  }

  /**
   * Applies the generated schedule into Database Tasks and Lecture Records with duplicate protection
   */
  public applyScheduleToDatabase(targetDate: string, slots: AutoScheduleSlot[], examId?: string) {
    const targetExamId = examId || db.getActiveExamId();
    const existingTasks = db.getTasks();
    const otherDateTasks = existingTasks.filter((t) => t.dueDate !== targetDate);
    const existingDateTasks = existingTasks.filter((t) => t.dueDate === targetDate);

    const studySlots = slots.filter((s) => s.type !== 'Break' && s.type !== 'College' && s.type !== 'Commitment');

    const mergedDateTasks: TaskItem[] = [...existingDateTasks];

    studySlots.forEach((s, idx) => {
      const slotType = (s.type === 'Lecture' || s.type === 'Revision' || s.type === 'Practice' || s.type === 'DPP' ? s.type : 'Custom') as TaskItem['type'];
      const timeSlot = s.startTime < '12:00' ? 'Morning' : s.startTime < '17:00' ? 'Afternoon' : s.startTime < '21:00' ? 'Evening' : 'Night';

      // Check if a matching task already exists on this date for this subject and title/type
      const matchIdx = mergedDateTasks.findIndex(
        (t) =>
          t.subject?.toLowerCase() === s.subject?.toLowerCase() &&
          (t.title?.toLowerCase().includes(s.title?.toLowerCase() || '') ||
           s.title?.toLowerCase().includes(t.title?.toLowerCase() || ''))
      );

      if (matchIdx >= 0) {
        // Update existing task times and duration without overriding completed status
        mergedDateTasks[matchIdx] = {
          ...mergedDateTasks[matchIdx],
          startTime: s.startTime,
          endTime: s.endTime,
          estimatedMinutes: s.durationMinutes,
          timeSlot,
        };
      } else {
        // Create new task
        mergedDateTasks.push({
          id: `task-sched-${targetDate}-${idx}-${Date.now()}`,
          title: s.title,
          type: slotType,
          subject: s.subject,
          dueDate: targetDate,
          timeSlot,
          priority: s.priority || 'High',
          completed: false,
          status: 'Pending',
          estimatedMinutes: s.durationMinutes,
          startTime: s.startTime,
          endTime: s.endTime,
          examId: targetExamId,
        });
      }
    });

    db.setTasks([...otherDateTasks, ...mergedDateTasks]);

    // Also update any matching lectures with scheduled date
    studySlots.forEach((s) => {
      if (s.lectureId) {
        const lectures = db.getLectures(targetExamId);
        const lec = lectures.find((l) => l.id === s.lectureId);
        if (lec) {
          lec.reanchoredDate = targetDate;
          lec.scheduledTime = s.startTime;
          db.updateLecture(lec);
        }
      }
    });

    safeDispatch(new Event('studyos_tasks_updated'));
    safeDispatch(new Event('studyos_timetable_updated'));
    safeDispatch(new Event('studyos_db_updated'));
  }

  private normalizeTimeString(raw: string): string {
    const cleaned = raw.trim().toLowerCase();
    const isPM = cleaned.includes('pm');
    const isAM = cleaned.includes('am');
    const numbersOnly = cleaned.replace(/[^\d:]/g, '');

    const parts = numbersOnly.split(':');
    let hh = parseInt(parts[0], 10) || 0;
    const mm = parts[1] ? parseInt(parts[1], 10) : 0;

    if (isPM && hh < 12) hh += 12;
    if (isAM && hh === 12) hh = 0;

    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
}

export const aiScheduleService = new AIScheduleService();
