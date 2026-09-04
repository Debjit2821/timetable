import React, { useState } from 'react';
import { 
  KnowledgeSource 
} from '../../types';
import { 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileText
} from 'lucide-react';
import { UpdateReviewModal } from './UpdateReviewModal';

interface SourceTransparencyProps {
  sources: KnowledgeSource[];
  onTriggerSync: () => void;
  onApplyUpdate: (sourceId: string) => void;
  isSyncing: boolean;
}

export const SourceTransparency: React.FC<SourceTransparencyProps> = ({
  sources,
  onTriggerSync,
  onApplyUpdate,
  isSyncing
}) => {
  const [activeReviewSource, setActiveReviewSource] = useState<KnowledgeSource | null>(null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-subtle pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-tertiary mb-1">
            Authoritative Internet Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-primary tracking-tight">
            Knowledge Sources & Transparency
          </h1>
        </div>

        <button
          onClick={onTriggerSync}
          className="btn-secondary text-xs px-3 py-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-accent' : ''}`} />
          <span>{isSyncing ? 'Checking...' : 'Check Official Feeds'}</span>
        </button>
      </div>

      {/* Sources List */}
      <div className="space-y-3">
        {sources.map(source => {
          const hasUpdate = source.status === 'update_available';

          return (
            <div key={source.id} className="panel p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-primary font-heading">
                      {source.name}
                    </h3>
                    <span className="pill text-[10px] font-mono">{source.version}</span>
                    {hasUpdate ? (
                      <span className="pill pill-amber text-[10px]">Update Available</span>
                    ) : (
                      <span className="pill pill-emerald text-[10px]">Verified Official</span>
                    )}
                  </div>

                  <div className="text-xs text-secondary mt-1">
                    <strong>Authority: </strong>{source.authority}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasUpdate && (
                    <button
                      onClick={() => setActiveReviewSource(source)}
                      className="btn-primary text-xs px-2.5 py-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Review Diff</span>
                    </button>
                  )}

                  <a
                    href={source.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost text-xs px-2 py-1"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <p className="text-xs text-secondary">
                {source.description}
              </p>

              <div className="pt-2 border-t border-subtle text-[11px] text-tertiary flex items-center justify-between font-mono">
                <span>Last verified: {source.lastCheckedDate}</span>
                <span>Deterministic offline cache</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {activeReviewSource && (
        <UpdateReviewModal
          source={activeReviewSource}
          onClose={() => setActiveReviewSource(null)}
          onApplyUpdate={(id) => {
            onApplyUpdate(id);
            setActiveReviewSource(null);
          }}
        />
      )}
    </div>
  );
};
