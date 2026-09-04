import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Check, 
  RotateCcw, 
  Coffee, 
  ArrowRight,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { TimeBlock, DailyPlan } from '../types';
import { soundManager } from '../utils/audioAlerts';
import { formatSecondsToTime } from '../utils/dateUtils';

interface NextActionWidgetProps {
  plan: DailyPlan;
  onCompleteBlock: (blockId: string) => void;
  soundEnabled: boolean;
}

export const NextActionWidget: React.FC<NextActionWidgetProps> = ({
  plan,
  onCompleteBlock,
  soundEnabled
}) => {
  const activeBlock = plan.timeBlocks.find(b => !b.isCompleted);
  const nextBlockIndex = plan.timeBlocks.findIndex(b => !b.isCompleted);
  const upcomingBlock = nextBlockIndex !== -1 && nextBlockIndex + 1 < plan.timeBlocks.length
    ? plan.timeBlocks[nextBlockIndex + 1]
    : null;

  const [isRunning, setIsRunning] = useState(false);
  const [isBreakMode, setIsBreakMode] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    activeBlock ? activeBlock.durationMinutes * 60 : 45 * 60
  );

  const initialDuration = activeBlock ? activeBlock.durationMinutes * 60 : 45 * 60;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeBlock) {
      setIsRunning(false);
      setIsBreakMode(false);
      setSecondsRemaining(activeBlock.durationMinutes * 60);
    }
  }, [activeBlock?.id]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRunning(false);
            if (soundEnabled) {
              if (isBreakMode) soundManager.playBreakTone();
              else soundManager.playSuccessChime();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isBreakMode, soundEnabled]);

  const handleToggleTimer = () => {
    if (!isRunning && soundEnabled) {
      soundManager.playStartFocus();
    }
    setIsRunning(!isRunning);
  };

  const handleStartBreak = () => {
    setIsBreakMode(true);
    setIsRunning(true);
    setSecondsRemaining(5 * 60);
    if (soundEnabled) soundManager.playBreakTone();
  };

  const handleCompleteCurrent = () => {
    if (!activeBlock) return;
    if (soundEnabled) soundManager.playSuccessChime();
    setIsRunning(false);
    onCompleteBlock(activeBlock.id);
  };

  const progressPercent = initialDuration > 0
    ? Math.min(Math.round(((initialDuration - secondsRemaining) / initialDuration) * 100), 100)
    : 0;

  if (!activeBlock) {
    return (
      <div className="panel p-6 border-subtle text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
          <Check className="w-5 h-5" />
        </div>
        <h3 className="text-base font-semibold text-primary font-heading">
          All tasks completed for today.
        </h3>
        <p className="text-xs text-secondary mt-1">
          Tomorrow's plan is prepared and ready.
        </p>
      </div>
    );
  }

  const getCategoryLabel = (block: TimeBlock) => {
    const titleLower = block.title.toLowerCase();
    if (titleLower.includes('lunch')) return '🍛 Indian Lunch';
    if (titleLower.includes('chai') || titleLower.includes('tea')) return '☕ Evening Chai';
    if (titleLower.includes('dinner')) return '🍲 Indian Dinner';
    if (titleLower.includes('kickoff')) return '🌅 Wake-Up Kickoff';

    const categoryLabelMap: Record<string, string> = {
      gate: '⚡ GATE Study',
      dsa: '💻 DSA Practice',
      health: '🏃 Health & Movement',
      break: '☕ Break & Reset',
      revision: '🔁 Spaced Revision',
      routine: 'Daily Routine',
      mock: '📝 Mock Test'
    };

    return categoryLabelMap[block.category] || block.category;
  };

  return (
    <div className="panel p-6 border-subtle bg-[#11131c]/90 relative overflow-hidden">
      {/* Header Label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11.5px] font-bold uppercase tracking-wider text-accent font-mono">
          Next Up
        </span>
        <div className="flex items-center gap-2 text-xs text-tertiary">
          <span className="pill font-mono font-medium">
            {activeBlock.startTime} – {activeBlock.endTime}
          </span>
          <span className="text-tertiary">·</span>
          <span className="font-semibold text-secondary">{getCategoryLabel(activeBlock)}</span>
        </div>
      </div>

      {/* Main Focus Title */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-primary font-heading tracking-tight">
          {activeBlock.title}
        </h2>
        {activeBlock.subtitle && (
          <p className="text-xs text-secondary mt-1 font-normal">
            {activeBlock.subtitle}
          </p>
        )}
      </div>

      {/* Minimal Timer Display */}
      <div className="bg-[#090a0f] p-4 rounded-md border border-subtle mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-secondary font-semibold">
            {isBreakMode ? 'Rest Break' : 'Focus Session'}
          </span>
          <span className="text-xs text-secondary font-mono">
            {activeBlock.durationMinutes} min total
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-primary">
            {formatSecondsToTime(secondsRemaining)}
          </div>
          <span className="text-xs text-secondary font-mono">
            {progressPercent}% elapsed
          </span>
        </div>

        {/* Thin Minimal Progress Bar */}
        <div className="progress-bar-bg mt-3">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleToggleTimer}
          className={`btn-primary flex-1 justify-center py-2.5 text-sm ${
            isRunning ? 'bg-amber-600 hover:bg-amber-500' : ''
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start</span>
            </>
          )}
        </button>

        <button
          onClick={handleCompleteCurrent}
          className="btn-secondary px-4 py-2.5 text-sm text-emerald-400 hover:text-emerald-300 font-semibold"
          title="Mark complete and proceed"
        >
          <Check className="w-4 h-4" />
          <span>Done</span>
        </button>

        <button
          onClick={handleStartBreak}
          className="btn-ghost px-3 py-2.5 text-xs text-secondary hover:text-primary font-medium"
          title="Take 5-minute movement break"
        >
          <Coffee className="w-4 h-4" />
          <span className="hidden sm:inline">5m Break</span>
        </button>

        <button
          onClick={() => {
            setIsRunning(false);
            setSecondsRemaining(activeBlock.durationMinutes * 60);
          }}
          className="btn-ghost px-2.5 py-2.5 text-secondary hover:text-primary"
          title="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Upcoming Action Preview */}
      {upcomingBlock && (
        <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between text-xs text-secondary">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <span className="text-secondary font-semibold">Then:</span>
            <span className="truncate text-secondary">{upcomingBlock.title}</span>
          </div>
          <span className="font-mono text-[11.5px] text-tertiary shrink-0">{upcomingBlock.startTime}</span>
        </div>
      )}
    </div>
  );
};
