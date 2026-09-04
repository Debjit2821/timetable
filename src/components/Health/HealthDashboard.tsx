import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Droplet, 
  Eye, 
  Check, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';
import { DailyPlan, UserProfile } from '../../types';
import { WHO_HEALTH_GUIDELINES } from '../../data/whoHealthGuidance';
import { HealthEngine } from '../../services/healthEngine';
import { soundManager } from '../../utils/audioAlerts';

interface HealthDashboardProps {
  plan: DailyPlan;
  profile: UserProfile;
  onToggleHealthHabit: (habitKey: keyof DailyPlan['healthHabits']) => void;
  onAddWaterGlass: () => void;
  onRemoveWaterGlass: () => void;
  soundEnabled: boolean;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  plan,
  profile,
  onToggleHealthHabit,
  onAddWaterGlass,
  onRemoveWaterGlass,
  soundEnabled
}) => {
  // 20-20-20 Eye Rest Timer
  const [eyeTimerRunning, setEyeTimerRunning] = useState(false);
  const [eyeSeconds, setEyeSeconds] = useState(20 * 60);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (eyeTimerRunning) {
      interval = setInterval(() => {
        setEyeSeconds(prev => {
          if (prev <= 1) {
            if (soundEnabled) soundManager.playBreakTone();
            return 20 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [eyeTimerRunning, soundEnabled]);

  const healthBreakdown = HealthEngine.calculateScore(plan.healthHabits);

  const formatEyeTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-subtle pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-tertiary mb-1">
            Evidence-Based WHO Guidelines
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-primary tracking-tight">
            Health & Lifestyle
          </h1>
        </div>

        {/* Minimal Score Metric */}
        <div className="flex items-center gap-5 text-xs text-secondary font-mono">
          <div>
            <span className="text-tertiary">Consistency Score: </span>
            <span className="text-emerald-400 font-medium">{healthBreakdown.score}%</span>
          </div>
          <div>
            <span className="text-tertiary">Habits: </span>
            <span className="text-primary font-medium">{healthBreakdown.completedItemsCount} / {healthBreakdown.totalItemsCount}</span>
          </div>
        </div>
      </div>

      {/* 1. THREE KEY PILLARS (SLEEP, ACTIVITY, HYDRATION) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Sleep */}
        <div className="panel p-4">
          <div className="flex items-center justify-between text-xs text-tertiary mb-2">
            <span>Restorative Sleep</span>
            <Moon className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold font-mono text-primary">
            7.5h
          </div>
          <div className="text-xs text-secondary mt-1">
            {plan.healthHabits.sleepTargetAchieved ? 'Target met ✓' : '7.5 - 8.0h target'}
          </div>
        </div>

        {/* Activity */}
        <div className="panel p-4">
          <div className="flex items-center justify-between text-xs text-tertiary mb-2">
            <span>Physical Activity</span>
            <Heart className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold font-mono text-primary">
            {plan.healthHabits.exerciseCompleted ? '40 min' : '0 min'}
          </div>
          <div className="text-xs text-secondary mt-1">
            {plan.healthHabits.exerciseCompleted ? 'WHO target completed ✓' : '30-45m target'}
          </div>
        </div>

        {/* Hydration */}
        <div className="panel p-4">
          <div className="flex items-center justify-between text-xs text-tertiary mb-2">
            <span>Hydration (2.5L)</span>
            <Droplet className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold font-mono text-primary">
            {plan.healthHabits.hydrationGlasses} <span className="text-xs font-normal text-tertiary">/ 10 cups</span>
          </div>
          <div className="text-xs text-secondary mt-1 flex items-center justify-between">
            <span>{plan.healthHabits.hydrationGlasses * 250} ml logged</span>
            <button onClick={onAddWaterGlass} className="text-accent hover:underline">+ Add cup</button>
          </div>
        </div>
      </div>

      {/* 2. DAILY HEALTH HABIT CHECKLIST */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-primary font-heading">
          Daily Health Habit Checklist
        </h2>

        <div className="panel divide-y divide-subtle">
          <label 
            onClick={() => onToggleHealthHabit('morningKickoffHydration')}
            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`check-circle ${plan.healthHabits.morningKickoffHydration ? 'checked' : ''}`}>
                {plan.healthHabits.morningKickoffHydration && <Check className="w-3 h-3" />}
              </div>
              <span className="text-xs text-primary font-medium">Morning 500ml water kickoff</span>
            </div>
            <span className="text-[11px] text-tertiary font-mono">07:00 AM</span>
          </label>

          <label 
            onClick={() => onToggleHealthHabit('morningStretching')}
            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`check-circle ${plan.healthHabits.morningStretching ? 'checked' : ''}`}>
                {plan.healthHabits.morningStretching && <Check className="w-3 h-3" />}
              </div>
              <span className="text-xs text-primary font-medium">15m Dynamic stretch / sun exposure</span>
            </div>
            <span className="text-[11px] text-tertiary font-mono">07:15 AM</span>
          </label>

          <label 
            onClick={() => onToggleHealthHabit('studyBreaksTaken')}
            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`check-circle ${plan.healthHabits.studyBreaksTaken >= 4 ? 'checked' : ''}`}>
                {plan.healthHabits.studyBreaksTaken >= 4 && <Check className="w-3 h-3" />}
              </div>
              <span className="text-xs text-primary font-medium">Regular 50/10m movement breaks ({plan.healthHabits.studyBreaksTaken}/4 logged)</span>
            </div>
            <span className="text-[11px] text-accent font-medium">+ Click to log</span>
          </label>

          <label 
            onClick={() => onToggleHealthHabit('exerciseCompleted')}
            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`check-circle ${plan.healthHabits.exerciseCompleted ? 'checked' : ''}`}>
                {plan.healthHabits.exerciseCompleted && <Check className="w-3 h-3" />}
              </div>
              <span className="text-xs text-primary font-medium">WHO physical activity block (30-45m walk/cardio)</span>
            </div>
            <span className="text-[11px] text-tertiary font-mono">06:45 PM</span>
          </label>

          <label 
            onClick={() => onToggleHealthHabit('sleepTargetAchieved')}
            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`check-circle ${plan.healthHabits.sleepTargetAchieved ? 'checked' : ''}`}>
                {plan.healthHabits.sleepTargetAchieved && <Check className="w-3 h-3" />}
              </div>
              <span className="text-xs text-primary font-medium">7.5 - 8.0h Restorative sleep target</span>
            </div>
            <span className="text-[11px] text-tertiary font-mono">11:00 PM</span>
          </label>
        </div>
      </section>

      {/* 3. 20-20-20 EYE REST & WHO GUIDELINES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        {/* Eye Rest Tool */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary font-heading">
              20-20-20 Vision Rest Protocol
            </span>
            <Eye className="w-3.5 h-3.5 text-tertiary" />
          </div>

          <p className="text-xs text-secondary leading-relaxed">
            Every 20 minutes, look at an object 20 feet away for 20 seconds to prevent digital eye strain.
          </p>

          <div className="p-3 rounded-md bg-subtle border border-subtle flex items-center justify-between">
            <span className="font-mono text-xl font-semibold text-primary">
              {formatEyeTime(eyeSeconds)}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEyeTimerRunning(!eyeTimerRunning)}
                className="btn-primary text-xs px-3 py-1.5"
              >
                {eyeTimerRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{eyeTimerRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={() => {
                  setEyeTimerRunning(false);
                  setEyeSeconds(20 * 60);
                }}
                className="btn-ghost p-1.5"
              >
                <RotateCcw className="w-3 h-3 text-tertiary" />
              </button>
            </div>
          </div>
        </div>

        {/* WHO Reference List */}
        <div className="panel p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary font-heading">
              WHO Evidence-Based Guidelines
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <div className="space-y-2 text-xs text-secondary">
            {WHO_HEALTH_GUIDELINES.slice(0, 3).map(g => (
              <div key={g.id} className="p-2 rounded-md bg-subtle border border-subtle">
                <div className="font-medium text-primary text-[11px]">{g.title}</div>
                <div className="text-tertiary text-[10px] mt-0.5">{g.targetMetric}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
