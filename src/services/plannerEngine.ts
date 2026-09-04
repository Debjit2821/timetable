import { 
  UserProfile, 
  Subject, 
  Topic, 
  DailyPlan, 
  TimeBlock, 
  PreparationPhase,
  HealthHabitChecklist,
  DailySleepConstraint,
  AdaptiveScheduleOptions,
  AdaptiveScheduleReport
} from '../types';
import { StorageService } from './storageService';
import { DsaEngine } from './dsaEngine';
import { RevisionEngine } from './revisionEngine';
import { formatMinutesToHours } from '../utils/dateUtils';

export interface PhaseInfo {
  phase: PreparationPhase;
  name: string;
  description: string;
  startDay: number;
  endDay: number;
  isCurrent: boolean;
  totalTopics: number;
  completedTopics: number;
}

export class PlannerEngine {
  /**
   * Helper to sanitize subtitles and remove any accumulated adaptation history strings.
   */
  static cleanSubtitle(subtitle?: string): string {
    if (!subtitle) return '';
    return subtitle
      .replace(/( · | • )?(Adapted \(\d+m\)|⚡ High-Yield Compacted Sprint \(\d+m\)|Adapted)/gi, '')
      .replace(/( · | • )+$/g, '')
      .trim();
  }

  /**
   * Calculates days remaining until the target GATE exam.
   */
  static getDaysRemaining(examDateStr: string, fromDateStr?: string): number {
    const today = fromDateStr ? new Date(fromDateStr) : new Date();
    const examDate = new Date(examDateStr);
    const diffTime = examDate.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(days, 0);
  }

