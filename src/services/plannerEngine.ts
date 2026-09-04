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
   * Helper to identify canonical grouping key for deduplication.
   */
  static getCanonicalBlockKey(block: TimeBlock): string {
    const titleLower = block.title.toLowerCase();
    const idLower = block.id.toLowerCase();

    // 1. Kickoff routine
    if (
      idLower.includes('kickoff') ||
      idLower.includes('morning_routine') ||
      titleLower.includes('kickoff') ||
      titleLower.includes('wake-up') ||
      titleLower.includes('morning routine')
    ) {
      return 'canonical_kickoff';
    }

    // 2. Sleep / Wind-Down
    if (
      idLower.startsWith('tb_sleep') ||
      idLower.startsWith('tb_adaptive_winddown') ||
      idLower.startsWith('tb_night_winddown') ||
      titleLower.includes('sleep target') ||
      titleLower.includes('night wind-down')
    ) {
      return 'canonical_night_winddown';
    }

    // 3. Landmark Meals
    if (idLower === 'tb_breakfast' || titleLower.includes('breakfast')) return 'canonical_breakfast';
    if (idLower === 'tb_lunch_landmark' || titleLower.includes('mindful indian lunch') || titleLower.includes('lunch landmark') || titleLower.includes('lunch fuel')) return 'canonical_lunch';
    if (idLower === 'tb_chai_landmark' || titleLower.includes('evening chai') || titleLower.includes('chai landmark')) return 'canonical_chai';
    if (idLower === 'tb_dinner_landmark' || titleLower.includes('dinner & digestion') || titleLower.includes('dinner landmark')) return 'canonical_dinner';

    // 4. DSA Session
    if (block.category === 'dsa' || idLower.includes('dsa') || titleLower.includes('dsa practice')) return 'canonical_dsa';

    // 5. High-Yield Drill
    if (idLower.includes('high_yield_drill') || titleLower.includes('accuracy & speed drill')) return 'canonical_high_yield_drill';

    // 6. Health & Movement
    if (idLower.includes('exercise') || titleLower.includes('physical activity') || (block.category === 'health' && !titleLower.includes('water'))) return 'canonical_exercise';

    // 7. Spaced Revision
    if (block.category === 'revision' || idLower.includes('revision') || titleLower.includes('spaced revision')) return 'canonical_revision';

    // 8. Specific GATE Topic / PYQ
    if (block.topicId) {
      const isPyq = idLower.startsWith('tb_pyq') || titleLower.includes('pyq');
      return isPyq ? `canonical_pyq_${block.topicId}` : `canonical_gate_${block.topicId}`;
    }

    // 9. Match by title if similar topic
    if (block.category === 'gate') {
      const cleanTitle = block.title.replace(/—.*$/, '').trim().toLowerCase();
      if (cleanTitle) return `canonical_gate_title_${cleanTitle}`;
    }

    return block.id;
  }

  /**
   * Cleans corrupted or duplicated sleep/wind-down or duplicate kickoff blocks from any stored plan.
   */
  static sanitizePlan(plan: DailyPlan): DailyPlan {
    const profile = StorageService.getProfile();

    // Group blocks by canonical key
    const groups = new Map<string, TimeBlock[]>();
    for (const b of plan.timeBlocks) {
      const isSleep =
        b.id.startsWith('tb_sleep') ||
        b.id.startsWith('tb_adaptive_winddown') ||
        b.id.startsWith('tb_night_winddown') ||
        b.title.includes('Sleep Target') ||
        b.title.includes('Night Wind-Down');

      if (isSleep) continue; // Single canonical wind-down will be appended at the end

      const key = this.getCanonicalBlockKey(b);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(b);
    }

    const deduplicatedBlocks: TimeBlock[] = [];

    groups.forEach((blocks) => {
      // If any block in the group is completed, keep ONLY the earliest completed one
      const completedInstances = blocks.filter(b => b.isCompleted);
      if (completedInstances.length > 0) {
        completedInstances.sort((a, b) => {
          const [ah, am] = a.startTime.split(':').map(Number);
          const [bh, bm] = b.startTime.split(':').map(Number);
          return ((ah || 0) * 60 + (am || 0)) - ((bh || 0) * 60 + (bm || 0));
        });
        const canonicalInstance = {
          ...completedInstances[0],
          subtitle: this.cleanSubtitle(completedInstances[0].subtitle)
        };
        deduplicatedBlocks.push(canonicalInstance);
      } else {
        // None is completed: keep the first instance
        const canonicalInstance = {
          ...blocks[0],
          subtitle: this.cleanSubtitle(blocks[0].subtitle)
        };
        deduplicatedBlocks.push(canonicalInstance);
      }
    });

    // Special Kickoff check:
    // If there is ANY kickoff block kept, but there are other completed study tasks and the kickoff is uncompleted,
    // discard the uncompleted kickoff if it's already mid-day!
    const kickoffIdx = deduplicatedBlocks.findIndex(b => this.getCanonicalBlockKey(b) === 'canonical_kickoff');
    if (kickoffIdx !== -1) {
      const kickoffBlock = deduplicatedBlocks[kickoffIdx];
      const hasOtherCompleted = deduplicatedBlocks.some(b => b.isCompleted && b !== kickoffBlock);
      if (!kickoffBlock.isCompleted && hasOtherCompleted) {
        deduplicatedBlocks.splice(kickoffIdx, 1);
      }
    }

    const targetSleep = plan.userChosenBedtime || profile.bedTime || '23:00';
    const [h, m] = targetSleep.split(':').map(Number);
    const sleepMin = (h || 0) * 60 + (m || 0);
    const windStartMin = sleepMin >= 20 ? sleepMin - 20 : (1440 + sleepMin - 20);

    const windStartH = Math.floor(windStartMin / 60) % 24;
    const windStartM = windStartMin % 60;

    // Append exactly ONE clean wind-down block
    deduplicatedBlocks.push({
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

    // Sort timeblocks chronologically
    deduplicatedBlocks.sort((a, b) => {
      const [ah, am] = a.startTime.split(':').map(Number);
      const [bh, bm] = b.startTime.split(':').map(Number);
      return ((ah || 0) * 60 + (am || 0)) - ((bh || 0) * 60 + (bm || 0));
    });

    const accurateCompletedStudyMin = deduplicatedBlocks
      .filter(b => (b.category === 'gate' || b.category === 'dsa' || b.category === 'revision') && b.isCompleted)
      .reduce((sum, b) => sum + b.durationMinutes, 0);

    const sanitizedPlan: DailyPlan = {
      ...plan,
      timeBlocks: deduplicatedBlocks,
      actualStudyMinutes: accurateCompletedStudyMin,
      sleepConstraint: {
        targetSleepTime: targetSleep,
        isUserSelected: !!plan.userChosenBedtime,
        wakeTimeTomorrow: profile.wakeTime || '07:00'
      }
    };

    StorageService.saveDailyPlan(sanitizedPlan);
    return sanitizedPlan;
  }

  /**
   * Deterministically generates or retrieves today's comprehensive plan.
  /**
   * Formats total minutes from midnight into 24-hour HH:MM format.
   */
  static formatMinutesToTimeString(min: number): string {
    const h = Math.floor(min / 60) % 24;
    const m = min % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Generates actionable, zero-guilt, step-by-step guidance immediately upon waking up.
   */
  static getWakeUpProtocol(
    wakeTimeMinutes: number,
    availableMinutes: number,
    outputMode: 'maximum' | 'balanced' | 'accelerated' = 'maximum'
  ): {
    wakeTime: string;
    headline: string;
    mindsetMessage: string;
    immediateSteps: { stepNumber: number; timeframe: string; title: string; action: string; category: 'hydration' | 'nutrition' | 'mindset' | 'focus' }[];
    mealRecommendation: string;
    projectedStudyHours: number;
  } {
    const wakeTimeStr = this.formatMinutesToTimeString(wakeTimeMinutes);
    const studyRatio = outputMode === 'maximum' ? 0.76 : (outputMode === 'accelerated' ? 0.82 : 0.65);
    const studyMins = Math.round(Math.max(availableMinutes - 60, 30) * studyRatio);
    const projectedStudyHours = Math.max(Math.round((studyMins / 60) * 10) / 10, 2.0);

    if (wakeTimeMinutes >= 11 * 60 + 30 && wakeTimeMinutes <= 15 * 60 + 30) {
      // Afternoon Wake-Up (e.g. 1:00 PM)
      const lunchEndMin = wakeTimeMinutes + 25;
      const lunchEndStr = this.formatMinutesToTimeString(lunchEndMin);

      return {
        wakeTime: wakeTimeStr,
        headline: `Afternoon Wake-Up Protocol (${wakeTimeStr})`,
        mindsetMessage: `Zero morning guilt! You still have ~${formatMinutesToHours(availableMinutes)} of high-energy wakefulness. Your optimized schedule below delivers ${projectedStudyHours}h of pure GATE & DSA deep work before bedtime.`,
        mealRecommendation: `Have a clean Indian lunch now (${wakeTimeStr} – ${lunchEndStr}) to fuel your brain with glucose without food-coma heaviness. Evening tea is at 05:30 PM and dinner at 08:45 PM.`,
        projectedStudyHours,
        immediateSteps: [
          {
            stepNumber: 1,
            timeframe: '0 - 5 min',
            title: 'Instant 500ml Hydration & Bright Light',
            action: 'Chug 500ml water immediately. Splash cold water on your face and open curtains/bright daylight to clear sleep inertia and reset mental alertness.',
            category: 'hydration'
          },
          {
            stepNumber: 2,
            timeframe: '5 - 25 min',
            title: 'Nutritious Indian Lunch / Energy Fuel',
            action: 'Eat a clean, protein-rich meal (dal, roti/rice, curd/paneer/eggs). Avoid heavy deep-fried foods to stay mentally razor-sharp.',
            category: 'nutrition'
          },
          {
            stepNumber: 3,
            timeframe: '25 - 30 min',
            title: 'Zero-Guilt Mindset & Desk Clearing',
            action: 'Put smartphone on Do Not Disturb. Clear your study desk, open your target GATE syllabus section, and set your focus timer.',
            category: 'mindset'
          },
          {
            stepNumber: 4,
            timeframe: 'Immediate',
            title: 'Launch Deep Focus Block 1 (GATE Core Theory)',
            action: 'Jump straight into your primary engineering subject’s core proofs and key derivations while wakefulness is peaking!',
            category: 'focus'
          }
        ]
      };
    } else if (wakeTimeMinutes < 11 * 60 + 30) {
      // Morning Wake-Up (e.g. 7:00 AM)
      return {
        wakeTime: wakeTimeStr,
        headline: `Morning Fresh Kickoff (${wakeTimeStr})`,
        mindsetMessage: `Great start! You have an expansive ${formatMinutesToHours(availableMinutes)} window ahead. Capitalize on quiet morning hours for peak conceptual clarity and deep problem solving.`,
        mealRecommendation: `500ml water now, energizing breakfast at 08:30 AM, Indian lunch at 01:30 PM, evening chai at 05:30 PM, and dinner at 08:45 PM.`,
        projectedStudyHours,
        immediateSteps: [
          {
            stepNumber: 1,
            timeframe: '0 - 10 min',
            title: 'Morning 500ml Water Kickoff & Movement',
            action: 'Hydrate with 500ml water. 5-10 min dynamic stretching and natural sun exposure to stimulate nervous system alertness.',
            category: 'hydration'
          },
          {
            stepNumber: 2,
            timeframe: '10 - 30 min',
            title: 'Wholesome Breakfast & Focus Preparation',
            action: 'Nutritious breakfast + warm beverage. Review today’s high-yield section breakdown.',
            category: 'nutrition'
          },
          {
            stepNumber: 3,
            timeframe: '30 - 35 min',
            title: 'Distraction-Free Desk Alignment',
            action: 'Arrange notebook, rough scratch pad, GATE virtual calculator reference, and silence all notifications.',
            category: 'mindset'
          },
          {
            stepNumber: 4,
            timeframe: 'Immediate',
            title: 'Launch Morning GATE Deep Work Block',
            action: 'Dive straight into your core subject’s highest-weightage concepts and theoretical foundations.',
            category: 'focus'
          }
        ]
      };
    } else {
      // Evening / Night Owl Wake-Up (after 3:30 PM)
      return {
        wakeTime: wakeTimeStr,
        headline: `Night Owl High-Yield Kickoff (${wakeTimeStr})`,
        mindsetMessage: `Night focus cycle activated! Leverage uninterrupted evening and midnight hours to achieve ${projectedStudyHours}h of pure GATE mastery.`,
        mealRecommendation: `Start with a quick protein snack and tea now, followed by an energizing Indian dinner at 08:45 PM.`,
        projectedStudyHours,
        immediateSteps: [
          {
            stepNumber: 1,
            timeframe: '0 - 10 min',
            title: 'Cold Water Splash & 500ml Hydration',
            action: 'Splash cold water on face and drink 500ml water to reset body temperature and trigger mental alertness.',
            category: 'hydration'
          },
          {
            stepNumber: 2,
            timeframe: '10 - 25 min',
            title: 'Quick Protein Fuel & Evening Tea',
            action: 'Light snack + tea/warm beverage to activate cognitive processing.',
            category: 'nutrition'
          },
          {
            stepNumber: 3,
            timeframe: '25 - 30 min',
            title: 'Night Desk Preparation & Goal Setting',
            action: 'Turn on good study lighting, queue up syllabus topics, and eliminate social media tabs.',
            category: 'mindset'
          },
          {
            stepNumber: 4,
            timeframe: 'Immediate',
            title: 'Launch Deep Sprint 1',
            action: 'Tackle the most demanding GATE engineering concepts first before midnight!',
            category: 'focus'
          }
        ]
      };
    }
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
    const [wakeH, wakeM] = (profile.wakeTime || '07:00').split(':').map(Number);
    const startMinutesTotal = (wakeH || 7) * 60 + (wakeM || 0);

    const { updatedPlan } = this.generateMaximumOutputSchedule(dateStr, startMinutesTotal, {
      startTime: profile.wakeTime || '07:00',
      userChosenBedtime: profile.bedTime || '23:00',
      outputMode: 'maximum'
    });

    return updatedPlan;
  }

  /**
   * Intelligently selects high-yield topics for today's study across all 11 sections.
   * Prioritizes in-progress topics with unfinished chapters so no topic is ever missed.
   */
  private static selectTopicsForDay(syllabus: Subject[], currentDay: number, totalDays: number): Topic[] {
    const allTopics = syllabus.flatMap(s => s.topics);

    // Topics that have pending incomplete chapters are top priority carryovers
    const inProgress = allTopics.filter(
      t => t.status === 'in_progress' || (t.completedTasks && t.completedTasks.length > 0 && t.status !== 'completed')
    );
    const notStarted = allTopics.filter(
      t => t.status === 'not_started' && (!t.completedTasks || t.completedTasks.length === 0)
    );

    notStarted.sort((a, b) => {
      const subA = syllabus.find(s => s.id === a.subjectId)?.weightage || 0;
      const subB = syllabus.find(s => s.id === b.subjectId)?.weightage || 0;
      if (subB !== subA) return subB - subA;
      return b.importance.localeCompare(a.importance);
    });

    const chosen: Topic[] = [];

    // Prioritize all in-progress / incomplete topics first so scheduler never misses them
    for (const p of inProgress) {
      if (chosen.length >= 3) break;
      chosen.push(p);
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
   * Helper to inspect pending vs completed chapters for a topic.
   */
  static getTopicChapterBreakdown(topic: Topic): { completed: string[]; remaining: string[]; total: number; percent: number } {
    const allChapters = topic.studyBreakdown || topic.subtopics || [];
    const completed = topic.completedTasks || [];
    const remaining = allChapters.filter(c => !completed.includes(c));
    const total = Math.max(allChapters.length, 1);
    const percent = Math.min(Math.round((completed.length / total) * 100), 100);
    return { completed, remaining, total, percent };
  }

  /**
   * Constructs the strict, high-yield daily workload catalog for today.
   * Day study tasks (Theory, PYQ, DSA, Problem Solving) are prioritized first.
   * Revisions are strictly positioned for the final night block.
   */
  private static getFullDailyWorkloadCandidates(
    dateStr: string,
    completedBlocks: TimeBlock[]
  ): { dayStudyTasks: TimeBlock[]; nightRevisionTask: TimeBlock } {
    const profile = StorageService.getProfile();
    const syllabus = StorageService.getSyllabus();
    const { currentDay, totalDays } = this.getDayNumber(profile.startDate, dateStr);

    const targetTopics = this.selectTopicsForDay(syllabus, currentDay, totalDays);
    const dsaIds = DsaEngine.selectDailyProblems(dateStr, profile.dsaDailyCount);
    const dsaBank = StorageService.getDsaBank();
    const dsaProblems = dsaIds.map(id => dsaBank.find(p => p.id === id)).filter(Boolean);
    const dueRevisions = RevisionEngine.getRevisionsDueOn(dateStr);

    const dayStudyTasks: TimeBlock[] = [];
    const completedBlockIds = new Set(completedBlocks.map(b => b.id));

    // 1. Topic 1 Core Deep Study Focus (Theory, Proofs & Key Derivations)
    if (targetTopics[0]) {
      const topic1GateId = `tb_gate_${targetTopics[0].id}`;
      const topic1PyqId = `tb_pyq_${targetTopics[0].id}`;
      const t1Breakdown = this.getTopicChapterBreakdown(targetTopics[0]);
      const isCarryover = t1Breakdown.completed.length > 0 && t1Breakdown.remaining.length > 0;
      
      const t1Subtitle = isCarryover
        ? `Carryover chapters (${t1Breakdown.completed.length}/${t1Breakdown.total} done): ${t1Breakdown.remaining.slice(0, 2).join(', ')}`
        : `Core Concept Mastery & Proofs (${t1Breakdown.remaining.slice(0, 2).join(', ') || 'Key Concepts'})`;

      if (!completedBlockIds.has(topic1GateId)) {
        dayStudyTasks.push({
          id: topic1GateId,
          startTime: '00:00',
          endTime: '00:00',
          title: `${targetTopics[0].subjectName} — ${targetTopics[0].name}`,
          subtitle: t1Subtitle,
          category: 'gate',
          topicId: targetTopics[0].id,
          subjectId: targetTopics[0].subjectId,
          durationMinutes: 120, // Continuous deep focus block
          isCompleted: false,
          priority: 'high'
        });
      }

      // 2. Topic 1 Historical PYQ Practice Drill (2000-2025)
      if (!completedBlockIds.has(topic1PyqId)) {
        dayStudyTasks.push({
          id: topic1PyqId,
          startTime: '00:00',
          endTime: '00:00',
          title: `GATE PYQ Drill (2000-2025) — ${targetTopics[0].name}`,
          subtitle: `Solve verified historical GATE problems on ${targetTopics[0].name}`,
          category: 'gate',
          topicId: targetTopics[0].id,
          subjectId: targetTopics[0].subjectId,
          durationMinutes: 80, // High-intensity problem drill
          isCompleted: false,
          priority: 'high'
        });
      }
    }

    // 3. Daily DSA Practice Session (3 Curated Problems)
    const isDsaCompleted = completedBlocks.some(b => b.category === 'dsa');
    if (!isDsaCompleted) {
      const dsaTitles = dsaProblems.map(p => `${p?.title} (${p?.difficulty})`).join(', ');
      dayStudyTasks.push({
        id: 'tb_dsa_session',
        startTime: '00:00',
        endTime: '00:00',
        title: `Daily DSA Practice (${dsaProblems.length || 3} Problems)`,
        subtitle: dsaTitles || '3 Curated Algorithm Problems',
        category: 'dsa',
        durationMinutes: 60, // Focused algorithm implementation
        isCompleted: false,
        priority: 'high'
      });
    }

    // 4. Topic 2 In-Depth Problem Solving & Study
    if (targetTopics[1]) {
      const topic2GateId = `tb_gate_${targetTopics[1].id}`;
      const t2Breakdown = this.getTopicChapterBreakdown(targetTopics[1]);
      const isCarryover2 = t2Breakdown.completed.length > 0 && t2Breakdown.remaining.length > 0;
      
      const t2Subtitle = isCarryover2
        ? `Pending chapters (${t2Breakdown.completed.length}/${t2Breakdown.total} done): ${t2Breakdown.remaining.slice(0, 2).join(', ')}`
        : `In-depth concepts & problem solving (${t2Breakdown.remaining.slice(0, 2).join(', ') || 'Practice'})`;

      if (!completedBlockIds.has(topic2GateId)) {
        dayStudyTasks.push({
          id: topic2GateId,
          startTime: '00:00',
          endTime: '00:00',
          title: `${targetTopics[1].subjectName} — ${targetTopics[1].name}`,
          subtitle: t2Subtitle,
          category: 'gate',
          topicId: targetTopics[1].id,
          subjectId: targetTopics[1].subjectId,
          durationMinutes: 95,
          isCompleted: false,
          priority: 'high'
        });
      }
    }

    // 5. High-Yield Practice / Speed Drill Sprint
    if (!completedBlockIds.has('tb_high_yield_drill')) {
      dayStudyTasks.push({
        id: 'tb_high_yield_drill',
        startTime: '00:00',
        endTime: '00:00',
        title: 'GATE High-Yield Accuracy & Speed Drill',
        subtitle: 'Timer-based MSQ/NAT accuracy calibration & shortcut mastery',
        category: 'gate',
        durationMinutes: 75,
        isCompleted: false,
        priority: 'high'
      });
    }

    // 6. WHO Physical Activity & Movement (Optional early evening)
    const isHealthCompleted = completedBlocks.some(b => b.category === 'health' || b.id === 'tb_exercise');
    if (!isHealthCompleted) {
      dayStudyTasks.push({
        id: 'tb_exercise',
        startTime: '00:00',
        endTime: '00:00',
        title: 'WHO Physical Activity & Movement',
        subtitle: '20-25 min brisk walk, dynamic stretch or postural reset',
        category: 'health',
        durationMinutes: 25,
        isCompleted: false,
        priority: 'medium'
      });
    }

    // 7. STRICT END-OF-DAY REVISION (ALWAYS NIGHT ONLY!)
    const allTopics = syllabus.flatMap(s => s.topics);
    const completedTopics = allTopics.filter(t => t.status === 'completed');
    const hasCompletedTopics = completedTopics.length > 0;

    const revSubtitle = dueRevisions.length > 0
      ? `Spaced review of: ${dueRevisions.map(r => r.topicName).join(', ')}`
      : (hasCompletedTopics
        ? 'Active recall of completed chapters & error notebook'
        : 'Night consolidation of today’s formulas, proofs & derivations');

    const nightRevisionTask: TimeBlock = {
      id: 'tb_revision',
      startTime: '00:00',
      endTime: '00:00',
      title: 'End-of-Day Spaced Revision & Formula Consolidation',
      subtitle: revSubtitle,
      category: 'revision',
      durationMinutes: 45,
      isCompleted: false,
      priority: 'high'
    };

    return { dayStudyTasks, nightRevisionTask };
  }

  /**
   * Dynamically calculates the RECOMMENDED sleep time based on actual state.
   */
  static calculateDynamicRecommendedBedtime(
    plan: DailyPlan,
    profile: UserProfile,
    currentTimeMinutes: number
  ): { recommendedTimeStr: string; recommendedMinutes: number; rationale: string } {
    const [wakeH, wakeM] = (profile.wakeTime || '07:00').split(':').map(Number);
    const wakeTomorrowMinutes = (wakeH * 60 + wakeM) + 24 * 60;

    // Hard sleep protection constraint: at least 7.0 hours (420 min) of sleep
    const latestSafeBedtimeMinutes = wakeTomorrowMinutes - 420;

    const [stdH, stdM] = (profile.bedTime || '23:00').split(':').map(Number);
    let standardBedtimeMinutes = stdH * 60 + stdM;
    if (standardBedtimeMinutes <= currentTimeMinutes && standardBedtimeMinutes < 720) {
      standardBedtimeMinutes += 24 * 60;
    }

    if (currentTimeMinutes <= standardBedtimeMinutes - 180) {
      return {
        recommendedTimeStr: profile.bedTime || '23:00',
        recommendedMinutes: standardBedtimeMinutes,
        rationale: `Standard pace maintained. Full high-yield study fits cleanly before ${profile.bedTime || '23:00'}.`
      };
    }

    const dynamicallyCalculated = Math.min(
      Math.max(currentTimeMinutes + 240, standardBedtimeMinutes),
      latestSafeBedtimeMinutes
    );

    const formatted = this.formatMinutesToTimeString(dynamicallyCalculated);

    return {
      recommendedTimeStr: formatted,
      recommendedMinutes: dynamicallyCalculated,
      rationale: `Adaptive schedule: maximizes GATE & DSA output while protecting >= 7h sleep before ${profile.wakeTime}.`
    };
  }

  /**
   * STRICT MAXIMUM OUTPUT SCHEDULING ENGINE WITH INDIAN STANDARD MEALS:
   * 1. Sets up immediate wake-up kickoff / lunch block (tailored to wake time).
   * 2. Places continuous, massive deep-work study blocks without spam breaks.
   * 3. Inserts Indian Landmark Meals at standard times (Lunch 1:30 PM, Chai 5:30 PM, Dinner 8:45 PM).
   * 4. Places Spaced Revision STRICTLY AT THE END OF THE NIGHT before sleep.
   * 5. Guarantees 8+ hours of pure, disciplined study.
   */
  static generateMaximumOutputSchedule(
    dateStr: string,
    startMinutesTotal: number,
    options: AdaptiveScheduleOptions = {}
  ): { updatedPlan: DailyPlan; report: AdaptiveScheduleReport } {
    const rawPlan = this.sanitizePlan(StorageService.getDailyPlan(dateStr) || {
      date: dateStr,
      dayNumber: 1,
      totalDays: 158,
      timeBlocks: [],
      dsaProblemIds: [],
      healthHabits: {
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
      },
      isCompleted: false,
      actualStudyMinutes: 0,
      targetStudyMinutes: 240,
      dailyScore: 0,
      notes: ''
    });

    const profile = StorageService.getProfile();
    const outputMode = options.outputMode || rawPlan.outputMode || 'maximum';

    // 1. Determine Effective Bedtime (Constraint)
    const { recommendedTimeStr } = this.calculateDynamicRecommendedBedtime(
      rawPlan,
      profile,
      startMinutesTotal
    );

    const effectiveBedtimeStr = options.userChosenBedtime || rawPlan.userChosenBedtime || recommendedTimeStr;
    const [effH, effM] = effectiveBedtimeStr.split(':').map(Number);
    let effectiveBedtimeMinutes = (effH || 0) * 60 + (effM || 0);

    if (effectiveBedtimeMinutes <= startMinutesTotal) {
      effectiveBedtimeMinutes += 24 * 60; // Crosses midnight
    }

    const grossAvailableMinutes = Math.max(effectiveBedtimeMinutes - startMinutesTotal, 45);

    // 2. Generate Immediate Wake-Up Protocol
    const wakeUpProtocol = this.getWakeUpProtocol(startMinutesTotal, grossAvailableMinutes, outputMode);

    // 3. Separate Completed Blocks
    const completedBlocks: TimeBlock[] = rawPlan.timeBlocks.filter(b => b.isCompleted).map(b => ({
      ...b,
      subtitle: this.cleanSubtitle(b.subtitle)
    }));

    const completedBlockIds = new Set(completedBlocks.map(b => b.id));

    const isKickoffBlock = (b: TimeBlock) =>
      b.id.includes('kickoff') ||
      b.id.includes('morning_routine') ||
      b.title.toLowerCase().includes('kickoff') ||
      b.title.toLowerCase().includes('wake-up');

    const hasCompletedKickoff = completedBlocks.some(isKickoffBlock);
    const hasAnyCompletedTasks = completedBlocks.length > 0;

    // A kickoff block should ONLY be generated if:
    // 1. Explicitly requested as a wake-up schedule (options.isWakeUp === true), OR fresh schedule with no completed tasks
    // AND 2. The user has not already completed a kickoff block
    const shouldIncludeKickoff =
      !hasCompletedKickoff &&
      (options.isWakeUp === true ||
        (options.isWakeUp === undefined && !hasAnyCompletedTasks && startMinutesTotal <= 10 * 60));

    // 4. Retrieve Full Workload Candidates (Separating Day Study from Night Revision)
    const { dayStudyTasks, nightRevisionTask } = this.getFullDailyWorkloadCandidates(
      dateStr,
      completedBlocks
    );

    // 5. Structure Routine Landmarks (Indian Meals & Breaks)
    const newlyScheduledBlocks: TimeBlock[] = [];
    let cursorTime = startMinutesTotal;

    const isAfternoonStart = startMinutesTotal >= 11 * 60 + 30 && startMinutesTotal <= 14 * 60 + 30;
    const isMorningStart = startMinutesTotal < 11 * 60 + 30;

    if (shouldIncludeKickoff) {
      let kickoffDuration = 25;
      if (isMorningStart) {
        kickoffDuration = startMinutesTotal <= 8 * 60 ? 30 : 20;
        newlyScheduledBlocks.push({
          id: 'tb_morning_kickoff',
          startTime: this.formatMinutesToTimeString(cursorTime),
          endTime: this.formatMinutesToTimeString(cursorTime + kickoffDuration),
          title: 'Morning Routine & Movement Kickoff',
          subtitle: '500ml water kickoff, 10m dynamic stretch & clear desk setup',
          category: 'routine',
          durationMinutes: kickoffDuration,
          isCompleted: false,
          priority: 'medium'
        });
      } else if (isAfternoonStart) {
        kickoffDuration = 25;
        newlyScheduledBlocks.push({
          id: 'tb_lunch_kickoff',
          startTime: this.formatMinutesToTimeString(cursorTime),
          endTime: this.formatMinutesToTimeString(cursorTime + kickoffDuration),
          title: 'Wake-Up Kickoff & Indian Lunch Fuel',
          subtitle: '500ml water hydration, nutritious Indian lunch, light walk & desk setup',
          category: 'routine',
          durationMinutes: kickoffDuration,
          isCompleted: false,
          priority: 'medium'
        });
      } else {
        kickoffDuration = 20;
        newlyScheduledBlocks.push({
          id: 'tb_wake_kickoff',
          startTime: this.formatMinutesToTimeString(cursorTime),
          endTime: this.formatMinutesToTimeString(cursorTime + kickoffDuration),
          title: 'Wake-Up Kickoff & Refreshment',
          subtitle: 'Cold water splash, 500ml hydration, protein snack & desk setup',
          category: 'routine',
          durationMinutes: kickoffDuration,
          isCompleted: false,
          priority: 'medium'
        });
      }

      cursorTime += kickoffDuration;
    }

    // Fixed Indian Landmark Timings
    interface LandmarkMeal {
      id: string;
      startMin: number;
      endMin: number;
      title: string;
      subtitle: string;
      category: 'routine' | 'break';
    }

    const landmarks: LandmarkMeal[] = [];

    // Morning Breakfast (if waking before 8 AM and not already completed)
    if (startMinutesTotal < 8 * 60 && !completedBlockIds.has('tb_breakfast')) {
      landmarks.push({
        id: 'tb_breakfast',
        startMin: 8 * 60 + 30, // 08:30
        endMin: 9 * 60,        // 09:00
        title: 'Wholesome Breakfast & Morning Tea',
        subtitle: 'Nutritious breakfast, hydration & quick mental pause',
        category: 'routine'
      });
    }

    // Indian Lunch (only if started before 11:30 AM and not already completed)
    if (startMinutesTotal < 11 * 60 + 30 && effectiveBedtimeMinutes > 14 * 60 && !completedBlockIds.has('tb_lunch_landmark')) {
      landmarks.push({
        id: 'tb_lunch_landmark',
        startMin: 13 * 60 + 30, // 13:30
        endMin: 14 * 60 + 10,   // 14:10
        title: 'Mindful Indian Lunch & Mental Reset',
        subtitle: 'Nutritious Indian meal, screen-off for 25m, light walk',
        category: 'routine'
      });
    }

    // Indian Evening Chai / Refreshment Break (if not already completed)
    if (cursorTime < 17 * 60 + 30 && effectiveBedtimeMinutes > 18 * 60 && !completedBlockIds.has('tb_chai_landmark')) {
      landmarks.push({
        id: 'tb_chai_landmark',
        startMin: 17 * 60 + 30, // 17:30
        endMin: 17 * 60 + 50,   // 17:50
        title: 'Indian Evening Chai & Stretch Break',
        subtitle: 'Warm tea/snack, 20-20-20 eye relaxation & posture stretch',
        category: 'break'
      });
    }

    // Indian Dinner & Digestion Walk (if not already completed)
    if (cursorTime < 20 * 60 + 45 && effectiveBedtimeMinutes > 21 * 60 + 30 && !completedBlockIds.has('tb_dinner_landmark')) {
      landmarks.push({
        id: 'tb_dinner_landmark',
        startMin: 20 * 60 + 45, // 20:45
        endMin: 21 * 60 + 25,   // 21:25
        title: 'Indian Dinner & Digestion Walk',
        subtitle: 'Balanced dinner, screen-off relaxation & light 10m digestion stroll',
        category: 'routine'
      });
    }

    // Night Wind-down boundary (20 min before bedtime)
    const windDownStart = effectiveBedtimeMinutes - 20;

    // Filter landmarks strictly after cursorTime and before windDownStart
    const activeLandmarks = landmarks.filter(l => l.startMin > cursorTime && l.endMin <= windDownStart);

    // Structure study windows between cursorTime, landmarks, and windDownStart
    interface TimeWindow {
      startMin: number;
      endMin: number;
      duration: number;
      isNightWindow: boolean;
    }

    const windows: TimeWindow[] = [];
    let currentWindowStart = cursorTime;

    activeLandmarks.forEach(lm => {
      if (lm.startMin > currentWindowStart + 15) {
        windows.push({
          startMin: currentWindowStart,
          endMin: lm.startMin,
          duration: lm.startMin - currentWindowStart,
          isNightWindow: false
        });
      }
      currentWindowStart = lm.endMin;
    });

    if (windDownStart > currentWindowStart + 15) {
      windows.push({
        startMin: currentWindowStart,
        endMin: windDownStart,
        duration: windDownStart - currentWindowStart,
        isNightWindow: true
      });
    }

    // Fill each window with high-yield study tasks strictly without spam breaks!
    let dayTaskIndex = 0;
    let landmarkIndex = 0;

    windows.forEach((win) => {
      let winCursor = win.startMin;
      let winRemaining = win.duration;

      // In the final night window, reserve the last 40-50m STRICTLY for End-of-Day Revision!
      const isNight = win.isNightWindow;
      const revisionDuration = isNight && winRemaining >= 70 ? Math.min(Math.max(Math.round(winRemaining * 0.35), 40), 55) : 0;
      const availableForStudy = winRemaining - revisionDuration;

      let studyCursorRemaining = availableForStudy;

      while (studyCursorRemaining >= 30 && dayTaskIndex < dayStudyTasks.length) {
        const task = dayStudyTasks[dayTaskIndex];
        
        let targetDur = task.durationMinutes;
        if (targetDur > studyCursorRemaining) {
          targetDur = studyCursorRemaining;
        }

        const leftover = studyCursorRemaining - targetDur;
        if (leftover > 0 && leftover < 35) {
          targetDur += leftover;
        }

        const taskStartStr = this.formatMinutesToTimeString(winCursor);
        const taskEndStr = this.formatMinutesToTimeString(winCursor + targetDur);

        newlyScheduledBlocks.push({
          ...task,
          startTime: taskStartStr,
          endTime: taskEndStr,
          durationMinutes: targetDur,
          subtitle: this.cleanSubtitle(task.subtitle),
          isAdjusted: true
        });

        winCursor += targetDur;
        studyCursorRemaining -= targetDur;
        dayTaskIndex++;
      }

      // If this is the night window and revision was reserved, place Revision STRICTLY HERE AT THE END!
      if (isNight && revisionDuration > 0) {
        const revStartStr = this.formatMinutesToTimeString(winCursor);
        const revEndStr = this.formatMinutesToTimeString(win.endMin);
        const actualRevDur = win.endMin - winCursor;

        newlyScheduledBlocks.push({
          ...nightRevisionTask,
          startTime: revStartStr,
          endTime: revEndStr,
          durationMinutes: actualRevDur,
          subtitle: this.cleanSubtitle(nightRevisionTask.subtitle),
          isAdjusted: true
        });

        winCursor = win.endMin;
      }

      // Insert Landmark meal immediately following this window if applicable
      if (landmarkIndex < activeLandmarks.length && activeLandmarks[landmarkIndex].startMin <= win.endMin) {
        const lm = activeLandmarks[landmarkIndex];
        newlyScheduledBlocks.push({
          id: lm.id,
          startTime: this.formatMinutesToTimeString(lm.startMin),
          endTime: this.formatMinutesToTimeString(lm.endMin),
          title: lm.title,
          subtitle: lm.subtitle,
          category: lm.category,
          durationMinutes: lm.endMin - lm.startMin,
          isCompleted: false,
          priority: 'medium'
        });
        landmarkIndex++;
      }
    });

    // If revision wasn't placed yet (e.g. very short night window), place it before wind-down
    const hasRevisionPlaced = newlyScheduledBlocks.some(b => b.category === 'revision');
    if (!hasRevisionPlaced && grossAvailableMinutes >= 120) {
      const lastStudy = newlyScheduledBlocks[newlyScheduledBlocks.length - 1];
      if (lastStudy && lastStudy.durationMinutes > 60) {
        lastStudy.durationMinutes -= 40;
        const [lsh, lsm] = lastStudy.startTime.split(':').map(Number);
        const newEndMin = (lsh * 60 + lsm) + lastStudy.durationMinutes;
        lastStudy.endTime = this.formatMinutesToTimeString(newEndMin);

        newlyScheduledBlocks.push({
          ...nightRevisionTask,
          startTime: this.formatMinutesToTimeString(newEndMin),
          endTime: this.formatMinutesToTimeString(windDownStart),
          durationMinutes: windDownStart - newEndMin,
          isAdjusted: true
        });
      }
    }

    // Append Final Night Wind-Down Block to exact bedtime
    const windStartH = Math.floor(windDownStart / 60) % 24;
    const windStartM = windDownStart % 60;
    const windEndH = Math.floor(effectiveBedtimeMinutes / 60) % 24;
    const windEndM = effectiveBedtimeMinutes % 60;

    const windDownBlock: TimeBlock = {
      id: 'tb_night_winddown',
      startTime: `${windStartH.toString().padStart(2, '0')}:${windStartM.toString().padStart(2, '0')}`,
      endTime: `${windEndH.toString().padStart(2, '0')}:${windEndM.toString().padStart(2, '0')}`,
      title: 'Night Wind-Down & Sleep Preparation',
      subtitle: `Screen dimming, reflection & desk prep · Target bedtime: ${effectiveBedtimeStr}`,
      category: 'routine',
      durationMinutes: Math.max(effectiveBedtimeMinutes - windDownStart, 15),
      isCompleted: false,
      priority: 'low'
    };

    // Deduplicate and sort chronologically
    const seenBlockIds = new Set<string>();
    const finalScheduleBlocks: TimeBlock[] = [];

    // Prioritize completed blocks first
    for (const b of completedBlocks) {
      if (!seenBlockIds.has(b.id)) {
        seenBlockIds.add(b.id);
        finalScheduleBlocks.push(b);
      }
    }

    // Then newly scheduled blocks
    for (const b of [...newlyScheduledBlocks, windDownBlock]) {
      if (!seenBlockIds.has(b.id)) {
        seenBlockIds.add(b.id);
        finalScheduleBlocks.push(b);
      }
    }

    // Sort by startTime
    finalScheduleBlocks.sort((a, b) => {
      const [ah, am] = a.startTime.split(':').map(Number);
      const [bh, bm] = b.startTime.split(':').map(Number);
      return ((ah || 0) * 60 + (am || 0)) - ((bh || 0) * 60 + (bm || 0));
    });

    const actualStartTimeStr = this.formatMinutesToTimeString(startMinutesTotal);

    const scheduledStudyMinutes = finalScheduleBlocks
      .filter(b => b.category === 'gate' || b.category === 'dsa' || b.category === 'revision')
      .reduce((sum, b) => sum + b.durationMinutes, 0);

    const updatedPlan: DailyPlan = {
      ...rawPlan,
      timeBlocks: finalScheduleBlocks,
      userChosenBedtime: effectiveBedtimeStr,
      recommendedBedtime: recommendedTimeStr,
      isAdaptiveActive: true,
      dayStartTime: actualStartTimeStr,
      outputMode,
      wakeUpProtocol,
      sleepConstraint: {
        targetSleepTime: effectiveBedtimeStr,
        isUserSelected: !!options.userChosenBedtime,
        wakeTimeTomorrow: profile.wakeTime || '07:00'
      },
      notes: `Strict maximum output schedule from ${actualStartTimeStr} to ${effectiveBedtimeStr} (${formatMinutesToHours(scheduledStudyMinutes)} study time).`
    };

    const sanitizedPlan = this.sanitizePlan(updatedPlan);
    StorageService.saveDailyPlan(sanitizedPlan);

    const report: AdaptiveScheduleReport = {
      originalPlannedMinutes: rawPlan.timeBlocks.reduce((sum, b) => sum + b.durationMinutes, 0),
      actualAvailableMinutes: grossAvailableMinutes,
      scheduledStudyMinutes,
      adaptiveStartTime: actualStartTimeStr,
      adaptiveBedtime: effectiveBedtimeStr,
      recommendedBedtime: recommendedTimeStr,
      retainedTasksCount: sanitizedPlan.timeBlocks.filter(b => b.category === 'gate' || b.category === 'dsa' || b.category === 'revision').length,
      deferredTasksCount: Math.max(dayStudyTasks.length - dayTaskIndex, 0),
      summaryMessage: `Strict schedule generated from ${actualStartTimeStr} to ${effectiveBedtimeStr} with ${formatMinutesToHours(scheduledStudyMinutes)} of focused study.`,
      strategyApplied: `Continuous deep focus blocks with Indian standard meals and night-only revision.`,
      isWorkloadExceeding: dayStudyTasks.length > dayTaskIndex
    };

    return { updatedPlan: sanitizedPlan, report };
  }

  /**
   * Adapts the daily schedule using the strict high-yield maximum output engine.
   */
  static adaptDailySchedule(
    dateStr: string,
    options: AdaptiveScheduleOptions = {}
  ): { updatedPlan: DailyPlan; report: AdaptiveScheduleReport } {
    let startMinutesTotal: number;
    if (options.startTime) {
      const [sh, sm] = options.startTime.split(':').map(Number);
      startMinutesTotal = (sh || 0) * 60 + (sm || 0);
    } else {
      const now = new Date();
      startMinutesTotal = now.getHours() * 60 + Math.ceil(now.getMinutes() / 5) * 5;
    }

    return this.generateMaximumOutputSchedule(dateStr, startMinutesTotal, options);
  }
}


