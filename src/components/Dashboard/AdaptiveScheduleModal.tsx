import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Moon, 
  Zap, 
  ShieldCheck,
  Check,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { UserProfile, DailyPlan } from '../../types';
import { PlannerEngine } from '../../services/plannerEngine';
import { formatMinutesToHours } from '../../utils/dateUtils';

interface AdaptiveScheduleModalProps {
  plan: DailyPlan;
  profile: UserProfile;
  currentTimeString: string;
  onClose: () => void;
  onApplyAdaptiveSchedule: (options: { startTime?: string; userChosenBedtime?: string; customAvailableMinutes?: number }) => void;
}

export const AdaptiveScheduleModal: React.FC<AdaptiveScheduleModalProps> = ({
  plan,
  profile,
  currentTimeString,
  onClose,
  onApplyAdaptiveSchedule
}) => {
  const [startMode, setStartMode] = useState<'now' | 'custom'>('now');
  const [customStartTime, setCustomStartTime] = useState(currentTimeString);
  const [bedtimeChoice, setBedtimeChoice] = useState<'recommended' | 'custom'>('recommended');
  
  const activeStartTime = startMode === 'now' ? currentTimeString : customStartTime;
  const [sh, sm] = activeStartTime.split(':').map(Number);
  const startMinTotal = (sh || 0) * 60 + (sm || 0);

  // Live dynamic recommended bedtime calculation
  const { recommendedTimeStr, rationale } = PlannerEngine.calculateDynamicRecommendedBedtime(
    plan,
    profile,
    startMinTotal
  );

  const [customBedtime, setCustomBedtime] = useState(recommendedTimeStr);

  const selectedBedtime = bedtimeChoice === 'recommended' ? recommendedTimeStr : customBedtime;

  // Calculate gross available time
  const [eh, em] = selectedBedtime.split(':').map(Number);
  let endMinTotal = (eh || 0) * 60 + (em || 0);
  if (endMinTotal < startMinTotal) endMinTotal += 24 * 60; // crosses midnight
  const availableMinutes = Math.max(endMinTotal - startMinTotal, 30);

  const uncompleted = plan.timeBlocks.filter(b => !b.isCompleted);
  const totalUncompletedMinutes = uncompleted.reduce((sum, b) => sum + b.durationMinutes, 0);
  const isWorkloadExceeding = totalUncompletedMinutes > availableMinutes - 20;

  const handleApply = () => {
    onApplyAdaptiveSchedule({
      startTime: activeStartTime,
      userChosenBedtime: selectedBedtime
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="panel max-w-xl w-full p-6 sm:p-8 relative bg-[#11131c] border-muted shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-tertiary hover:text-primary p-1 rounded-md bg-subtle border border-subtle"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sleep-Driven Adaptive Scheduling</span>
          </div>
          <h2 className="text-2xl font-bold text-primary font-heading">
            Adapt Today's Schedule Around Sleep
          </h2>
          <p className="text-xs text-secondary mt-1">
            Choose your sleep time or use the dynamic recommendation. GatePlanner will build your remaining day to finish before bedtime.
          </p>
        </div>

        <div className="space-y-5 mb-6">
          {/* 1. START TIME */}
          <div>
            <label className="block text-xs font-semibold text-primary font-heading mb-2">
              1. Current Study Session Start Time
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStartMode('now')}
                className={`p-3 rounded-md border text-left text-xs transition-all ${
                  startMode === 'now' 
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-primary font-semibold' 
                    : 'bg-subtle border-subtle text-secondary'
                }`}
              >
                <div className="text-accent font-mono text-[11px] mb-0.5">Start Now</div>
                <div>Right Now ({currentTimeString})</div>
              </button>

              <button
                type="button"
                onClick={() => setStartMode('custom')}
                className={`p-3 rounded-md border text-left text-xs transition-all ${
                  startMode === 'custom' 
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-primary font-semibold' 
                    : 'bg-subtle border-subtle text-secondary'
                }`}
              >
                <div className="text-tertiary font-mono text-[11px] mb-0.5">Custom Start</div>
                <input
                  type="time"
                  value={customStartTime}
                  onChange={e => {
                    setStartMode('custom');
                    setCustomStartTime(e.target.value);
                  }}
                  className="bg-transparent border-0 p-0 text-xs font-mono text-primary outline-none"
                />
              </button>
            </div>
          </div>

          {/* 2. DYNAMIC RECOMMENDED SLEEP TIME vs USER-CHOSEN SLEEP TIME */}
          <div>
            <label className="block text-xs font-semibold text-primary font-heading mb-2">
              2. Target Sleep Time (Drives Remaining Schedule)
            </label>

            <div className="space-y-2.5">
              {/* Option A: Recommended Sleep Time */}
              <div 
                onClick={() => setBedtimeChoice('recommended')}
                className={`p-3.5 rounded-md border cursor-pointer transition-all ${
                  bedtimeChoice === 'recommended'
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-sm'
                    : 'bg-subtle border-subtle hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`check-circle ${bedtimeChoice === 'recommended' ? 'checked' : ''}`}>
                      {bedtimeChoice === 'recommended' && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-primary flex items-center gap-2">
                        <span>Recommended Sleep Time:</span>
                        <span className="text-accent font-mono font-bold text-sm">{recommendedTimeStr}</span>
                      </div>
                      <p className="text-[11px] text-tertiary mt-0.5">
                        {rationale}
                      </p>
                    </div>
                  </div>

                  <span className="pill pill-indigo text-[10px] hidden sm:inline font-mono">Dynamic</span>
                </div>
              </div>

              {/* Option B: User-Selected Sleep Time */}
              <div 
                onClick={() => setBedtimeChoice('custom')}
                className={`p-3.5 rounded-md border cursor-pointer transition-all ${
                  bedtimeChoice === 'custom'
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-sm'
                    : 'bg-subtle border-subtle hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`check-circle ${bedtimeChoice === 'custom' ? 'checked' : ''}`}>
                      {bedtimeChoice === 'custom' && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      Choose My Sleep Time:
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={customBedtime}
                      onChange={e => {
                        setBedtimeChoice('custom');
                        setCustomBedtime(e.target.value);
                      }}
                      className="text-xs font-mono py-1 px-2.5 bg-[#090a0f] border border-subtle rounded text-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. LIVE AVAILABLE TIME PREVIEW & WORKLOAD CHECK */}
          <div className="p-3.5 rounded-md bg-[#090a0f] border border-subtle space-y-2 text-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="text-tertiary">Calculated Available Window:</span>
              <strong className="text-primary">{formatMinutesToHours(availableMinutes)}</strong>
            </div>

            <div className="flex items-center justify-between font-mono">
              <span className="text-tertiary">Selected Bedtime:</span>
              <strong className="text-accent">{selectedBedtime} (Wake {profile.wakeTime})</strong>
            </div>

            {isWorkloadExceeding ? (
              <div className="pt-2 border-t border-subtle text-[11px] text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Your remaining workload ({formatMinutesToHours(totalUncompletedMinutes)}) is greater than available time. GatePlanner will prioritize core GATE & DSA, and defer overflow to future buffer sessions to protect your sleep.
                </span>
              </div>
            ) : (
              <div className="pt-2 border-t border-subtle text-[11px] text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>All remaining focus blocks and breaks fit cleanly before {selectedBedtime}.</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="btn-ghost text-xs px-3 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="btn-primary text-xs px-4 py-2"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Generate Schedule Before {selectedBedtime}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
