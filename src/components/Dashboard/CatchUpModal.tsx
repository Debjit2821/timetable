import React from 'react';
import { 
  X, 
  Zap, 
  Clock, 
  ArrowRight
} from 'lucide-react';
import { LapsedTaskAnalysis } from '../../services/adaptationEngine';
import { formatMinutesToHours } from '../../utils/dateUtils';

interface CatchUpModalProps {
  analysis: LapsedTaskAnalysis;
  currentTimeString: string;
  onClose: () => void;
  onApplyCatchUp: () => void;
}

export const CatchUpModal: React.FC<CatchUpModalProps> = ({
  analysis,
  currentTimeString,
  onClose,
  onApplyCatchUp
}) => {
  return (
    <div className="modal-overlay">
      <div className="panel max-w-lg w-full p-6 relative bg-[#11131c] border-muted shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-tertiary hover:text-primary p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-1">
            Time-Aware Rescheduling
          </div>
          <h2 className="text-xl font-bold text-primary font-heading">
            High-Yield Day Catch-Up
          </h2>
        </div>

        {/* Situation */}
        <div className="p-3.5 rounded-md bg-subtle border border-subtle text-xs text-secondary mb-4 space-y-1">
          <div className="font-semibold text-primary">
            {analysis.lapsedBlocks.length} earlier tasks lapsed past scheduled time ({formatMinutesToHours(analysis.lapsedMinutes)})
          </div>
          <p className="text-tertiary leading-relaxed">
            Applying the Pareto 80/20 principle: compressing remaining uncompleted study tasks into high-intensity concept sprints starting at {currentTimeString}.
          </p>
        </div>

        {/* Changes Summary */}
        <div className="space-y-2 mb-6 text-xs text-secondary">
          <div className="flex items-center justify-between p-2.5 rounded-md bg-subtle">
            <span>GATE Study Sessions</span>
            <span className="font-mono text-primary">45m High-Yield Sprint</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-md bg-subtle">
            <span>DSA Practice</span>
            <span className="font-mono text-primary">45m 3-Problem Drill</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-md bg-subtle">
            <span>Sleep & Rest Routine</span>
            <span className="font-mono text-emerald-400">11:00 PM (Preserved)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="btn-ghost text-xs px-3 py-2"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApplyCatchUp();
              onClose();
            }}
            className="btn-primary text-xs px-4 py-2"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Reschedule from Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
