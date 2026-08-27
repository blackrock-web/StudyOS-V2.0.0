/**
 * Centralized Subject / Chapter / Topic registry
 * Built directly from official GATE CS & DA 2027 syllabus JSONs (GATE2027_CS_Syllabus.json & GATE2027_DA_Syllabus.json).
 * Every module (Planner, Dashboard, Notes, Flashcards, Formula, Calendar, Mock, Progress, Analytics, Revision, Today's Focus) MUST use this single source of truth.
 */
import type { CourseType, SyllabusSubject } from '../types';
import { RAW_CS_SYLLABUS_DOC, RAW_DA_SYLLABUS_DOC, OfficialSyllabusDoc } from './rawSyllabusData';

function getDbInstance() {
  if (typeof window !== 'undefined') {
    return (window as any).__studyos_db || null;
  }
  return null;
}

export interface RegistrySubject {
  id: string;
  name: string;
  course: CourseType | 'BOTH';
  weightage?: string;
  chapters: RegistryChapter[];
}

export interface RegistryChapter {
  id: string;
  name: string;
  topics: RegistryTopic[];
}

export interface RegistryTopic {
  id: string;
  name: string;
  subtopics: string[];
}

function normalizeDoc(doc: OfficialSyllabusDoc): RegistrySubject[] {
  return (doc.sections || []).map((sec) => {
    const subjectId = `${doc.paper_code.toLowerCase()}-${sec.section_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    return {
      id: subjectId,
      name: sec.section_name, // Subject Level e.g. "Engineering Mathematics"
      course: doc.paper_code,
      chapters: (sec.subjects || []).map((sub) => {
        const chapId = `${subjectId}-${sub.subject.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        return {
          id: chapId,
          name: sub.subject, // Chapter Level e.g. "Discrete Mathematics"
          topics: (sub.topics || []).map((topName, idx) => ({
            id: `${chapId}-top-${idx}`,
            name: topName, // Topic Level e.g. "Propositional and first order logic"
            subtopics: [],
          })),
        };
      }),
    };
  });
}

