import React, { useState } from 'react';
import { 
  Sparkles, 
  Droplet, 
  Utensils, 
  ShieldCheck, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Clock, 
  Sun,
  Coffee,
  X
} from 'lucide-react';
import { WakeUpProtocol, WakeUpStep } from '../../types';

interface WakeUpGuideCardProps {
  protocol: WakeUpProtocol;
  onDismiss?: () => void;
  onStartFocus?: () => void;
}

export const WakeUpGuideCard: React.FC<WakeUpGuideCardProps> = ({
  protocol,
  onDismiss,
  onStartFocus
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepNum: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  const getStepIcon = (category: WakeUpStep['category']) => {
    switch (category) {
      case 'hydration':
        return <Droplet className="w-4 h-4 text-cyan-400" />;
      case 'nutrition':
        return <Utensils className="w-4 h-4 text-amber-400" />;
      case 'mindset':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'focus':
        return <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />;
      default:
        return <Sparkles className="w-4 h-4 text-accent" />;
    }
  };

  return (
    <div className="panel p-5 sm:p-6 bg-gradient-to-r from-indigo-950/40 via-[#111424] to-[#0d0f18] border-indigo-500/30 shadow-xl relative overflow-hidden transition-all">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <Sun className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
                Instant Action Guide
              </span>
              <span className="pill pill-indigo text-[10px] font-mono">
                Woke up at {protocol.wakeTime}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-primary font-heading tracking-tight">
              {protocol.headline}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn-ghost text-xs px-2.5 py-1 text-secondary hover:text-primary flex items-center gap-1"
          >
            <span>{isCollapsed ? 'Expand Steps' : 'Collapse'}</span>
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-tertiary hover:text-primary p-1 rounded hover:bg-white/[0.05]"
              title="Dismiss guide"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Encouraging Mindset Banner */}
      <div className="mt-3.5 p-3 rounded-md bg-indigo-950/50 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-start gap-2 text-indigo-200">
          <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <span>{protocol.mindsetMessage}</span>
        </div>
        <div className="shrink-0 font-mono text-[11px] text-accent bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/30 text-center">
          <strong>{protocol.projectedStudyHours}h</strong> pure study projected today
        </div>
      </div>

      {/* Collapsible Steps Content */}
      {!isCollapsed && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {protocol.immediateSteps.map((step) => {
              const isChecked = !!completedSteps[step.stepNumber];
              return (
                <div
                  key={step.stepNumber}
                  onClick={() => toggleStep(step.stepNumber)}
                  className={`p-3 rounded-md border text-left cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-white/[0.02] border-subtle opacity-60'
                      : 'bg-[#090b12] border-subtle hover:border-indigo-500/40 hover:bg-indigo-950/20'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      className={`check-circle mt-0.5 shrink-0 ${isChecked ? 'checked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStep(step.stepNumber);
                      }}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getStepIcon(step.category)}
                        <span className="text-xs font-semibold text-primary font-heading">
                          Step {step.stepNumber}: {step.title}
                        </span>
                        <span className="text-[10px] font-mono text-tertiary">
                          ({step.timeframe})
                        </span>
                      </div>
                      <p className="text-[11px] text-secondary leading-relaxed">
                        {step.action}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indian Meal Schedule Summary Strip */}
          {protocol.mealRecommendation && (
            <div className="p-3 rounded-md bg-[#090b12] border border-subtle flex items-center justify-between gap-3 text-xs text-secondary">
              <div className="flex items-center gap-2">
                <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-secondary leading-normal">
                  <strong className="text-primary font-medium">Indian Routine Rhythm: </strong>
                  {protocol.mealRecommendation}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
