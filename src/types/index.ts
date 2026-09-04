export type PreparationPhase = 
  | 'PHASE_1_FOUNDATION'
  | 'PHASE_2_CORE_SYLLABUS'
  | 'PHASE_3_PRACTICE_PYQS'
  | 'PHASE_4_REVISION_WEAKNESS'
  | 'PHASE_5_MOCKS_FINAL';

export interface UserProfile {
  name: string;
  targetExam: string; // e.g. "GATE 2027"
  paper: string; // "CS"
  examDate: string; // "2027-02-07"
  startDate: string; // "2026-09-02"
  dailyTargetStudyMinutes: number; // 240 (4 hours)
  dsaDailyCount: number; // 3
  wakeTime: string; // "07:00"
  bedTime: string; // "23:00"
  streakDays: number;
  lastActiveDate: string;
  setupCompleted: boolean;
  soundEnabled: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  weightage: number; // approximate % marks in GATE
  order: number;
  iconName: string;
  color: string;
  officialSectionNumber: number; // 1 to 11
  officialDescription?: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  subjectId: string;
  subjectName: string;
  name: string;
  officialSyllabusText: string; // Faithful official GATE 2027 syllabus entry
  studyBreakdown: string[];     // GatePlanner structured study tasks
  subtopics: string[];         // Backward compatibility
  estimatedMinutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = Easy, 5 = Tough
  importance: 'High' | 'Medium' | 'Low';
  phase: PreparationPhase;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_revision';
  completionPercent: number;
  practiceStatus: 'not_started' | 'partial' | 'completed';
  pyqStatus: 'not_started' | 'partial' | 'completed';
  pyqTotal: number;
  pyqSolved: number;
  revisionLevel: number; // 0 (unrevised) -> 5 (mastered)
  nextRevisionDate: string | null;
  lastStudiedAt: string | null;
  notes?: string;
}

export type DsaCategory =
  | 'Arrays'
  | 'Strings'
  | 'Two Pointers'
  | 'Linked Lists'
  | 'Stack & Queue'
  | 'Binary Search'
  | 'Trees'
  | 'Binary Search Tree'
  | 'Heap & Priority Queue'
  | 'Graphs'
  | 'Dynamic Programming'
  | 'Greedy Algorithms'
  | 'Backtracking'
  | 'Bit Manipulation';

export type DsaDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface DsaProblem {
  id: string;
  title: string;
  category: DsaCategory;
  difficulty: DsaDifficulty;
  url: string;
  platform: 'LeetCode' | 'GeeksforGeeks' | 'InterviewBit' | 'Standard GATE';
  coreConcept: string;
  hint: string;
  status: 'unsolved' | 'attempted' | 'solved';
  lastAttemptDate: string | null;
  attemptsCount: number;
  successCount: number;
  failureCount: number;
  timeTakenMinutes: number | null;
  rating?: number;
  codeTemplate?: string;
}

export type TimeBlockCategory =
  | 'gate'
  | 'dsa'
  | 'health'
  | 'break'
  | 'revision'
  | 'mock'
  | 'routine';

export interface TimeBlock {
  id: string;
  startTime: string; // "18:00"
  endTime: string;   // "19:00"
  title: string;
  subtitle?: string;
  category: TimeBlockCategory;
  topicId?: string;
  subjectId?: string;
  dsaProblemId?: string;
  durationMinutes: number;
  isCompleted: boolean;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
  isAdjusted?: boolean;
}

export interface HealthHabitChecklist {
  morningKickoffHydration: boolean;
  morningStretching: boolean;
  nutritiousBreakfast: boolean;
  studyBreaksTaken: number;
  studyBreaksGoal: number;
  midMorningEyeRest: boolean;
  excessiveSittingAvoided: boolean;
  healthyMeals: boolean;
  exerciseMinutes: number;
  exerciseCompleted: boolean;
  hydrationGlasses: number;
  hydrationGoalGlasses: number;
  healthyDinner: boolean;
  nightWindDown: boolean;
  sleepHours: number;
  sleepTargetAchieved: boolean;
}

export interface DailySleepConstraint {
  targetSleepTime: string; // e.g. "23:30" or "03:00"
  isUserSelected: boolean;
  wakeTimeTomorrow: string; // e.g. "07:00"
}

export interface DailyPlan {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  totalDays: number;
  timeBlocks: TimeBlock[];
  dsaProblemIds: string[];
  healthHabits: HealthHabitChecklist;
  isCompleted: boolean;
  actualStudyMinutes: number;
  targetStudyMinutes: number;
  dailyScore: number;
  notes: string;
  userChosenBedtime?: string; // User-selected bedtime constraint (e.g. "23:30")
  recommendedBedtime?: string; // Dynamic recommended bedtime (e.g. "23:15")
  isAdaptiveActive?: boolean;
  sleepConstraint?: DailySleepConstraint;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  authority: string;
  officialUrl: string;
  lastCheckedDate: string;
  version: string;
  status: 'verified' | 'update_available' | 'syncing';
  description: string;
  guidelinesSummary: string;
  pendingDiff?: {
    summary: string;
    changes: { type: 'added' | 'modified' | 'removed'; text: string }[];
  };
}

export interface RevisionQueueItem {
  id: string;
  topicId: string;
  topicName: string;
  subjectName: string;
  stage: number;
  scheduledDate: string;
  isCompleted: boolean;
}

