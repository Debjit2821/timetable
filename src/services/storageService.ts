import { 
  UserProfile, 
  Subject, 
  Topic, 
  DailyPlan, 
  DsaProblem, 
  KnowledgeSource, 
  RevisionQueueItem,
  TestPaper,
  UserTestAttempt
} from '../types';
import { DEFAULT_GATE_CS_SYLLABUS } from '../data/gateSyllabusCS';
import { DEFAULT_DSA_PROBLEM_BANK } from '../data/dsaProblemBank';
import { DEFAULT_TEST_PAPERS } from '../data/mockTestPapers';

const STORAGE_KEYS = {
  PROFILE: 'gateplanner_profile',
  SYLLABUS: 'gateplanner_syllabus',
  DSA_BANK: 'gateplanner_dsa_bank',
  DAILY_PLANS: 'gateplanner_daily_plans',
  REVISION_QUEUE: 'gateplanner_revision_queue',
  KNOWLEDGE_SOURCES: 'gateplanner_knowledge_sources',
  TEST_PAPERS: 'gateplanner_test_papers',
  TEST_ATTEMPTS: 'gateplanner_test_attempts',
  PYQ_ATTEMPTS: 'gateplanner_pyq_attempts',
  PYQ_BOOKMARKS: 'gateplanner_pyq_bookmarks',
  LAST_CLEANUP: 'gateplanner_last_cleanup'
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Aspirant',
  targetExam: 'GATE 2027',
  paper: 'CS',
  examDate: '2027-02-07',
  startDate: '2026-09-02',
  dailyTargetStudyMinutes: 240, // 4 hours
  dsaDailyCount: 3,
  wakeTime: '07:00',
  bedTime: '23:00',
  streakDays: 1,
  lastActiveDate: '2026-09-02',
  setupCompleted: true,
  soundEnabled: true
};

// In-memory fallback for Node / test environments
const memoryFallback: Record<string, string> = {};

function storageGet(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryFallback[key] || null;
    }
  }
  return memoryFallback[key] || null;
}

function storageSet(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryFallback[key] = value;
    }
  } else {
    memoryFallback[key] = value;
  }
}

