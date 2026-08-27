import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sun,
  Moon,
  Coffee,
} from 'lucide-react';
import { db } from '../../services/db';
import { CollegeOption, DailyAvailabilityRecord, DailyCommitment, AutoScheduleResult } from '../../types';

interface DailyScheduleSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate?: string;
  onScheduleGenerated?: (result: AutoScheduleResult) => void;
}

export const DailyScheduleSetupModal: React.FC<DailyScheduleSetupModalProps> = ({
  isOpen,
  onClose,
  targetDate,
  onScheduleGenerated,
}) => {
  const dateStr = targetDate || new Date().toISOString().split('T')[0] || '';

  const [collegeOption, setCollegeOption] = useState<CollegeOption>('no_college');
  const [customCollegeStart, setCustomCollegeStart] = useState('10:00');
  const [customCollegeEnd, setCustomCollegeEnd] = useState('16:00');
  
  // Multiple college slots support
  const [collegeSlots, setCollegeSlots] = useState<Array<{ id: string; title: string; start: string; end: string }>>([
    { id: 'slot-1', title: 'College Lecture Slot 1', start: '10:00', end: '13:00' },
  ]);
  const [newSlotTitle, setNewSlotTitle] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('14:00');
  const [newSlotEnd, setNewSlotEnd] = useState('16:00');

  const [morningSlot, setMorningSlot] = useState<'6-9' | '7-9' | 'custom'>('6-9');
  const [specialPriority, setSpecialPriority] = useState<
    'focus_subject' | 'other_subject' | 'revision' | 'practice_test' | 'balanced'
  >('focus_subject');
  const [specialSubjectName, setSpecialSubjectName] = useState('');
  const [commitments, setCommitments] = useState<DailyCommitment[]>([]);
  const [newCommitmentTitle, setNewCommitmentTitle] = useState('');
  const [newCommitmentStart, setNewCommitmentStart] = useState('17:00');
  const [newCommitmentEnd, setNewCommitmentEnd] = useState('18:00');

  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [focusSubjectName, setFocusSubjectName] = useState('');
  const [scheduleResult, setScheduleResult] = useState<AutoScheduleResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      const subs = db.getCurrentExamSubjects();
      setAvailableSubjects(subs);
      const plan = db.getFocusModePlan();
      setFocusSubjectName(plan.subjectName || (subs[0] || 'General Studies'));

      const existingAvail = db.getDailyAvailability(dateStr);
      setCollegeOption(existingAvail.collegeOption);
      if (existingAvail.customCollegeStart) setCustomCollegeStart(existingAvail.customCollegeStart);
      if (existingAvail.customCollegeEnd) setCustomCollegeEnd(existingAvail.customCollegeEnd);
      setMorningSlot(existingAvail.morningSlot);
      setSpecialPriority(existingAvail.specialPriority);
      if (existingAvail.specialSubjectName) setSpecialSubjectName(existingAvail.specialSubjectName);
      setCommitments(existingAvail.commitments || []);
      setScheduleResult(null);
    }
  }, [isOpen, dateStr]);

  if (!isOpen) return null;

  const handleAddCollegeSlot = () => {
    if (!newSlotStart || !newSlotEnd) return;
    const title = newSlotTitle.trim() || `College Slot ${collegeSlots.length + 1}`;
    setCollegeSlots([
      ...collegeSlots,
      { id: `cslot-${Date.now()}`, title, start: newSlotStart, end: newSlotEnd },
    ]);
    setNewSlotTitle('');
  };

  const handleRemoveCollegeSlot = (id: string) => {
    setCollegeSlots(collegeSlots.filter((s) => s.id !== id));
  };

  const handleAddCommitment = () => {
    if (!newCommitmentTitle.trim()) return;
    const newComm: DailyCommitment = {
      id: `comm-${Date.now()}`,
      title: newCommitmentTitle.trim(),
      startTime: newCommitmentStart,
      endTime: newCommitmentEnd,
    };
    setCommitments([...commitments, newComm]);
    setNewCommitmentTitle('');
  };

  const handleRemoveCommitment = (id: string) => {
    setCommitments(commitments.filter((c) => c.id !== id));
  };

  const handleGenerate = () => {
    // Merge college slots into commitments if multi-slot custom college is selected
    const allCommitments = [...commitments];
    if (collegeOption === 'custom_college' && collegeSlots.length > 1) {
      collegeSlots.slice(1).forEach((slot) => {
        allCommitments.push({
          id: slot.id,
          title: slot.title,
          startTime: slot.start,
          endTime: slot.end,
        });
      });
    }

    const firstSlot = collegeSlots[0];
    const cStart = collegeOption === 'custom_college' ? (firstSlot?.start || customCollegeStart) : undefined;
    const cEnd = collegeOption === 'custom_college' ? (firstSlot?.end || customCollegeEnd) : undefined;

    db.saveDailyAvailability({
      date: dateStr,
      collegeOption,
      customCollegeStart: cStart,
      customCollegeEnd: cEnd,
      morningSlot,
      commitments: allCommitments,
      specialPriority,
      specialSubjectName: specialPriority === 'other_subject' ? specialSubjectName : undefined,
    });

    const result = db.generateDailySchedule(dateStr);
    setScheduleResult(result);

    if (onScheduleGenerated) {
      onScheduleGenerated(result);
    }
  };

  return (
    <div className="daily-setup-ai-planner fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 border border-indigo-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-slate-900">Daily Study & College Setup</h3>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {dateStr}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Answer today's college schedule to auto-generate a conflict-free study plan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {scheduleResult ? (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm text-emerald-900">Feasible Daily Schedule Generated</h4>
                  <p className="text-xs text-emerald-800 mt-1 font-medium">
                    Planned {Math.round((scheduleResult.totalPlannedMinutes / 60) * 10) / 10} hours of focused study time, respecting protected meal and leisure breaks.
                  </p>
                </div>
              </div>

              {scheduleResult.hasConflict && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-bold">Target Date Warning</span>
                    <p className="font-medium">{scheduleResult.conflictReason}</p>
                  </div>
                </div>
              )}

              {/* Timeline Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Allocated Schedule Timeline
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {scheduleResult.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-3.5 flex items-center justify-between text-xs ${
                        slot.isProtected
                          ? 'bg-slate-50 text-slate-500 font-medium'
                          : 'bg-white text-slate-900 font-bold'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-slate-500 w-24">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <span>{slot.title}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          slot.type === 'Break'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : slot.type === 'College'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {slot.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
              >
                Apply Schedule to Calendar & Planner
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Question 1: College Hours */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>1. Do you have college today?</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {[
                    { id: 'no_college', label: 'No College (Free Day)', desc: 'Max study focus window' },
                    { id: 'morning_college', label: 'Morning College', desc: '10:00 AM - 01:00 PM' },
                    { id: 'afternoon_college', label: 'Afternoon College', desc: '02:00 PM - 06:00 PM' },
                    { id: 'full_college', label: 'Full Day College', desc: '09:00 AM - 05:00 PM' },
                    { id: 'custom_college', label: 'Custom Multiple Slots', desc: 'Add 1 or more college time slots' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCollegeOption(opt.id as CollegeOption)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        collegeOption === opt.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20 font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="font-bold text-xs block">{opt.label}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Multiple College Time Slots Builder */}
                {collegeOption === 'custom_college' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Multiple College Lecture / Lab Slots</span>
                      <span className="text-[11px] text-slate-500 font-medium">{collegeSlots.length} slot(s) configured</span>
                    </div>

                    <div className="space-y-2">
                      {collegeSlots.map((slot, idx) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-800">{slot.title}</span>
                            <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold border border-indigo-100">
                              {slot.start} - {slot.end}
                            </span>
                          </div>
                          {collegeSlots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCollegeSlot(slot.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                              title="Remove slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add new college slot row */}
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Slot Title (e.g. Physics Lab, Lecture 2)..."
                        value={newSlotTitle}
                        onChange={(e) => setNewSlotTitle(e.target.value)}
                        className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                      <input
                        type="time"
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                        className="w-24 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input
                        type="time"
                        value={newSlotEnd}
                        onChange={(e) => setNewSlotEnd(e.target.value)}
                        className="w-24 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleAddCollegeSlot}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                      >
                        + Add Slot
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Question 2: Morning Slot */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>2. Morning Study Preference</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMorningSlot('6-9')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      morningSlot === '6-9'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <span className="font-bold text-xs block">Early Bird (06:00 AM - 09:00 AM)</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">
                      3 full hours before breakfast
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMorningSlot('7-9')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      morningSlot === '7-9'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <span className="font-bold text-xs block">Standard (07:00 AM - 09:00 AM)</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">
                      2 hours before breakfast
                    </span>
                  </button>
                </div>
              </div>

              {/* Question 3: Special Priority for today */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>3. Priority for today's sessions</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { id: 'focus_subject', label: `Focus Subject (${focusSubjectName})` },
                    { id: 'revision', label: 'Heavy Revision Sprint' },
                    { id: 'practice_test', label: 'Practice & Test Series' },
                    { id: 'other_subject', label: 'Specific Subject' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSpecialPriority(p.id as any)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        specialPriority === p.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold text-xs'
                          : 'border-slate-200 bg-white text-xs font-medium'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {specialPriority === 'other_subject' && (
                  <div className="mt-2">
                    <select
                      value={specialSubjectName}
                      onChange={(e) => setSpecialSubjectName(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900"
                    >
                      <option value="">Select a subject...</option>
                      {availableSubjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Question 4: Commitments */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>4. Any additional personal commitments today?</span>
                </label>

                {commitments.length > 0 && (
                  <div className="space-y-1.5">
                    {commitments.map((comm) => (
                      <div
                        key={comm.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{comm.title}</span>
                          <span className="text-slate-500 font-mono font-medium">
                            ({comm.startTime} - {comm.endTime})
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveCommitment(comm.id)}
                          className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newCommitmentTitle}
                    onChange={(e) => setNewCommitmentTitle(e.target.value)}
                    placeholder="e.g. Doctor appointment, Gym"
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                  />
                  <input
                    type="time"
                    value={newCommitmentStart}
                    onChange={(e) => setNewCommitmentStart(e.target.value)}
                    className="py-2 px-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                  />
                  <span className="text-xs text-slate-400 font-bold">-</span>
                  <input
                    type="time"
                    value={newCommitmentEnd}
                    onChange={(e) => setNewCommitmentEnd(e.target.value)}
                    className="py-2 px-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddCommitment}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Protected Slots Notice */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-medium">
                  Protected Routine: Breakfast (09:00-10:00 AM), Leisure (06:00-07:00 PM), and Dinner (09:00-10:00 PM) are protected and never overwritten.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!scheduleResult && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Feasible Schedule</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