export interface WeeklyAnalytics {
  weekLabel: string;
  startDate: string;
  endDate: string;
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  dsaSolvedCount: number;
  dsaTargetCount: number;
  healthConsistencyAverage: number;
  topicsCompletedCount: number;
  topicsBehindCount: number;
  strongSubject: string;
  weakSubject: string;
  syllabusCoveredPercent: number;
  schedulePaceDeltaMinutes: number;
}

// --- ADAPTIVE SCHEDULING SCHEMAS ---

export interface AdaptiveScheduleOptions {
  startTime?: string;              // e.g. "16:00" or current time
  customAvailableMinutes?: number; // e.g. 150 (2.5 hours)
  allowBedtimeExtension?: boolean; // allow dynamic extension if late start (respecting sleep minimums)
  userChosenBedtime?: string;      // Explicit user selected bedtime (e.g. "00:30")
  targetSleepHours?: number;        // default 7.5h
}

export interface AdaptiveScheduleReport {
  originalPlannedMinutes: number;
  actualAvailableMinutes: number;
  scheduledStudyMinutes: number;
  adaptiveStartTime: string;
  adaptiveBedtime: string;
  recommendedBedtime: string;
  retainedTasksCount: number;
  deferredTasksCount: number;
  summaryMessage: string;
  strategyApplied: string;
  isWorkloadExceeding: boolean;
}

// --- TEST PAPERS & 26+ YEARS PYQ SCHEMAS ---

export type TestType = 
  | 'full_mock' 
  | 'subject_test' 
  | 'topic_test' 
  | 'pyq_practice'
  | 'topic_practice'
  | 'all_pyqs'
  | 'bookmarked'
  | 'incorrect';

export type QuestionType = 'MCQ' | 'MSQ' | 'NAT';

export type QuestionSourceType = 'Official GATE PYQ' | 'GatePlanner Practice';

export interface TestQuestion {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  subtopicName?: string;
  questionNumber: number;
  questionText: string;
  options?: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctAnswer: string | string[] | number | { min: number; max: number };
  type: QuestionType;
  sourceType: QuestionSourceType;
  year?: number;
  session?: string; // e.g. "Shift 1", "Shift 2", "Set 1", "Set 2", "Single Session"
  paper?: string; // e.g. "GATE Computer Science & Information Technology"
  sourcePaper?: string; // e.g. "GATE 2024 CS Set 1 Master Paper"
  sourceRef?: string; // e.g. "IISc Bangalore / Official GATE Archive"
  isOfficialPYQ?: boolean;
  verificationStatus?: 'verified' | 'unverified';
  marks: 1 | 2;
  negativeMarks: number;
  explanation: string;
  officialAnswerKey?: string;
  keyConcept: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface PaperAuditRecord {
  paperName: string;
  session: string;
  discoveredCount: number;
  importedCount: number;
  missingCount: number;
  isComplete: boolean;
}

export interface YearAuditRecord {
  year: number;
  organizingInstitute: string;
  sessions: string[];
  discoveredCount: number;
  importedCount: number;
  missingCount: number;
  duplicateCount: number;
  unverifiedCount: number;
  isComplete: boolean;
  papers?: PaperAuditRecord[];
}

export interface DetailedAuditReport {
  totalYearsChecked: number;
  yearsRange: string;
  totalPapersDiscovered: number;
  totalQuestionsDiscovered: number;
  totalVerifiedImported: number;
  duplicatesRemoved: number;
  unverifiedCount: number;
  missingCount: number;
  isEntireDatabaseComplete: boolean;
  yearRecords: YearAuditRecord[];
}

export interface PYQAttemptRecord {
  questionId: string;
  userResponse: string | string[] | number;
  isCorrect: boolean;
  attemptedAt: string;
  timeSpentSeconds: number;
}

export interface PYQFilterOptions {
  subjectId?: string;
  topicId?: string;
  subtopicName?: string;
  year?: number | 'all';
  type?: QuestionType | 'all';
  sourceType?: 'all' | 'Official GATE PYQ' | 'GatePlanner Practice';
  status?: 'all' | 'unattempted' | 'correct' | 'incorrect' | 'bookmarked';
  difficulty?: 'all' | 'Easy' | 'Medium' | 'Hard';
  searchQuery?: string;
}

export interface PYQAnalyticsData {
  totalPYQs: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  accuracyPercent: number;
  completionPercent: number;
  bookmarkedCount: number;
  subjectPerformance: Record<string, { total: number; attempted: number; correct: number; accuracy: number }>;
  topicPerformance: Record<string, { subjectName: string; topicName: string; total: number; correct: number; accuracy: number }>;
  yearPerformance: Record<number, { total: number; correct: number; accuracy: number }>;
  weakTopics: { subjectName: string; topicName: string; accuracy: number; total: number }[];
  strongTopics: { subjectName: string; topicName: string; accuracy: number; total: number }[];
}

export interface TestPaper {
  id: string;
  title: string;
  subtitle: string;
  type: TestType;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  year?: number;
  questions: TestQuestion[];
}

export interface UserTestAttempt {
  id: string;
  testPaperId: string;
  testTitle: string;
  type: TestType;
  subjectName?: string;
  date: string;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  timeTakenSeconds: number;
  responses: Record<string, string | string[] | number>;
  reviewFlags: Record<string, boolean>;
  subjectPerformance: Record<string, { total: number; correct: number; score: number; totalMarks: number }>;
  topicPerformance: Record<string, { total: number; correct: number; score: number; totalMarks: number }>;
  weakAreas: { subjectName: string; topicName: string; accuracyPercent: number }[];
}