export class StorageService {
  // --- USER PROFILE ---
  static getProfile(): UserProfile {
    const raw = storageGet(STORAGE_KEYS.PROFILE);
    if (!raw) {
      this.saveProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    try {
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  static saveProfile(profile: UserProfile): void {
    storageSet(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  // --- SYLLABUS DATA ---
  static getSyllabus(): Subject[] {
    const raw = storageGet(STORAGE_KEYS.SYLLABUS);
    if (!raw) {
      this.saveSyllabus(DEFAULT_GATE_CS_SYLLABUS);
      return DEFAULT_GATE_CS_SYLLABUS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length < 10) {
        this.saveSyllabus(DEFAULT_GATE_CS_SYLLABUS);
        return DEFAULT_GATE_CS_SYLLABUS;
      }
      return parsed;
    } catch {
      return DEFAULT_GATE_CS_SYLLABUS;
    }
  }

  static saveSyllabus(syllabus: Subject[]): void {
    storageSet(STORAGE_KEYS.SYLLABUS, JSON.stringify(syllabus));
  }

  static updateTopic(topicId: string, updates: Partial<Topic>): Subject[] {
    const syllabus = this.getSyllabus();
    const updated = syllabus.map(subject => ({
      ...subject,
      topics: subject.topics.map(topic => 
        topic.id === topicId ? { ...topic, ...updates } : topic
      )
    }));
    this.saveSyllabus(updated);
    return updated;
  }

  // --- DSA BANK ---
  static getDsaBank(): DsaProblem[] {
    const raw = storageGet(STORAGE_KEYS.DSA_BANK);
    if (!raw) {
      this.saveDsaBank(DEFAULT_DSA_PROBLEM_BANK);
      return DEFAULT_DSA_PROBLEM_BANK;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_DSA_PROBLEM_BANK;
    }
  }

  static saveDsaBank(problems: DsaProblem[]): void {
    storageSet(STORAGE_KEYS.DSA_BANK, JSON.stringify(problems));
  }

  static updateDsaProblem(problemId: string, updates: Partial<DsaProblem>): DsaProblem[] {
    const bank = this.getDsaBank();
    const updated = bank.map(p => (p.id === problemId ? { ...p, ...updates } : p));
    this.saveDsaBank(updated);
    return updated;
  }

  // --- DAILY PLANS ---
  static getDailyPlans(): Record<string, DailyPlan> {
    const raw = storageGet(STORAGE_KEYS.DAILY_PLANS);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  static getDailyPlan(dateStr: string): DailyPlan | null {
    const plans = this.getDailyPlans();
    return plans[dateStr] || null;
  }

  static saveDailyPlan(plan: DailyPlan): void {
    const plans = this.getDailyPlans();
    plans[plan.date] = plan;
    storageSet(STORAGE_KEYS.DAILY_PLANS, JSON.stringify(plans));
  }

  // --- REVISION QUEUE ---
  static getRevisionQueue(): RevisionQueueItem[] {
    const raw = storageGet(STORAGE_KEYS.REVISION_QUEUE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveRevisionQueue(queue: RevisionQueueItem[]): void {
    storageSet(STORAGE_KEYS.REVISION_QUEUE, JSON.stringify(queue));
  }

  static addRevisionItems(items: RevisionQueueItem[]): void {
    const current = this.getRevisionQueue();
    const merged = [...current, ...items];
    this.saveRevisionQueue(merged);
  }

  // --- KNOWLEDGE SOURCES ---
  static getKnowledgeSources(): KnowledgeSource[] {
    const raw = storageGet(STORAGE_KEYS.KNOWLEDGE_SOURCES);
    if (!raw) {
      const initial: KnowledgeSource[] = [
        {
          id: 'src_gate_cs_2027',
          name: 'Official IIT Madras GATE 2027 Syllabus Document',
          authority: 'GATE 2027 Organizing Institute (IIT Madras)',
          officialUrl: 'https://gate2027.iitm.ac.in/exam_papers_and_syllabus',
          lastCheckedDate: '2026-09-02',
          version: 'GATE-2027-CS-V1.0',
          status: 'verified',
          description: 'Official 11-section syllabus covering all core CS, Math & GA areas.',
          guidelinesSummary: 'Source of truth for all topics, mark distributions, and section boundaries.'
        }
      ];
      this.saveKnowledgeSources(initial);
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveKnowledgeSources(sources: KnowledgeSource[]): void {
    storageSet(STORAGE_KEYS.KNOWLEDGE_SOURCES, JSON.stringify(sources));
  }

  // --- TEST PAPERS ---
  static getTestPapers(): TestPaper[] {
    const raw = storageGet(STORAGE_KEYS.TEST_PAPERS);
    if (!raw) {
      this.saveTestPapers(DEFAULT_TEST_PAPERS);
      return DEFAULT_TEST_PAPERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_TEST_PAPERS;
    }
  }

  static saveTestPapers(papers: TestPaper[]): void {
    storageSet(STORAGE_KEYS.TEST_PAPERS, JSON.stringify(papers));
  }

  // --- TEST ATTEMPTS ---
  static getTestAttempts(): UserTestAttempt[] {
    const raw = storageGet(STORAGE_KEYS.TEST_ATTEMPTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveTestAttempt(attempt: UserTestAttempt): void {
    const attempts = this.getTestAttempts();
    attempts.unshift(attempt);
    storageSet(STORAGE_KEYS.TEST_ATTEMPTS, JSON.stringify(attempts));
  }

  // --- PYQ ATTEMPTS & BOOKMARKS ---
  static getPYQAttempts(): Record<string, { userResponse: string | string[] | number; isCorrect: boolean; attemptedAt: string; timeSpentSeconds: number }> {
    const raw = storageGet(STORAGE_KEYS.PYQ_ATTEMPTS);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  static savePYQAttempt(questionId: string, attempt: { userResponse: string | string[] | number; isCorrect: boolean; attemptedAt: string; timeSpentSeconds: number }): void {
    const attempts = this.getPYQAttempts();
    attempts[questionId] = attempt;
    storageSet(STORAGE_KEYS.PYQ_ATTEMPTS, JSON.stringify(attempts));
  }

  static getPYQBookmarks(): string[] {
    const raw = storageGet(STORAGE_KEYS.PYQ_BOOKMARKS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static togglePYQBookmark(questionId: string): string[] {
    const bookmarks = this.getPYQBookmarks();
    const index = bookmarks.indexOf(questionId);
    let updated: string[];
    if (index >= 0) {
      updated = bookmarks.filter(id => id !== questionId);
    } else {
      updated = [...bookmarks, questionId];
    }
    storageSet(STORAGE_KEYS.PYQ_BOOKMARKS, JSON.stringify(updated));
    return updated;
  }

  // --- BACKUP & RESET ---
  static exportFullBackupJSON(): string {
    const backup = {
      profile: this.getProfile(),
      syllabus: this.getSyllabus(),
      dsaBank: this.getDsaBank(),
      dailyPlans: this.getDailyPlans(),
      revisionQueue: this.getRevisionQueue(),
      knowledgeSources: this.getKnowledgeSources(),
      testAttempts: this.getTestAttempts(),
      pyqAttempts: this.getPYQAttempts(),
      pyqBookmarks: this.getPYQBookmarks(),
      exportedAt: new Date().toISOString(),
      version: 'GatePlanner-2027-v1.0'
    };
    return JSON.stringify(backup, null, 2);
  }

  static importFullBackupJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profile) this.saveProfile(data.profile);
      if (data.syllabus) this.saveSyllabus(data.syllabus);
      if (data.dsaBank) this.saveDsaBank(data.dsaBank);
      if (data.dailyPlans) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.DAILY_PLANS, JSON.stringify(data.dailyPlans));
        }
      }
      if (data.revisionQueue) this.saveRevisionQueue(data.revisionQueue);
      if (data.knowledgeSources) this.saveKnowledgeSources(data.knowledgeSources);
      if (data.testAttempts) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.TEST_ATTEMPTS, JSON.stringify(data.testAttempts));
        }
      }
      if (data.pyqAttempts) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.PYQ_ATTEMPTS, JSON.stringify(data.pyqAttempts));
        }
      }
      if (data.pyqBookmarks) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.PYQ_BOOKMARKS, JSON.stringify(data.pyqBookmarks));
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  static resetToDefault(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    Object.keys(memoryFallback).forEach(k => delete memoryFallback[k]);
    this.saveProfile(DEFAULT_PROFILE);
    this.saveSyllabus(DEFAULT_GATE_CS_SYLLABUS);
    this.saveDsaBank(DEFAULT_DSA_PROBLEM_BANK);
  }
}