  /**
   * Calculates the Day Index (e.g. Day 1 / 158)
   */
  static getDayNumber(startDateStr: string, currentDateStr?: string): { currentDay: number; totalDays: number } {
    const start = new Date(startDateStr);
    const current = currentDateStr ? new Date(currentDateStr) : new Date();
    const profile = StorageService.getProfile();
    const exam = new Date(profile.examDate);

    const totalDays = Math.max(Math.ceil((exam.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 1);
    const elapsedDays = Math.ceil((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.min(Math.max(elapsedDays, 1), totalDays);

    return { currentDay, totalDays };
  }

  /**
   * Dynamically constructs the 5 Preparation Phases tailored to the timeline across all 11 sections.
   */
  static getPhases(syllabus: Subject[], totalDays: number, currentDay: number): PhaseInfo[] {
    const allTopics = syllabus.flatMap(s => s.topics);

    const p1End = Math.max(Math.round(totalDays * 0.22), 15);
    const p2End = Math.max(p1End + Math.round(totalDays * 0.38), p1End + 25);
    const p3End = Math.max(p2End + Math.round(totalDays * 0.18), p2End + 15);
    const p4End = Math.max(p3End + Math.round(totalDays * 0.12), p3End + 10);
    const p5End = totalDays;

    const p1Topics = allTopics.filter(t => t.phase === 'PHASE_1_FOUNDATION');
    const p2Topics = allTopics.filter(t => t.phase === 'PHASE_2_CORE_SYLLABUS');
    const allCompleted = allTopics.filter(t => t.status === 'completed').length;

    const phases: PhaseInfo[] = [
      {
        phase: 'PHASE_1_FOUNDATION',
        name: 'Phase 1 — Mathematics, Logic & Foundations',
        description: 'Discrete Math, C Programming, Logic, Linear Algebra & General Aptitude fundamentals.',
        startDay: 1,
        endDay: p1End,
        isCurrent: currentDay >= 1 && currentDay <= p1End,
        totalTopics: p1Topics.length,
        completedTopics: p1Topics.filter(t => t.status === 'completed').length
      },
      {
        phase: 'PHASE_2_CORE_SYLLABUS',
        name: 'Phase 2 — Core Engineering Syllabus',
        description: 'Comprehensive mastery of OS, DBMS, Algorithms, TOC, Computer Networks & Architecture.',
        startDay: p1End + 1,
        endDay: p2End,
        isCurrent: currentDay > p1End && currentDay <= p2End,
        totalTopics: p2Topics.length,
        completedTopics: p2Topics.filter(t => t.status === 'completed').length
      },
      {
        phase: 'PHASE_3_PRACTICE_PYQS',
        name: 'Phase 3 — Rigorous Practice & 26+ Years PYQs',
        description: 'Topic-wise drilling, timer-based PYQ sets (2000-2025), identifying conceptual traps across all 11 sections.',
        startDay: p2End + 1,
        endDay: p3End,
        isCurrent: currentDay > p2End && currentDay <= p3End,
        totalTopics: allTopics.length,
        completedTopics: allTopics.filter(t => t.pyqStatus === 'completed').length
      },
      {
        phase: 'PHASE_4_REVISION_WEAKNESS',
        name: 'Phase 4 — Targeted Revision & Weakness Elimination',
        description: 'Spaced repetition cycles for low-accuracy topics and formula sheets.',
        startDay: p3End + 1,
        endDay: p4End,
        isCurrent: currentDay > p3End && currentDay <= p4End,
        totalTopics: allTopics.length,
        completedTopics: allTopics.filter(t => t.revisionLevel >= 3).length
      },
      {
        phase: 'PHASE_5_MOCKS_FINAL',
        name: 'Phase 5 — Full-Length Mocks & Speed Calibration',
        description: 'Simulated 3-hour CBT mock tests, virtual calculator mastery & exam stamina.',
        startDay: p4End + 1,
        endDay: p5End,
        isCurrent: currentDay > p4End,
        totalTopics: 15,
        completedTopics: Math.min(Math.floor(allCompleted / 2), 15)
      }
    ];

    return phases;
  }

  /**
   * Cleans corrupted or duplicated sleep/wind-down blocks from any stored plan.
   */
  static sanitizePlan(plan: DailyPlan): DailyPlan {
    const profile = StorageService.getProfile();
    const seenIds = new Set<string>();
    const cleanedBlocks: TimeBlock[] = [];

    plan.timeBlocks.forEach(b => {
      const cleanSub = this.cleanSubtitle(b.subtitle);
      const isSleepOrWindDown = b.id.startsWith('tb_sleep') || b.id.startsWith('tb_adaptive_winddown') || b.id.startsWith('tb_night_winddown') || b.title.includes('Sleep Target') || b.title.includes('Night Wind-Down');

      if (isSleepOrWindDown) {
        return; // Will be added as a single canonical winddown at the very end
      }

      const canonicalKey = b.topicId || b.dsaProblemId || b.id;
      if (!seenIds.has(canonicalKey) || b.isCompleted) {
        seenIds.add(canonicalKey);
        cleanedBlocks.push({
          ...b,
          subtitle: cleanSub
        });
      }
    });

    const targetSleep = plan.userChosenBedtime || profile.bedTime || '23:00';
    const [h, m] = targetSleep.split(':').map(Number);
    const sleepMin = (h || 0) * 60 + (m || 0);
    const windStartMin = sleepMin >= 20 ? sleepMin - 20 : (1440 + sleepMin - 20);

    const windStartH = Math.floor(windStartMin / 60) % 24;
    const windStartM = windStartMin % 60;

    // Append exactly ONE clean wind-down block
    cleanedBlocks.push({
      id: 'tb_night_winddown',
      startTime: `${windStartH.toString().padStart(2, '0')}:${windStartM.toString().padStart(2, '0')}`,
      endTime: targetSleep,
      title: 'Night Wind-Down & Rest Preparation',
      subtitle: `Screen dimming & reflection · Target bedtime: ${targetSleep}`,
      category: 'routine',
      durationMinutes: 20,
      isCompleted: false,
      priority: 'low'
    });

    return {
      ...plan,
      timeBlocks: cleanedBlocks,
      sleepConstraint: {
        targetSleepTime: targetSleep,
        isUserSelected: !!plan.userChosenBedtime,
        wakeTimeTomorrow: profile.wakeTime || '07:00'
      }
    };
  }

  /**
   * Deterministically generates or retrieves today's comprehensive plan.
   */
  static getOrCreateDailyPlan(dateStr: string): DailyPlan {
    const existing = StorageService.getDailyPlan(dateStr);
    if (existing) {
      return this.sanitizePlan(existing);
    }

    const profile = StorageService.getProfile();
    const syllabus = StorageService.getSyllabus();
    const { currentDay, totalDays } = this.getDayNumber(profile.startDate, dateStr);

    const dsaProblemIds = DsaEngine.selectDailyProblems(dateStr, profile.dsaDailyCount);
    const dueRevisions = RevisionEngine.getRevisionsDueOn(dateStr);
    const targetTopics = this.selectTopicsForDay(syllabus, currentDay, totalDays);
    const timeBlocks = this.generateTimeBlocks(targetTopics, dsaProblemIds, dueRevisions, profile);

    const defaultHabits: HealthHabitChecklist = {
      morningKickoffHydration: false,
      morningStretching: false,
      nutritiousBreakfast: false,
      studyBreaksTaken: 0,
      studyBreaksGoal: 4,
      midMorningEyeRest: false,
      excessiveSittingAvoided: false,
      healthyMeals: false,
      exerciseMinutes: 0,
      exerciseCompleted: false,
      hydrationGlasses: 0,
      hydrationGoalGlasses: 10,
      healthyDinner: false,
      nightWindDown: false,
      sleepHours: 0,
      sleepTargetAchieved: false
    };

    const newPlan: DailyPlan = {
      date: dateStr,
      dayNumber: currentDay,
      totalDays: totalDays,
      timeBlocks,
      dsaProblemIds,
      healthHabits: defaultHabits,
      isCompleted: false,
      actualStudyMinutes: 0,
      targetStudyMinutes: profile.dailyTargetStudyMinutes,
      dailyScore: 0,
      notes: '',
      userChosenBedtime: profile.bedTime || '23:00',
      recommendedBedtime: profile.bedTime || '23:00',
      sleepConstraint: {
        targetSleepTime: profile.bedTime || '23:00',
        isUserSelected: false,
        wakeTimeTomorrow: profile.wakeTime || '07:00'
      }
    };

    StorageService.saveDailyPlan(newPlan);
    return newPlan;
  }

  /**
   * Intelligently selects high-yield topics for today's study across all 11 sections.
   */
  private static selectTopicsForDay(syllabus: Subject[], currentDay: number, totalDays: number): Topic[] {
    const allTopics = syllabus.flatMap(s => s.topics);

    const inProgress = allTopics.filter(t => t.status === 'in_progress');
    const notStarted = allTopics.filter(t => t.status === 'not_started');

    notStarted.sort((a, b) => {
      const subA = syllabus.find(s => s.id === a.subjectId)?.weightage || 0;
      const subB = syllabus.find(s => s.id === b.subjectId)?.weightage || 0;
      if (subB !== subA) return subB - subA;
      return b.importance.localeCompare(a.importance);
    });

    const chosen: Topic[] = [];

    if (inProgress.length > 0) {
      chosen.push(inProgress[0]);
    }

    for (const t of notStarted) {
      if (chosen.length >= 3) break;
      if (!chosen.some(c => c.id === t.id)) {
        chosen.push(t);
      }
    }

    if (chosen.length === 0) {
      chosen.push(allTopics[0]);
    }

    return chosen;
  }

  /**
   * Generates standard initial timeblocks.
   */
  private static generateTimeBlocks(
    topics: Topic[],
    dsaIds: string[],
    revisions: { topicId: string; topicName: string; subjectName: string }[],
    profile: UserProfile
  ): TimeBlock[] {
    const blocks: TimeBlock[] = [];
    const dsaBank = StorageService.getDsaBank();
    const dsaProblems = dsaIds.map(id => dsaBank.find(p => p.id === id)).filter(Boolean);

    // 07:00 - 07:45 : Morning Routine & Movement
    blocks.push({
      id: 'tb_morning',
      startTime: '07:00',
      endTime: '07:45',
      title: 'Morning Routine & Movement',
      subtitle: '500ml water kickoff, 15m dynamic stretch, sun exposure & breakfast',
      category: 'routine',
      durationMinutes: 45,
      isCompleted: false,
      priority: 'medium'
    });

    // 08:00 - 09:30 : Morning Focus Block (Topic 1)
    if (topics[0]) {
      blocks.push({
        id: `tb_gate_${topics[0].id}`,
        startTime: '08:00',
        endTime: '09:30',
        title: `${topics[0].subjectName} — ${topics[0].name}`,
        subtitle: `Core Theory & Derivations (${topics[0].studyBreakdown ? topics[0].studyBreakdown.slice(0, 2).join(', ') : 'Concepts'})`,
        category: 'gate',
        topicId: topics[0].id,
        subjectId: topics[0].subjectId,
        durationMinutes: 90,
        isCompleted: false,
        priority: 'high'
      });
    }

    // 09:30 - 09:45 : Active Break (after 90m deep focus)
    blocks.push({
      id: 'tb_break_1',
      startTime: '09:30',
      endTime: '09:45',
      title: 'Active Cognitive Break & Posture Reset',
      subtitle: '20-20-20 eye rest, stand up & stretch, refill water bottle',
      category: 'break',
      durationMinutes: 15,
      isCompleted: false,
      priority: 'low'
    });

    // 09:45 - 11:00 : Topic 1 Practice / 26-Year PYQs
    if (topics[0]) {
      blocks.push({
        id: `tb_pyq_${topics[0].id}`,
        startTime: '09:45',
        endTime: '11:00',
        title: `GATE PYQ Drill (2000-2025) — ${topics[0].name}`,
        subtitle: 'Solve historical GATE conceptual questions & trap analysis',
        category: 'gate',
        topicId: topics[0].id,
        subjectId: topics[0].subjectId,
        durationMinutes: 75,
        isCompleted: false,
        priority: 'high'
      });
    }

    // 13:00 - 14:00 : Mindful Lunch
    blocks.push({
      id: 'tb_lunch',
      startTime: '13:00',
      endTime: '14:00',
      title: 'Mindful Lunch & Digital Detox',
      subtitle: 'Nutritious meal, screen-off for 30m, light walk',
      category: 'routine',
      durationMinutes: 60,
      isCompleted: false,
      priority: 'low'
    });

    // 17:30 - 18:45 : Daily DSA Practice
    const dsaTitles = dsaProblems.map(p => `${p?.title} (${p?.difficulty})`).join(', ');
    blocks.push({
      id: 'tb_dsa_session',
      startTime: '17:30',
      endTime: '18:45',
      title: 'Daily DSA Practice (3 Problems)',
      subtitle: dsaTitles || '3 Curated Algorithm Problems',
      category: 'dsa',
      durationMinutes: 75,
      isCompleted: false,
      priority: 'high'
    });

    // 18:45 - 19:45 : WHO Physical Activity
    blocks.push({
      id: 'tb_exercise',
      startTime: '18:45',
      endTime: '19:45',
      title: 'WHO Physical Activity & Exercise',
      subtitle: '30-45 min brisk walk, cycling, or bodyweight strength session',
      category: 'health',
      durationMinutes: 60,
      isCompleted: false,
      priority: 'medium'
    });

    // 20:30 - 21:45 : Evening Focus Block (Topic 2)
    if (topics[1]) {
      blocks.push({
        id: `tb_gate_${topics[1].id}`,
        startTime: '20:30',
        endTime: '21:45',
        title: `${topics[1].subjectName} — ${topics[1].name}`,
        subtitle: `In-depth concepts & problem solving`,
        category: 'gate',
        topicId: topics[1].id,
        subjectId: topics[1].subjectId,
        durationMinutes: 75,
        isCompleted: false,
        priority: 'high'
      });
    }

    // 21:45 - 22:30 : Spaced Repetition / Daily Review
    const revSubtitle = revisions.length > 0
      ? `Spaced review of: ${revisions.map(r => r.topicName).join(', ')}`
      : 'Review day formula sheets & error notebook';
    blocks.push({
      id: 'tb_revision',
      startTime: '21:45',
      endTime: '22:30',
      title: 'Automated Spaced Revision & Consolidation',
      subtitle: revSubtitle,
      category: 'revision',
      durationMinutes: 45,
      isCompleted: false,
      priority: 'medium'
    });

    // 22:40 - 23:00 : Wind-down before Sleep Deadline
    blocks.push({
      id: 'tb_night_winddown',
      startTime: '22:40',
      endTime: '23:00',
      title: 'Night Wind-Down & Rest Preparation',
      subtitle: 'Screen dimming, hydration & desk prep for tomorrow',
      category: 'routine',
      durationMinutes: 20,
      isCompleted: false,
      priority: 'low'
    });

    return blocks;
  }

  /**
   * Constructs the complete canonical daily workload catalog for today.
   * Sizes tasks with realistic, natural deep-work durations rather than artificially short blocks.
   */
  private static getFullDailyWorkloadCandidates(
    dateStr: string,
    completedBlocks: TimeBlock[],
    existingUncompleted: TimeBlock[],
    startMinutesTotal: number
  ): TimeBlock[] {
    const profile = StorageService.getProfile();
    const syllabus = StorageService.getSyllabus();
    const { currentDay, totalDays } = this.getDayNumber(profile.startDate, dateStr);

    const targetTopics = this.selectTopicsForDay(syllabus, currentDay, totalDays);
    const dsaIds = DsaEngine.selectDailyProblems(dateStr, profile.dsaDailyCount);
    const dsaBank = StorageService.getDsaBank();
    const dsaProblems = dsaIds.map(id => dsaBank.find(p => p.id === id)).filter(Boolean);
    const dueRevisions = RevisionEngine.getRevisionsDueOn(dateStr);

    const candidates: TimeBlock[] = [];
    const completedTopicIds = new Set(completedBlocks.map(b => b.topicId).filter(Boolean));

    // 1. Topic 1 Core Deep Study Focus (Theory, Proofs & Key Derivations)
    if (targetTopics[0] && !completedTopicIds.has(targetTopics[0].id)) {
      candidates.push({
        id: `tb_gate_${targetTopics[0].id}`,
        startTime: '00:00',
        endTime: '00:00',
        title: `${targetTopics[0].subjectName} — ${targetTopics[0].name}`,
        subtitle: `Deep Concept Study & Derivations (${targetTopics[0].studyBreakdown ? targetTopics[0].studyBreakdown.slice(0, 2).join(', ') : 'Concepts'})`,
        category: 'gate',
        topicId: targetTopics[0].id,
        subjectId: targetTopics[0].subjectId,
        durationMinutes: 70, // Realistic deep study allocation
        isCompleted: false,
        priority: 'high'
      });

      // 2. Topic 1 Historical PYQ Practice Drill
      candidates.push({
        id: `tb_pyq_${targetTopics[0].id}`,
        startTime: '00:00',
        endTime: '00:00',
        title: `GATE PYQ Drill (2000-2025) — ${targetTopics[0].name}`,
        subtitle: 'Solve verified historical GATE conceptual problems & trap analysis',
        category: 'gate',
        topicId: targetTopics[0].id,
        subjectId: targetTopics[0].subjectId,
        durationMinutes: 50, // Realistic problem solving drill
        isCompleted: false,
        priority: 'high'
      });
    }

    // 3. Daily DSA Practice Session (Realistic Time for Problem Solving)
    const isDsaCompleted = completedBlocks.some(b => b.category === 'dsa');
    if (!isDsaCompleted) {
      const dsaTitles = dsaProblems.map(p => `${p?.title} (${p?.difficulty})`).join(', ');
      // Sized realistically based on problem count (~20m per algorithmic problem)
      const dsaNaturalDuration = Math.max((dsaProblems.length || 3) * 20, 60);
      candidates.push({
        id: 'tb_dsa_session',
        startTime: '00:00',
        endTime: '00:00',
        title: `Daily DSA Practice (${dsaProblems.length || 3} Problems)`,
        subtitle: dsaTitles || '3 Curated Algorithm Problems',
        category: 'dsa',
        durationMinutes: dsaNaturalDuration,
        isCompleted: false,
        priority: 'high'
      });
    }

    // 4. Automated Spaced Revision & Consolidation
    const isRevisionCompleted = completedBlocks.some(b => b.category === 'revision');
    if (!isRevisionCompleted) {
      const revSubtitle = dueRevisions.length > 0
        ? `Spaced review of: ${dueRevisions.map(r => r.topicName).join(', ')}`
        : 'Review day formula sheets & active recall notebook';
      candidates.push({
        id: 'tb_revision',
        startTime: '00:00',
        endTime: '00:00',
        title: 'Automated Spaced Revision & Consolidation',
        subtitle: revSubtitle,
        category: 'revision',
        durationMinutes: 30, // Focused active recall
        isCompleted: false,
        priority: 'high'
      });
    }

    // 5. Topic 2 In-Depth Problem Solving
    if (targetTopics[1] && !completedTopicIds.has(targetTopics[1].id)) {
      candidates.push({
        id: `tb_gate_${targetTopics[1].id}`,
        startTime: '00:00',
        endTime: '00:00',
        title: `${targetTopics[1].subjectName} — ${targetTopics[1].name}`,
        subtitle: `In-depth concepts & problem solving`,
        category: 'gate',
        topicId: targetTopics[1].id,
        subjectId: targetTopics[1].subjectId,
        durationMinutes: 50,
        isCompleted: false,
        priority: 'medium'
      });
    }

    // 6. WHO Physical Activity & Exercise
    const isHealthCompleted = completedBlocks.some(b => b.category === 'health');
    if (!isHealthCompleted) {
      candidates.push({
        id: 'tb_exercise',
        startTime: '00:00',
        endTime: '00:00',
        title: 'WHO Physical Activity & Exercise',
        subtitle: '20-25 min brisk movement, dynamic stretching or postural reset',
        category: 'health',
        durationMinutes: 25,
        isCompleted: false,
        priority: 'medium'
      });
    }

    // Merge with any custom uncompleted tasks already in the plan
    const merged: TimeBlock[] = [];
    const seenKeys = new Set<string>();

    existingUncompleted.forEach(b => {
      const isMorningRoutine = b.id === 'tb_morning' || b.id === 'tb_lunch';
      if (isMorningRoutine && startMinutesTotal >= 720) return;

      const k = b.topicId || b.dsaProblemId || b.id;
      seenKeys.add(k);
      merged.push(b);
    });

    candidates.forEach(c => {
      const k = c.topicId || c.dsaProblemId || c.id;
      if (!seenKeys.has(k)) {
        seenKeys.add(k);
        merged.push(c);
      }
    });

    return merged;
  }

  // =========================================================================
  // SLEEP-DRIVEN ADAPTIVE DAILY SCHEDULING (HIGH-QUALITY DEEP WORK ENGINE)
  // =========================================================================

  /**
   * Dynamically calculates the RECOMMENDED sleep time based on actual state.
   */
  static calculateDynamicRecommendedBedtime(
    plan: DailyPlan,
    profile: UserProfile,
    currentTimeMinutes: number
  ): { recommendedTimeStr: string; recommendedMinutes: number; rationale: string } {
    const uncompletedProductive = plan.timeBlocks.filter(b => 
      !b.isCompleted && 
      !b.id.startsWith('tb_sleep') && 
      !b.id.startsWith('tb_night_winddown') &&
      !b.title.includes('Night Wind-Down')
    );
    const uncompletedWorkload = uncompletedProductive.reduce((sum, b) => sum + b.durationMinutes, 0);

    const [wakeH, wakeM] = (profile.wakeTime || '07:00').split(':').map(Number);
    const wakeTomorrowMinutes = (wakeH * 60 + wakeM) + 24 * 60;

    // Hard sleep protection constraint: at least 7.0 hours (420 min) of sleep
    const latestSafeBedtimeMinutes = wakeTomorrowMinutes - 420;

    const [stdH, stdM] = (profile.bedTime || '23:00').split(':').map(Number);
    const standardBedtimeMinutes = stdH * 60 + stdM;

    if (currentTimeMinutes <= standardBedtimeMinutes - uncompletedWorkload - 30) {
      return {
        recommendedTimeStr: profile.bedTime || '23:00',
        recommendedMinutes: standardBedtimeMinutes,
        rationale: 'Normal pace maintained. Full workload fits comfortably before standard bedtime.'
      };
    }

    const neededMinutes = Math.min(uncompletedWorkload || 180, 240) + 20;
    const dynamicallyCalculated = Math.min(
      Math.max(currentTimeMinutes + neededMinutes, standardBedtimeMinutes),
      latestSafeBedtimeMinutes
    );

    const bedH = Math.floor(dynamicallyCalculated / 60) % 24;
    const bedM = dynamicallyCalculated % 60;
    const formatted = `${bedH.toString().padStart(2, '0')}:${bedM.toString().padStart(2, '0')}`;

    return {
      recommendedTimeStr: formatted,
      recommendedMinutes: dynamicallyCalculated,
      rationale: `Adaptive pace: prioritizes deep GATE & DSA sessions while protecting >= 7h sleep before ${profile.wakeTime}.`
    };
  }

  /**
   * Deep-Work Scheduling & Intelligent Cognitive Break Placement:
   * Prioritizes DEPTH over task quantity.
   * Adopts realistic natural durations and groups compatible tasks (Theory + PYQs)
   * while deferring lower-priority tasks rather than excessively compressing everything into tiny fragments.
   */
  private static planBreaksAndStudyDurations(
    tasks: TimeBlock[],
    targetProductiveWindowMinutes: number
  ): {
    fittedTasks: TimeBlock[];
    allocatedDurations: number[];
    breakPlacements: { afterTaskIndex: number; durationMinutes: number; title: string; subtitle: string }[];
  } {
    if (tasks.length === 0) {
      return { fittedTasks: [], allocatedDurations: [], breakPlacements: [] };
    }

    // 1. Minimum useful deep-work durations per category
    const getMinUsefulDuration = (category: string, title: string): number => {
      if (category === 'gate') {
        return title.includes('PYQ') ? 35 : 45; // Core theory needs >= 45m; PYQs need >= 35m
      }
      if (category === 'dsa') return 45; // DSA needs realistic problem solving time
      if (category === 'revision') return 20; // Focused active recall
      if (category === 'health') return 20;
      return 20;
    };

    // 2. Cognitive threshold for breaks based on window size
    const cognitiveThreshold = targetProductiveWindowMinutes >= 180
      ? 65
      : (targetProductiveWindowMinutes >= 120 ? 75 : 85);

    const defaultBreakDuration = targetProductiveWindowMinutes >= 180
      ? 12
      : (targetProductiveWindowMinutes >= 120 ? 10 : 8);

    // 3. Select tasks by depth and value — avoid over-packing
    const fittedTasks: TimeBlock[] = [];
    const breakPlacements: { afterTaskIndex: number; durationMinutes: number; title: string; subtitle: string }[] = [];
    let accumulatedTime = 0;
    let accumulatedCognitiveLoad = 0;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const minDur = getMinUsefulDuration(task.category, task.title);

      // Check if adding this task would over-fragment the day
      // When time is limited, we prefer giving more time to fewer tasks
      if (accumulatedTime + minDur > targetProductiveWindowMinutes && fittedTasks.length > 0) {
        // Stop adding further tasks: preserve depth and defer remaining tasks!
        break;
      }

      fittedTasks.push(task);
      accumulatedTime += minDur;

      // Cognitive load tracking
      const cogWeight = (task.category === 'gate' || task.category === 'dsa')
        ? 1.0
        : (task.category === 'revision' ? 0.75 : 0.0);

      accumulatedCognitiveLoad += minDur * cogWeight;

      // Check if a recovery break should be placed after this task
      const isLastTask = i === tasks.length - 1;
      if (!isLastTask) {
        const nextTask = tasks[i + 1];
        const isCurrentPhysical = task.category === 'health' || task.category === 'routine';
        const isNextPhysical = nextTask.category === 'health' || nextTask.category === 'routine';
        const isNextSameTopic = Boolean(task.topicId && nextTask.topicId && task.topicId === nextTask.topicId);

        let shouldBreak = false;
        if (!isCurrentPhysical && !isNextPhysical) {
          if (isNextSameTopic) {
            // Keep related theory + PYQs contiguous unless continuous load exceeds 85m
            shouldBreak = accumulatedCognitiveLoad >= 85;
          } else {
            shouldBreak = accumulatedCognitiveLoad >= cognitiveThreshold;
          }
        }

        if (shouldBreak && accumulatedTime + defaultBreakDuration + 25 <= targetProductiveWindowMinutes) {
          const isDsaRecovery = task.category === 'dsa';
          breakPlacements.push({
            afterTaskIndex: fittedTasks.length - 1,
            durationMinutes: defaultBreakDuration,
            title: isDsaRecovery ? 'Mental Recovery & Hydration Break' : 'Active Cognitive Break & Posture Reset',
            subtitle: isDsaRecovery 
              ? 'Step away from screen, hydrate & resting eye scan' 
              : '20-20-20 eye rest, hydration refill & standing stretch'
          });

          accumulatedTime += defaultBreakDuration;
          accumulatedCognitiveLoad = 0;
        }
      }
    }

    if (fittedTasks.length === 0 && tasks.length > 0) {
      fittedTasks.push(tasks[0]);
    }

    // 4. Proportional Distribution to grant Deep, Realistic Focus Blocks
    const totalBreakMinutes = breakPlacements.reduce((sum, b) => sum + b.durationMinutes, 0);
    const totalStudyTimeAvailable = Math.max(targetProductiveWindowMinutes - totalBreakMinutes, 15);

    const baseFittedSum = fittedTasks.reduce((sum, t) => sum + t.durationMinutes, 0);
    const allocatedDurations: number[] = [];
    let allocatedSum = 0;

    fittedTasks.forEach((t, i) => {
      if (i === fittedTasks.length - 1) {
        // Final task takes the exact remaining study minutes to guarantee zero gap!
        allocatedDurations.push(Math.max(totalStudyTimeAvailable - allocatedSum, 15));
      } else {
        const prop = Math.round((t.durationMinutes / baseFittedSum) * totalStudyTimeAvailable);
        const minVal = getMinUsefulDuration(t.category, t.title);
        const clamped = Math.max(prop, minVal);
        allocatedDurations.push(clamped);
        allocatedSum += clamped;
      }
    });

    return { fittedTasks, allocatedDurations, breakPlacements };
  }

  /**
   * Gap-Free Adaptive Daily Scheduling with Intelligent Cognitive Breaks:
   * 1. Calculates the FULL available window from current time to selected sleep deadline.
   * 2. Retrieves ALL eligible uncompleted work for today (GATE, DSA, PYQ, Revisions, Health).
   * 3. Groups related tasks and places breaks based on continuous cognitive load rather than blindly after every task.
   * 4. Ends with exactly ONE wind-down block (15-20m) meeting the sleep deadline.
   */
  static adaptDailySchedule(
    dateStr: string,
    options: AdaptiveScheduleOptions = {}
  ): { updatedPlan: DailyPlan; report: AdaptiveScheduleReport } {
    const rawPlan = this.getOrCreateDailyPlan(dateStr);
    const profile = StorageService.getProfile();

    // 1. Current Start Time (in absolute minutes from 00:00)
    let startMinutesTotal: number;
    if (options.startTime) {
      const [sh, sm] = options.startTime.split(':').map(Number);
      startMinutesTotal = (sh || 0) * 60 + (sm || 0);
    } else {
      const now = new Date();
      startMinutesTotal = now.getHours() * 60 + Math.ceil(now.getMinutes() / 5) * 5;
    }

    // 2. Separate Completed Blocks
    const completedBlocks: TimeBlock[] = [];
    const existingUncompleted: TimeBlock[] = [];

    rawPlan.timeBlocks.forEach(b => {
      const isSleepOrWindDown = b.id.startsWith('tb_sleep') || b.id.startsWith('tb_night_winddown') || b.title.includes('Sleep Target') || b.title.includes('Night Wind-Down');
      const isBreak = b.category === 'break' || b.id.startsWith('tb_break') || b.title.includes('Cognitive Break') || b.title.includes('Recovery & Hydration');

      if (b.isCompleted) {
        completedBlocks.push({
          ...b,
          subtitle: this.cleanSubtitle(b.subtitle)
        });
        return;
      }

      if (!isSleepOrWindDown && !isBreak) {
        existingUncompleted.push({
          ...b,
          subtitle: this.cleanSubtitle(b.subtitle)
        });
      }
    });

    // 3. Determine Selected Sleep Deadline (Hard Constraint)
    const { recommendedTimeStr } = this.calculateDynamicRecommendedBedtime(
      rawPlan,
      profile,
      startMinutesTotal
    );

    const effectiveBedtimeStr = options.userChosenBedtime || rawPlan.userChosenBedtime || recommendedTimeStr;
    const [effH, effM] = effectiveBedtimeStr.split(':').map(Number);
    let effectiveBedtimeMinutes = (effH || 0) * 60 + (effM || 0);

    // Cross-midnight handling: e.g. start at 22:17 (1337m), bedtime 03:00 (180m -> 1620m)
    if (effectiveBedtimeMinutes <= startMinutesTotal) {
      effectiveBedtimeMinutes += 24 * 60; // add 24 hours
    }

    // Total gross minutes available until sleep
    const grossAvailableMinutes = Math.max(effectiveBedtimeMinutes - startMinutesTotal, 30);
    // Exactly 20 minutes reserved for wind-down right before sleep
    const windDownDuration = 20;
    const targetProductiveWindowMinutes = Math.max(grossAvailableMinutes - windDownDuration, 15);

    // 4. Retrieve Complete Workload Catalog for Today
    const availableCandidateTasks = this.getFullDailyWorkloadCandidates(
      dateStr,
      completedBlocks,
      existingUncompleted,
      startMinutesTotal
    );

    const priorityWeight: Record<string, number> = {
      revision: 4,
      gate: 3,
      dsa: 3,
      health: 2,
      routine: 1,
      break: 1
    };

    const sortedTasks = [...availableCandidateTasks].sort((a, b) => {
      const pDiff = (priorityWeight[b.category] || 1) - (priorityWeight[a.category] || 1);
      if (pDiff !== 0) return pDiff;
      return (b.priority === 'high' ? 2 : 1) - (a.priority === 'high' ? 2 : 1);
    });

    // 5. Intelligent Cognitive Break Planning & Duration Allocation
    const { fittedTasks, allocatedDurations, breakPlacements } = this.planBreaksAndStudyDurations(
      sortedTasks,
      targetProductiveWindowMinutes
    );

    // Map break placements by task index
    const breakMap = new Map<number, { durationMinutes: number; title: string; subtitle: string }>();
    breakPlacements.forEach(bp => breakMap.set(bp.afterTaskIndex, bp));

    // 6. Build the Gap-Free Schedule
    const newlyScheduledBlocks: TimeBlock[] = [];
    let cursorTime = startMinutesTotal;

    fittedTasks.forEach((task, i) => {
      const dur = allocatedDurations[i];
      const startH = Math.floor(cursorTime / 60) % 24;
      const startM = cursorTime % 60;
      const endTotal = cursorTime + dur;
      const endH = Math.floor(endTotal / 60) % 24;
      const endM = endTotal % 60;

      newlyScheduledBlocks.push({
        ...task,
        startTime: `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
        endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
        durationMinutes: dur,
        subtitle: this.cleanSubtitle(task.subtitle),
        isAdjusted: true
      });

      cursorTime = endTotal;

      // Check if an intelligent break was scheduled after this task
      const plannedBreak = breakMap.get(i);
      if (plannedBreak) {
        const breakDur = plannedBreak.durationMinutes;
        const bStartH = Math.floor(cursorTime / 60) % 24;
        const bStartM = cursorTime % 60;
        const bEndTotal = cursorTime + breakDur;
        const bEndH = Math.floor(bEndTotal / 60) % 24;
        const bEndM = bEndTotal % 60;

        newlyScheduledBlocks.push({
          id: `tb_break_after_${task.id}`,
          startTime: `${bStartH.toString().padStart(2, '0')}:${bStartM.toString().padStart(2, '0')}`,
          endTime: `${bEndH.toString().padStart(2, '0')}:${bEndM.toString().padStart(2, '0')}`,
          title: plannedBreak.title,
          subtitle: plannedBreak.subtitle,
          category: 'break',
          durationMinutes: breakDur,
          isCompleted: false,
          priority: 'low'
        });

        cursorTime = bEndTotal;
      }
    });

    // 7. Append EXACTLY ONE Wind-Down Block immediately following cursorTime to sleep deadline
    const windStartH = Math.floor(cursorTime / 60) % 24;
    const windStartM = cursorTime % 60;
    const windEndH = Math.floor(effectiveBedtimeMinutes / 60) % 24;
    const windEndM = effectiveBedtimeMinutes % 60;

    const windDownBlock: TimeBlock = {
      id: 'tb_night_winddown',
      startTime: `${windStartH.toString().padStart(2, '0')}:${windStartM.toString().padStart(2, '0')}`,
      endTime: `${windEndH.toString().padStart(2, '0')}:${windEndM.toString().padStart(2, '0')}`,
      title: 'Night Wind-Down & Rest Preparation',
      subtitle: `Screen dimming & reflection · Target bedtime: ${effectiveBedtimeStr}`,
      category: 'routine',
      durationMinutes: Math.max(effectiveBedtimeMinutes - cursorTime, 15),
      isCompleted: false,
      priority: 'low'
    };

    // Sequential composition: completed tasks in past order, followed by future adapted tasks
    const finalScheduleBlocks: TimeBlock[] = [
      ...completedBlocks,
      ...newlyScheduledBlocks,
      windDownBlock
    ];

    const startHStr = Math.floor(startMinutesTotal / 60).toString().padStart(2, '0');
    const startMStr = (startMinutesTotal % 60).toString().padStart(2, '0');
    const actualStartTimeStr = `${startHStr}:${startMStr}`;

    const scheduledStudyMinutes = finalScheduleBlocks
      .filter(b => b.category === 'gate' || b.category === 'dsa' || b.category === 'revision')
      .reduce((sum, b) => sum + b.durationMinutes, 0);

    const updatedPlan: DailyPlan = {
      ...rawPlan,
      timeBlocks: finalScheduleBlocks,
      userChosenBedtime: effectiveBedtimeStr,
      recommendedBedtime: recommendedTimeStr,
      isAdaptiveActive: true,
      sleepConstraint: {
        targetSleepTime: effectiveBedtimeStr,
        isUserSelected: !!options.userChosenBedtime,
        wakeTimeTomorrow: profile.wakeTime || '07:00'
      },
      notes: `Adaptive schedule generated for bedtime ${effectiveBedtimeStr}. Available window: ${formatMinutesToHours(grossAvailableMinutes)}.`
    };

    StorageService.saveDailyPlan(updatedPlan);

    const deferredCount = Math.max(sortedTasks.length - fittedTasks.length, 0);

    const report: AdaptiveScheduleReport = {
      originalPlannedMinutes: rawPlan.timeBlocks.reduce((sum, b) => sum + b.durationMinutes, 0),
      actualAvailableMinutes: grossAvailableMinutes,
      scheduledStudyMinutes,
      adaptiveStartTime: actualStartTimeStr,
      adaptiveBedtime: effectiveBedtimeStr,
      recommendedBedtime: recommendedTimeStr,
      retainedTasksCount: fittedTasks.length,
      deferredTasksCount: deferredCount,
      summaryMessage: `Schedule gap-free optimized from ${actualStartTimeStr} to ${effectiveBedtimeStr} (${formatMinutesToHours(scheduledStudyMinutes)} study time across ${fittedTasks.length} sessions).`,
      strategyApplied: `Utilized full ${formatMinutesToHours(grossAvailableMinutes)} available window before ${effectiveBedtimeStr}.`,
      isWorkloadExceeding: deferredCount > 0
    };

    return { updatedPlan, report };
  }
}
