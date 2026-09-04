import React from 'react';
import { 
  X, 
  Check, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { DailyPlan, UserProfile } from '../../types';
import { formatMinutesToHours } from '../../utils/dateUtils';

interface DailyReviewModalProps {
  plan: DailyPlan;
  profile: UserProfile;
  healthScore: number;
  dsaSolvedCount: number;
  onClose: () => void;
  onPrepareTomorrow: () => void;
}

export const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  plan,
  profile,
  healthScore,
  dsaSolvedCount,
  onClose,
  onPrepareTomorrow
}) => {
  const completedBlocks = plan.timeBlocks.filter(b => b.isCompleted).length;
  const totalBlocks = plan.timeBlocks.length;
  const studyMinutes = plan.actualStudyMinutes;

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
            Evening Reflection
          </div>
          <h2 className="text-xl font-bold text-primary font-heading">
            Daily Accountability Review
          </h2>
        </div>

        {/* Performance Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="panel p-3 text-center">
            <div className="text-[10px] uppercase font-mono text-tertiary">Study Time</div>
            <div className="text-lg font-bold font-mono text-primary mt-0.5">
              {formatMinutesToHours(studyMinutes)}
            </div>
            <div className="text-[10px] text-tertiary">Target: 4.0h</div>
          </div>

          <div className="panel p-3 text-center">
            <div className="text-[10px] uppercase font-mono text-tertiary">DSA Solved</div>
            <div className="text-lg font-bold font-mono text-primary mt-0.5">
              {dsaSolvedCount} / 3
            </div>
            <div className="text-[10px] text-tertiary">Target: 3</div>
          </div>

          <div className="panel p-3 text-center">
            <div className="text-[10px] uppercase font-mono text-tertiary">Health Score</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {healthScore}%
            </div>
            <div className="text-[10px] text-tertiary">Consistent</div>
          </div>
        </div>

        <div className="p-3.5 rounded-md bg-subtle border border-subtle text-xs text-secondary mb-6 leading-relaxed">
          <strong className="text-primary">Coach Feedback: </strong>
          Great consistency on core GATE concepts today. Rest well tonight ({profile.bedTime}) to consolidate memory schemas.
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="btn-ghost text-xs px-3 py-2"
          >
            Close
          </button>
          <button
            onClick={() => {
              onPrepareTomorrow();
              onClose();
            }}
            className="btn-primary text-xs px-4 py-2"
          >
            <span>Prepare Tomorrow's Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
