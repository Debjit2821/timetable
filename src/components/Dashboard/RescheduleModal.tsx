import React from 'react';
import { 
  X, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { AdaptationReport } from '../../services/adaptationEngine';

interface RescheduleModalProps {
  report: AdaptationReport;
  onClose: () => void;
  onApplyRedistribution: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  report,
  onClose,
  onApplyRedistribution
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
            Intelligent Schedule Adaptation
          </div>
          <h2 className="text-xl font-bold text-primary font-heading">
            Pace & Timeline Review
          </h2>
        </div>

        {/* Situation Message */}
        <div className="p-3.5 rounded-md bg-subtle border border-subtle text-xs text-secondary mb-4 leading-relaxed">
          {report.adaptationMessage}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
          <div className="panel p-3">
            <div className="text-tertiary">Current Daily Pace</div>
            <div className="text-base font-semibold font-mono text-primary mt-0.5">
              {Math.floor(report.currentPaceMinutesPerDay / 60)}h {report.currentPaceMinutesPerDay % 60}m / day
            </div>
          </div>

          <div className="panel p-3">
            <div className="text-tertiary">Required Daily Pace</div>
            <div className="text-base font-semibold font-mono text-accent mt-0.5">
              {Math.floor(report.requiredPaceMinutesPerDay / 60)}h {report.requiredPaceMinutesPerDay % 60}m / day
            </div>
          </div>
        </div>

        {/* Recommended Action */}
        <div className="p-3.5 rounded-md bg-subtle border border-subtle text-xs text-secondary mb-6">
          <div className="font-semibold text-primary mb-1">Non-Punitive Adaptation Strategy:</div>
          <p className="text-tertiary">{report.redistributionAction}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="btn-ghost text-xs px-3 py-2"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              onApplyRedistribution();
              onClose();
            }}
            className="btn-primary text-xs px-4 py-2"
          >
            <span>Apply Adaptation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
