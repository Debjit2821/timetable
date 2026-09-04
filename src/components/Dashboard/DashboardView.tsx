import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Clock, 
  Calendar, 
  Zap, 
  Droplet, 
  ArrowRight,
  Sun,
  Eye,
  Moon,
  Sparkles,
  Award,
  AlertCircle,
  Sliders,
  ShieldCheck,
  Utensils,
  Coffee,
  Flame
} from 'lucide-react';
import { DailyPlan, UserProfile, Subject, DsaProblem, AdaptiveScheduleOptions } from '../../types';
import { NextActionWidget } from '../NextActionWidget';
import { DailyReviewModal } from './DailyReviewModal';
import { RescheduleModal } from './RescheduleModal';
import { CatchUpModal } from './CatchUpModal';
import { AdaptiveScheduleModal } from './AdaptiveScheduleModal';
import { StartDayModal } from './StartDayModal';
import { WakeUpGuideCard } from './WakeUpGuideCard';
import { AdaptationEngine, AdaptationReport, LapsedTaskAnalysis } from '../../services/adaptationEngine';
import { PlannerEngine } from '../../services/plannerEngine';
import { HealthEngine } from '../../services/healthEngine';
import { formatDateHeading, formatMinutesToHours } from '../../utils/dateUtils';

interface DashboardViewProps {
  plan: DailyPlan;
  profile: UserProfile;
  syllabus: Subject[];
  dsaBank: DsaProblem[];
  onToggleTimeBlock: (blockId: string) => void;
  onToggleHealthHabit: (habitKey: keyof DailyPlan['healthHabits']) => void;
  onAddWaterGlass: () => void;
  onRemoveWaterGlass: () => void;
  onPrepareTomorrow: () => void;
  onApplyRedistribution: () => void;
  onApplyHighYieldReschedule: () => void;
  onApplyAdaptiveSchedule: (options: AdaptiveScheduleOptions) => void;
  soundEnabled: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  plan,
  profile,
  syllabus,
  dsaBank,
  onToggleTimeBlock,
  onToggleHealthHabit,
  onAddWaterGlass,
  onRemoveWaterGlass,
  onPrepareTomorrow,
  onApplyRedistribution,
  onApplyHighYieldReschedule,
  onApplyAdaptiveSchedule,
  soundEnabled
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCatchUpModal, setShowCatchUpModal] = useState(false);
  const [showAdaptiveModal, setShowAdaptiveModal] = useState(false);
  const [showStartDayModal, setShowStartDayModal] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(false);

  // Live Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  const daysRemaining = PlannerEngine.getDaysRemaining(profile.examDate);
  const { currentDay, totalDays } = PlannerEngine.getDayNumber(profile.startDate);

  // Syllabus progress across all 11 sections
  const allTopics = syllabus.flatMap(s => s.topics);
  const completedTopicsCount = allTopics.filter(t => t.status === 'completed').length;
  const syllabusCoveredPercent = Math.round((completedTopicsCount / Math.max(allTopics.length, 1)) * 100);

  // DSA problems
  const todaysDsaProblems = plan.dsaProblemIds
    .map(id => dsaBank.find(p => p.id === id))
    .filter(Boolean) as DsaProblem[];
  const dsaSolvedToday = todaysDsaProblems.filter(p => p.status === 'solved').length;

  // Health
  const healthBreakdown = HealthEngine.calculateScore(plan.healthHabits);
  const adaptationReport = AdaptationEngine.evaluateProgress();
  const lapsedAnalysis = AdaptationEngine.analyzeLapsedTasks(plan, currentTime);

  // Task counts
  const completedBlocks = plan.timeBlocks.filter(b => b.isCompleted).length;
  const totalBlocks = plan.timeBlocks.length;
  const dailyProgressPercent = Math.round((completedBlocks / Math.max(totalBlocks, 1)) * 100);

  // Pure study minutes calculation
  const totalPlannedStudyMinutes = plan.timeBlocks
    .filter(b => b.category === 'gate' || b.category === 'dsa' || b.category === 'revision')
    .reduce((sum, b) => sum + b.durationMinutes, 0);

  const targetSleepTime = plan.sleepConstraint?.targetSleepTime || plan.userChosenBedtime || profile.bedTime || '23:00';

  const getMealOrCategoryBadge = (block: typeof plan.timeBlocks[0]) => {
    const titleLower = block.title.toLowerCase();
    if (titleLower.includes('lunch')) {
      return (
        <span className="pill text-[10px] font-mono border-amber-500/40 text-amber-300 bg-amber-950/30 flex items-center gap-1">
          <Utensils className="w-2.5 h-2.5" />
          <span>Indian Lunch</span>
        </span>
      );
    }
    if (titleLower.includes('chai') || titleLower.includes('tea')) {
      return (
        <span className="pill text-[10px] font-mono border-amber-500/40 text-amber-200 bg-amber-950/30 flex items-center gap-1">
          <Coffee className="w-2.5 h-2.5" />
          <span>Evening Chai</span>
        </span>
      );
    }
    if (titleLower.includes('dinner')) {
      return (
        <span className="pill text-[10px] font-mono border-rose-500/40 text-rose-300 bg-rose-950/30 flex items-center gap-1">
          <Utensils className="w-2.5 h-2.5" />
          <span>Indian Dinner</span>
        </span>
      );
    }
    if (block.category === 'gate') {
      return (
        <span className="pill pill-indigo text-[10px] font-mono">
          GATE Study
        </span>
      );
    }
    if (block.category === 'dsa') {
      return (
        <span className="pill text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-950/30">
          DSA Practice
        </span>
      );
    }
    if (block.category === 'revision') {
      return (
        <span className="pill text-[10px] font-mono border-purple-500/30 text-purple-300 bg-purple-950/30">
          Spaced Revision
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. TODAY HEADER & TOP METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-subtle pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-tertiary mb-1">
            {formatDateHeading(plan.date)} · Day {currentDay} of {totalDays}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-primary tracking-tight">
            Today's Plan
          </h1>
        </div>

        {/* Action Controls & Top Stats */}
        <div className="flex items-center gap-2.5 sm:gap-4 text-xs text-secondary flex-wrap">
          {/* Prominent Start Day / Wake Time Button */}
          <button
            onClick={() => setShowStartDayModal(true)}
            className="btn-primary text-xs px-3 py-1.5 text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            title="Set when you woke up or started study today to maximize output"
          >
            <Sun className="w-3.5 h-3.5 text-amber-300" />
            <span>Start Day / Wake Time</span>
          </button>

          <button
            onClick={() => setShowAdaptiveModal(true)}
            className="btn-ghost text-xs px-2.5 py-1 text-secondary border border-subtle hover:text-primary flex items-center gap-1.5"
            title="Adjust timeline or sleep constraints"
          >
            <Sliders className="w-3 h-3" />
            <span>Timeline</span>
          </button>

          <div className="hidden sm:block">
            <span className="text-tertiary">Study: </span>
            <span className="text-accent font-semibold">{formatMinutesToHours(totalPlannedStudyMinutes)}</span>
          </div>

          <div>
            <span className="text-tertiary">GATE 2027: </span>
            <span className="text-primary font-medium">{daysRemaining}d</span>
          </div>
          <div>
            <span className="text-tertiary">Syllabus: </span>
            <span className="text-primary font-medium">{syllabusCoveredPercent}%</span>
          </div>
        </div>
      </div>

      {/* Immediate Wake-Up Action Guide Card (Appears whenever wakeUpProtocol is active) */}
      {plan.wakeUpProtocol && !guideDismissed && (
        <WakeUpGuideCard
          protocol={plan.wakeUpProtocol}
          onDismiss={() => setGuideDismissed(true)}
        />
      )}

      {/* Adaptive Schedule Shift Alert if actual time has diverged */}
      {lapsedAnalysis.hasLapsedTasks && (
        <div className="p-3.5 rounded-md bg-subtle border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>
              <strong className="text-primary">Actual day shifted from planned schedule</strong> ({lapsedAnalysis.lapsedBlocks.length} earlier tasks). Re-align the remaining day for maximum output.
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => setShowStartDayModal(true)}
              className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap flex items-center gap-1.5"
            >
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span>Set When You Woke Up</span>
            </button>
            <button
              onClick={() => onApplyAdaptiveSchedule({ startTime: currentTimeString })}
              className="btn-secondary text-xs px-2.5 py-1.5 whitespace-nowrap"
            >
              <Zap className="w-3 h-3" />
              <span>Adapt Now</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. NEXT ACTION (HERO COMPONENT) */}
      <section>
        <NextActionWidget
          plan={plan}
          onCompleteBlock={onToggleTimeBlock}
          soundEnabled={soundEnabled}
        />
      </section>

      {/* 3. TODAY'S TIMED SCHEDULE (ELEGANT TASK LIST) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-primary font-heading">
              Daily Schedule
            </h2>
            <span className="text-xs text-tertiary font-mono">
              ({completedBlocks}/{totalBlocks} completed · {formatMinutesToHours(totalPlannedStudyMinutes)} high-yield study)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-tertiary font-mono hidden sm:flex items-center gap-1.5">
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Sleep Deadline: <strong className="text-accent">{targetSleepTime}</strong></span>
            </div>

            <button
              onClick={() => setShowStartDayModal(true)}
              className="text-xs text-accent hover:underline font-medium flex items-center gap-1"
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Adjust Start / Wake Time</span>
            </button>
          </div>
        </div>

        {/* Thin Minimal Progress Bar */}
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${dailyProgressPercent}%` }} 
          />
        </div>

        {/* Schedule List */}
        <div className="panel divide-y divide-subtle overflow-hidden">
          {plan.timeBlocks.map(block => {
            const isCurrent = currentTimeString >= block.startTime && currentTimeString <= block.endTime;
            const cleanSub = PlannerEngine.cleanSubtitle(block.subtitle);
            const badge = getMealOrCategoryBadge(block);

            return (
              <div
                key={block.id}
                onClick={() => onToggleTimeBlock(block.id)}
                className={`p-3.5 flex items-start justify-between gap-3.5 transition-colors cursor-pointer ${
                  isCurrent ? 'bg-indigo-950/30 ring-1 ring-inset ring-indigo-500/20' : 'hover:bg-white/[0.02]'
                } ${block.isCompleted ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Circle Checkbox */}
                  <button 
                    type="button"
                    className={`check-circle mt-0.5 shrink-0 ${block.isCompleted ? 'checked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTimeBlock(block.id);
                    }}
                  >
                    {block.isCompleted && <Check className="w-3 h-3" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${block.isCompleted ? 'line-through text-secondary' : 'text-primary'}`}>
                        {block.title}
                      </span>
                      {isCurrent && (
                        <span className="pill pill-indigo text-[10px] font-mono">
                          Now
                        </span>
                      )}
                      {badge}
                      {block.isAdjusted && !badge && (
                        <span className="pill text-[9px] font-mono">
                          Adjusted
                        </span>
                      )}
                    </div>
                    {cleanSub && (
                      <p className="text-xs text-tertiary mt-0.5">
                        {cleanSub}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono text-secondary">
                    {block.startTime} – {block.endTime}
                  </div>
                  <div className="text-[11px] text-tertiary">
                    {block.durationMinutes}m
                  </div>
                </div>
              </div>
            );
          })}

          {/* Sleep Boundary (Hard Constraint Display - Not a task) */}
          <div className="p-3 bg-[#0a0c14] flex items-center justify-between text-xs text-secondary border-t border-subtle">
            <div className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-primary">Sleep Deadline & Rest Boundary:</span>
              <span className="font-mono text-accent font-bold">{targetSleepTime}</span>
            </div>
            <span className="text-[11px] text-tertiary font-mono hidden sm:inline">
              Sleep Protected · Wake {profile.wakeTime}
            </span>
          </div>
        </div>
      </section>

      {/* 4. SUPPORTING SECTIONS (DSA + HEALTH + REVIEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left: Today's DSA Target */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-primary font-heading">
              DSA Target
            </h2>
            <span className="text-xs font-mono text-tertiary">
              {dsaSolvedToday} / 3 completed
            </span>
          </div>

          <div className="panel divide-y divide-subtle">
            {todaysDsaProblems.map((prob, idx) => {
              const isSolved = prob.status === 'solved';
              return (
                <div key={prob.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-xs font-mono text-tertiary">0{idx + 1}</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`text-xs font-medium truncate ${isSolved ? 'line-through text-secondary' : 'text-primary'}`}>
                          {prob.title}
                        </span>
                        <span className="pill text-[10px]">{prob.difficulty}</span>
                      </div>
                      <div className="text-[11px] text-tertiary">{prob.category}</div>
                    </div>
                  </div>

                  <a
                    href={prob.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent hover:underline shrink-0 font-medium"
                  >
                    Solve ↗
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Healthy Day Checklist & Hydration */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-primary font-heading">
              Healthy Day Habit Checklist
            </h2>
            <span className="text-xs font-mono text-emerald-400">
              Score: {healthBreakdown.score}%
            </span>
          </div>

          <div className="panel p-4 space-y-3">
            {/* Minimal Hydration Strip */}
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div className="flex items-center gap-2">
                <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs text-secondary font-medium">Hydration (2.5L)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-primary font-medium">
                  {plan.healthHabits.hydrationGlasses} / 10 cups
                </span>
                <button
                  onClick={onAddWaterGlass}
                  className="btn-ghost text-xs px-2 py-0.5 text-accent"
                >
                  + Add cup
                </button>
              </div>
            </div>

            {/* Concise Habit Toggles */}
            <div className="space-y-2 text-xs">
              <label 
                onClick={() => onToggleHealthHabit('morningKickoffHydration')}
                className="flex items-center gap-2.5 cursor-pointer text-secondary hover:text-primary"
              >
                <div className={`check-circle ${plan.healthHabits.morningKickoffHydration ? 'checked' : ''}`}>
                  {plan.healthHabits.morningKickoffHydration && <Check className="w-3 h-3" />}
                </div>
                <span>Morning / Wake-up 500ml water kickoff</span>
              </label>

              <label 
                onClick={() => onToggleHealthHabit('morningStretching')}
                className="flex items-center gap-2.5 cursor-pointer text-secondary hover:text-primary"
              >
                <div className={`check-circle ${plan.healthHabits.morningStretching ? 'checked' : ''}`}>
                  {plan.healthHabits.morningStretching && <Check className="w-3 h-3" />}
                </div>
                <span>15m Dynamic stretch / sun exposure</span>
              </label>

              <label 
                onClick={() => onToggleHealthHabit('exerciseCompleted')}
                className="flex items-center gap-2.5 cursor-pointer text-secondary hover:text-primary"
              >
                <div className={`check-circle ${plan.healthHabits.exerciseCompleted ? 'checked' : ''}`}>
                  {plan.healthHabits.exerciseCompleted && <Check className="w-3 h-3" />}
                </div>
                <span>20-30m WHO physical activity / walk</span>
              </label>

              <label 
                onClick={() => onToggleHealthHabit('sleepTargetAchieved')}
                className="flex items-center gap-2.5 cursor-pointer text-secondary hover:text-primary"
              >
                <div className={`check-circle ${plan.healthHabits.sleepTargetAchieved ? 'checked' : ''}`}>
                  {plan.healthHabits.sleepTargetAchieved && <Check className="w-3 h-3" />}
                </div>
                <span>7.0 - 8.0h Restorative sleep target</span>
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* 5. EVENING DAILY REVIEW TRIGGER */}
      <div className="panel p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-primary font-heading">
            Daily Accountability Review
          </div>
          <p className="text-xs text-tertiary mt-0.5">
            Reflect on completed work and prepare tomorrow's schedule.
          </p>
        </div>

        <button
          onClick={() => setShowReviewModal(true)}
          className="btn-secondary text-xs px-3.5 py-2"
        >
          <span>Review Day</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modals */}
      {showStartDayModal && (
        <StartDayModal
          plan={plan}
          profile={profile}
          currentTimeString={currentTimeString}
          onClose={() => setShowStartDayModal(false)}
          onApplySchedule={(options) => {
            onApplyAdaptiveSchedule(options);
            setGuideDismissed(false);
          }}
        />
      )}

      {showAdaptiveModal && (
        <AdaptiveScheduleModal
          plan={plan}
          profile={profile}
          currentTimeString={currentTimeString}
          onClose={() => setShowAdaptiveModal(false)}
          onApplyAdaptiveSchedule={onApplyAdaptiveSchedule}
        />
      )}

      {showCatchUpModal && (
        <CatchUpModal
          analysis={lapsedAnalysis}
          currentTimeString={currentTimeString}
          onClose={() => setShowCatchUpModal(false)}
          onApplyCatchUp={() => {
            onApplyHighYieldReschedule();
            setShowCatchUpModal(false);
          }}
        />
      )}

      {showReviewModal && (
        <DailyReviewModal
          plan={plan}
          profile={profile}
          healthScore={healthBreakdown.score}
          dsaSolvedCount={dsaSolvedToday}
          onClose={() => setShowReviewModal(false)}
          onPrepareTomorrow={() => {
            setShowReviewModal(false);
            onPrepareTomorrow();
          }}
        />
      )}

      {showRescheduleModal && (
        <RescheduleModal
          report={adaptationReport}
          onClose={() => setShowRescheduleModal(false)}
          onApplyRedistribution={() => {
            onApplyRedistribution();
            setShowRescheduleModal(false);
          }}
        />
      )}
    </div>
  );
};