function docToSyllabusSubjects(doc: OfficialSyllabusDoc): SyllabusSubject[] {
  return (doc.sections || []).map((sec, idx) => {
    const subjectId = `${doc.paper_code.toLowerCase()}-${sec.section_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    return {
      id: subjectId,
      name: sec.section_name,
      course: doc.paper_code,
      tier: 'TIER_1',
      weightage: 'Core',
      coreHours7Month: 40,
      idealHours: 50,
      priorityRank: idx + 1,
      prerequisites: 'Core GATE CS/DA Syllabus',
      topics: (sec.subjects || []).flatMap((sub) =>
        (sub.topics || []).map((topName) => ({
          id: `${doc.paper_code}::${sec.section_name}::${sub.subject}::${topName}`,
          subjectId,
          name: `${sub.subject}: ${topName}`,
          course: doc.paper_code,
          tier: 'TIER_1',
          approach: 'DEPTH',
          weightagePercent: 8,
          idealHours: 12,
          completedHours: 0,
          status: 'Not Started',
          confidence: 3,
          difficulty: 'Medium',
          notesCount: 0,
          questionsSolved: 0,
          revisionCount: 0,
          subtopics: [],
        }))
      ),
    };
  });
}

const CS_REGISTRY = normalizeDoc(RAW_CS_SYLLABUS_DOC);
const DA_REGISTRY = normalizeDoc(RAW_DA_SYLLABUS_DOC);

/** Flat unique subject names for dropdowns */
export const ALL_SUBJECT_NAMES: string[] = (() => {
  const set = new Set<string>();
  CS_REGISTRY.forEach((s) => set.add(s.name));
  DA_REGISTRY.forEach((s) => set.add(s.name));
  // Chapters as well for fine-grained selection
  CS_REGISTRY.forEach((s) => s.chapters.forEach((c) => set.add(c.name)));
  DA_REGISTRY.forEach((s) => s.chapters.forEach((c) => set.add(c.name)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
})();

/** Full hierarchical registry */
export const SUBJECT_REGISTRY: RegistrySubject[] = [
  ...CS_REGISTRY,
  ...DA_REGISTRY,
];

/** Official GATE syllabus subjects for db seed / legacy compatibility */
export const OFFICIAL_GATE_SYLLABUS: SyllabusSubject[] = [
  ...docToSyllabusSubjects(RAW_CS_SYLLABUS_DOC),
  ...docToSyllabusSubjects(RAW_DA_SYLLABUS_DOC),
];

/** Chapters for a given subject name */
export function getChaptersForSubject(subjectName: string, examId?: string): string[] {
  if (!subjectName) return [];
  const dbInst = getDbInstance();
  const activeExamId = examId || (dbInst ? dbInst.getActiveExamId() : (typeof window !== 'undefined' ? localStorage.getItem('studyos_active_exam_id') || 'GATE2027' : 'GATE2027'));
  
  if (dbInst) {
    const exams = dbInst.getExams();
    const activeExam = exams.find((e: any) => e.id === activeExamId || e.code === activeExamId);
    if (activeExam && Array.isArray(activeExam.subjects)) {
      const foundSub = activeExam.subjects.find(
        (s: any) => s.name.toLowerCase() === subjectName.toLowerCase()
      );
      if (foundSub && Array.isArray(foundSub.chapters) && foundSub.chapters.length > 0) {
        return foundSub.chapters.map((c: any) => c.name);
      }
    }

    const syllabus = dbInst.getSyllabus(activeExamId);
    if (syllabus && syllabus.length > 0) {
      const subj = syllabus.find((s: any) => s.name.toLowerCase() === subjectName.toLowerCase());
      if (subj && Array.isArray(subj.topics) && subj.topics.length > 0) {
        const chaps = new Set<string>();
        subj.topics.forEach((t: any) => {
          const parts = t.name.split(':');
          chaps.add(parts[0].trim());
        });
        if (chaps.size > 0) return Array.from(chaps);
      }
    }
  }

  const found = SUBJECT_REGISTRY.filter(
    (s) => s.name.toLowerCase() === subjectName.toLowerCase()
  );
  if (found.length > 0) {
    const chapters = new Set<string>();
    found.forEach((s) => s.chapters.forEach((c) => chapters.add(c.name)));
    return Array.from(chapters);
  }

  return ['Introduction & Fundamentals', 'Core Concepts & Analysis', 'Practice Problems & Exercises'];
}

/** Topics for subject + chapter */
export function getTopicsForChapter(subjectName: string, chapterName: string, examId?: string): string[] {
  if (!subjectName || !chapterName) return [];
  const dbInst = getDbInstance();
  const activeExamId = examId || (dbInst ? dbInst.getActiveExamId() : (typeof window !== 'undefined' ? localStorage.getItem('studyos_active_exam_id') || 'GATE2027' : 'GATE2027'));

  if (dbInst) {
    const exams = dbInst.getExams();
    const activeExam = exams.find((e: any) => e.id === activeExamId || e.code === activeExamId);
    if (activeExam && Array.isArray(activeExam.subjects)) {
      const foundSub = activeExam.subjects.find(
        (s: any) => s.name.toLowerCase() === subjectName.toLowerCase()
      );
      if (foundSub && Array.isArray(foundSub.chapters)) {
        const foundChap = foundSub.chapters.find(
          (c: any) => c.name.toLowerCase() === chapterName.toLowerCase()
        );
        if (foundChap && Array.isArray(foundChap.topics) && foundChap.topics.length > 0) {
          return foundChap.topics.map((t: any) => t.name);
        }
      }
    }

    const syllabus = dbInst.getSyllabus(activeExamId);
    if (syllabus && syllabus.length > 0) {
      const subj = syllabus.find((s: any) => s.name.toLowerCase() === subjectName.toLowerCase());
      if (subj && Array.isArray(subj.topics)) {
        const matchingTopics = subj.topics
          .filter((t: any) => t.name.toLowerCase().startsWith(`${chapterName.toLowerCase()}:`))
          .map((t: any) => t.name.split(':')[1]?.trim() || t.name);
        if (matchingTopics.length > 0) return matchingTopics;
      }
    }
  }

  const found = SUBJECT_REGISTRY.filter(
    (s) => s.name.toLowerCase() === subjectName.toLowerCase()
  );
  const topics = new Set<string>();
  found.forEach((s) => {
    s.chapters
      .filter((c) => c.name.toLowerCase() === chapterName.toLowerCase())
      .forEach((c) => {
        c.topics.forEach((t) => {
          topics.add(t.name);
          t.subtopics.forEach((st) => topics.add(st));
        });
      });
  });
  if (topics.size > 0) return Array.from(topics);

  return ['Core Principles & Theory', 'Applied Problem Solving', 'PYQs & Exam Drills'];
}

/** Custom user subjects */
const CUSTOM_KEY = 'studyos_custom_subjects';

export function getCustomSubjects(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function addCustomSubject(name: string): void {
  const n = name.trim();
  if (!n) return;
  const list = getCustomSubjects();
  if (!list.includes(n) && !ALL_SUBJECT_NAMES.includes(n)) {
    list.push(n);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  }
}

export function getAllSubjectOptions(examId?: string): string[] {
  const dbInst = getDbInstance();
  const activeExamId = examId || (dbInst ? dbInst.getActiveExamId() : (typeof window !== 'undefined' ? localStorage.getItem('studyos_active_exam_id') || 'GATE2027' : 'GATE2027'));
  const isGate = activeExamId.toUpperCase() === 'GATE2027' || activeExamId.toUpperCase() === 'GATE';
  const custom = getCustomSubjects();

  if (dbInst) {
    const subs = dbInst.getCurrentExamSubjects(activeExamId);
    if (subs && subs.length > 0) {
      const set = new Set<string>();
      subs.forEach((s) => set.add(s));
      custom.forEach((c) => set.add(c));
      return Array.from(set);
    }
  }

  if (isGate) {
    const set = new Set([...ALL_SUBJECT_NAMES, ...custom]);
    return Array.from(set);
  }

  return custom.length > 0 ? custom : ['General Studies'];
}

