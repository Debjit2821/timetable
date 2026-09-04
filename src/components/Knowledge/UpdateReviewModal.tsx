import React from 'react';
import { 
  X, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { KnowledgeSource } from '../../types';

interface UpdateReviewModalProps {
  source: KnowledgeSource;
  onClose: () => void;
  onApplyUpdate: (sourceId: string) => void;
}

export const UpdateReviewModal: React.FC<UpdateReviewModalProps> = ({
  source,
  onClose,
  onApplyUpdate
}) => {
  const diff = source.pendingDiff;

  return (
    <div className="modal-overlay">
      <div className="panel max-w-xl w-full p-6 relative bg-[#11131c] border-muted shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-tertiary hover:text-primary p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-1">
            Authoritative Feed Sync
          </div>
          <h2 className="text-xl font-bold text-primary font-heading">
            Official Syllabus Update
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            {source.name} · {source.authority}
          </p>
        </div>

        {/* Diff Details */}
        {diff ? (
          <div className="space-y-3 mb-6">
            <div className="p-3 rounded-md bg-subtle border border-subtle text-xs text-secondary">
              <div className="font-semibold text-primary mb-1">Official Summary:</div>
              <p className="text-tertiary">{diff.summary}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-tertiary font-mono">
                Detected Changes:
              </div>
              <div className="panel divide-y divide-subtle max-h-48 overflow-y-auto">
                {diff.changes.map((change, i) => (
                  <div key={i} className="p-2.5 text-xs flex items-start gap-2">
                    <span className={`pill text-[10px] shrink-0 ${change.type === 'added' ? 'pill-emerald' : 'pill-amber'}`}>
                      {change.type}
                    </span>
                    <span className="text-secondary">{change.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-md bg-subtle text-xs text-secondary mb-6">
            No active diff pending. Your syllabus is up to date with official releases.
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-subtle">
          <a
            href={source.officialUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-tertiary hover:text-secondary flex items-center gap-1"
          >
            <span>Verify on official website</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={() => onApplyUpdate(source.id)}
              className="btn-primary text-xs px-4 py-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply & Recalibrate Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
