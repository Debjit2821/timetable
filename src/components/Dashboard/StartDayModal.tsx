import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Clock, 
  Zap, 
  Moon, 
  Sun, 
  Utensils, 
  ShieldCheck, 
  Check, 
  Flame,
  ArrowRight,
  Coffee
} from 'lucide-react';
import { UserProfile, DailyPlan, AdaptiveScheduleOptions } from '../../types';
import { PlannerEngine } from '../../services/plannerEngine';
import { formatMinutesToHours } from '../../utils/dateUtils';

interface StartDayModalProps {
  plan: DailyPlan;
  profile: UserProfile;
  currentTimeString: string;
  onClose: () => void;
  onApplySchedule: (options: AdaptiveScheduleOptions) => void;
}

export const StartDayModal: React.FC<StartDayModalProps> = ({
  plan,
  profile,
  currentTimeString,
  onClose,
  onApplySchedule
}) => {
  // Wake-up time selection
  const [selectedWakeTime, setSelectedWakeTime] = useState<string>(() => {
    return plan.dayStartTime || currentTimeString || profile.wakeTime || '07:00';
  });
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);

  // Output mode selection
  const [outputMode, setOutputMode] = useState<'maximum' | 'balanced' | 'accelerated'>('maximum');

  // Bedtime selection
  const [sh, sm] = selectedWakeTime.split(':').map(Number);
  const startMinTotal = (sh || 0) * 60 + (sm || 0);

  const { recommendedTimeStr } = PlannerEngine.calculateDynamicRecommendedBedtime(
    plan,
    profile,
    startMinTotal
  );

  const [bedtimeChoice, setBedtimeChoice] = useState<'recommended' | 'custom'>('recommended');
  const [customBedtime, setCustomBedtime] = useState<string>(recommendedTimeStr);

  const activeBedtime = bedtimeChoice === 'recommended' ? recommendedTimeStr : customBedtime;

  const [eh, em] = activeBedtime.split(':').map(Number);
  let endMinTotal = (eh || 0) * 60 + (em || 0);
  if (endMinTotal <= startMinTotal) endMinTotal += 24 * 60; // crosses midnight

  const availableMinutes = Math.max(endMinTotal - startMinTotal, 60);

  // Live Wake-Up Protocol preview
  const protocol = PlannerEngine.getWakeUpProtocol(startMinTotal, availableMinutes, outputMode);

  const quickPresets = [
    { label: '07:00 AM', value: '07:00', desc: 'Early Bird' },
    { label: '09:00 AM', value: '09:00', desc: 'Morning' },
    { label: '01:00 PM', value: '13:00', desc: 'Afternoon Wake-Up' },
    { label: '02:30 PM', value: '14:30', desc: 'Post-Lunch Sprint' },
    { label: `Now (${currentTimeString})`, value: currentTimeString, desc: 'Right Now' }
  ];

  const handleApply = () => {
    onApplySchedule({
      startTime: selectedWakeTime,
      userChosenBedtime: activeBedtime,
      outputMode
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="panel max-w-2xl w-full p-6 sm:p-8 relative bg-[#10121b] border-indigo-500/30 shadow-2xl overflow-y-auto max-h-[92vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-tertiary hover:text-primary p-1 rounded-md bg-subtle border border-subtle"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-1 flex items-center gap-1.5 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>High-Yield Daily Scheduler</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary font-heading tracking-tight">
            Start Your Day for Maximum Output
          </h2>
          <p className="text-xs text-secondary mt-1">
            Tell GatePlanner when you woke up or are starting today. We will build an unfragmented, high-yield schedule with Indian standard meals (Lunch, Evening Chai, Dinner) and zero wasted filler time.
          </p>
        </div>

        <div className="space-y-6">
          {/* 1. WAKE-UP / START TIME SELECTION */}
          <div>
            <label className="block text-xs font-semibold text-primary font-heading mb-2.5">
              1. When did you wake up / when are you starting study today?
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2.5">
              {quickPresets.map((preset) => {
                const isSelected = !isCustomTime && selectedWakeTime === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setIsCustomTime(false);
                      setSelectedWakeTime(preset.value);
                    }}
                    className={`p-3 rounded-md border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-primary font-semibold shadow-sm ring-1 ring-indigo-500/40'
                        : 'bg-[#090a10] border-subtle text-secondary hover:border-subtle hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="text-accent font-mono text-xs font-bold">{preset.label}</div>
                    <div className="text-[10px] text-tertiary mt-0.5">{preset.desc}</div>
                  </button>
                );
              })}

              {/* Custom Time Selector */}
              <div
                onClick={() => setIsCustomTime(true)}
                className={`p-3 rounded-md border text-left transition-all cursor-pointer ${
                  isCustomTime
                    ? 'bg-indigo-950/60 border-indigo-500 text-primary font-semibold ring-1 ring-indigo-500/40'
                    : 'bg-[#090a10] border-subtle text-secondary hover:border-subtle'
                }`}
              >
                <div className="text-tertiary font-mono text-[10px]">Custom Time</div>
                <input
                  type="time"
                  value={selectedWakeTime}
                  onChange={(e) => {
                    setIsCustomTime(true);
                    setSelectedWakeTime(e.target.value);
                  }}
                  className="bg-transparent border-0 p-0 text-xs font-mono text-primary font-bold outline-none mt-0.5 w-full cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 2. STUDY OUTPUT GOAL MODE */}
          <div>
            <label className="block text-xs font-semibold text-primary font-heading mb-2.5">
              2. Target Study Output Mode
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div
                onClick={() => setOutputMode('maximum')}
                className={`p-3 rounded-md border cursor-pointer transition-all ${
                  outputMode === 'maximum'
                    ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/40'
                    : 'bg-[#090a10] border-subtle hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-accent font-heading">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Maximum Output</span>
                </div>
                <p className="text-[11px] text-secondary mt-1 leading-normal">
                  7 to 8.5+ hours pure high-yield study. Deep focus blocks, zero filler routines, 10m crisp resets.
                </p>
              </div>

              <div
                onClick={() => setOutputMode('balanced')}
                className={`p-3 rounded-md border cursor-pointer transition-all ${
                  outputMode === 'balanced'
                    ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/40'
                    : 'bg-[#090a10] border-subtle hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-heading">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Balanced Mode</span>
                </div>
                <p className="text-[11px] text-secondary mt-1 leading-normal">
                  5 to 6.5 hours focused study with comfortable pauses and light pace.
                </p>
              </div>

              <div
                onClick={() => setOutputMode('accelerated')}
                className={`p-3 rounded-md border cursor-pointer transition-all ${
                  outputMode === 'accelerated'
                    ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/40'
                    : 'bg-[#090a10] border-subtle hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-heading">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>Accelerated Sprint</span>
                </div>
                <p className="text-[11px] text-secondary mt-1 leading-normal">
                  8.5+ hours marathon problem solving sprint for intense revision days.
                </p>
              </div>
            </div>
          </div>

          {/* 3. TARGET SLEEP TIME */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-primary font-heading">
                3. Target Bedtime (Sleep Boundary)
              </label>
              <span className="text-[11px] font-mono text-tertiary">
                Wake tomorrow: {profile.wakeTime}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                onClick={() => setBedtimeChoice('recommended')}
                className={`p-3 rounded-md border cursor-pointer transition-all ${
                  bedtimeChoice === 'recommended'
                    ? 'bg-indigo-950/40 border-indigo-500/60'
                    : 'bg-[#090a10] border-subtle'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`check-circle ${bedtimeChoice === 'recommended' ? 'checked' : ''}`}>
                      {bedtimeChoice === 'recommended' && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-primary">Recommended Bedtime: </span>
                      <strong className="text-accent font-mono text-xs">{recommendedTimeStr}</strong>
                    </div>
                  </div>
                  <span className="pill pill-indigo text-[9px] font-mono">Dynamic</span>
                </div>
              </div>

              <div
                onClick={() => setBedtimeChoice('custom')}
                className={`p-3 rounded-md border cursor-pointer transition-all ${
                  bedtimeChoice === 'custom'
                    ? 'bg-indigo-950/40 border-indigo-500/60'
                    : 'bg-[#090a10] border-subtle'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`check-circle ${bedtimeChoice === 'custom' ? 'checked' : ''}`}>
                      {bedtimeChoice === 'custom' && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-xs font-semibold text-primary">Custom Bedtime:</span>
                  </div>
                  <input
                    type="time"
                    value={customBedtime}
                    onChange={(e) => {
                      setBedtimeChoice('custom');
                      setCustomBedtime(e.target.value);
                    }}
                    className="text-xs font-mono py-0.5 px-2 bg-black border border-subtle rounded text-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. LIVE SCHEDULE PROJECTION & INDIAN MEAL SUMMARY */}
          <div className="p-4 rounded-md bg-[#090a10] border border-indigo-500/20 space-y-2.5 text-xs">
            <div className="flex items-center justify-between font-mono pb-2 border-b border-subtle">
              <span className="text-secondary">Projected High-Yield Study Time:</span>
              <strong className="text-emerald-400 text-sm font-bold">{protocol.projectedStudyHours} Hours</strong>
            </div>

            <div className="flex items-center justify-between font-mono text-tertiary text-[11px]">
              <span>Active Study Window:</span>
              <span className="text-primary font-medium">{formatMinutesToHours(availableMinutes)} (from {selectedWakeTime} to {activeBedtime})</span>
            </div>

            <div className="pt-2 border-t border-subtle space-y-1.5">
              <div className="text-[11px] font-semibold text-secondary flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                <span>Indian Meal & Refreshment Landmark Schedule:</span>
              </div>
              <p className="text-[11px] text-tertiary leading-relaxed pl-5">
                {protocol.mealRecommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-subtle">
          <button
            onClick={onClose}
            className="btn-ghost text-xs px-3.5 py-2 text-secondary hover:text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="btn-primary text-xs px-5 py-2.5 font-semibold flex items-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Generate Optimized Schedule ({protocol.projectedStudyHours}h Output)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
