import React, { useMemo } from 'react';
import { 
  X, 
  Check, 
  ArrowRight, 
  Sparkles,
  Layers,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { DailyPlan, UserProfile, Subject } from '../../types';
import { formatMinutesToHours } from '../../utils/dateUtils';
import { PlannerEngine } from '../../services/plannerEngine';

interface DailyReviewModalProps {
  plan: DailyPlan;
  profile: UserProfile;
  healthScore: number;
  dsaSolvedCount: number;
  syllabus?: Subject[];
  onToggleChapter?: (topicId: string, chapterName: string) => void;
  onClose: () => void;
  onPrepareTomorrow: () => void;
}

export const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  plan,
  profile,
  healthScore,
  dsaSolvedCount,
  syllabus = [],
  onToggleChapter,
  onClose,
  onPrepareTomorrow
}) => {
  const completedBlocks = plan.timeBlocks.filter(b => b.isCompleted).length;
  const totalBlocks = plan.timeBlocks.length;
  const studyMinutes = plan.actualStudyMinutes;

  // Find topics targeted today
  const allTopics = useMemo(() => syllabus.flatMap(s => s.topics), [syllabus]);
  const todayTopicIds = useMemo(() => {
    const ids = new Set<string>();
    plan.timeBlocks.forEach(b => {
      if (b.topicId) ids.add(b.topicId);
    });
    return Array.from(ids);
  }, [plan.timeBlocks]);

  const targetTopics = useMemo(() => {
    return allTopics.filter(t => todayTopicIds.includes(t.id));
  }, [allTopics, todayTopicIds]);

  return (
    <div className="modal-overlay">
      <div className="panel max-w-xl w-full p-6 relative bg-[#11131c] border-muted shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-tertiary hover:text-primary p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-1 flex items-center gap-1.5 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Evening Reflection & Topic Audit</span>
          </div>
          <h2 className="text-xl font-bold text-primary font-heading">
            Daily Accountability Review
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Tick off any chapters completed today. The scheduler will automatically reschedule any unfinished chapters into tomorrow's plan.
          </p>
        </div>

        {/* Performance Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="panel p-3 text-center bg-subtle">
            <div className="text-[11px] uppercase font-mono text-tertiary">Study Time</div>
            <div className="text-lg font-bold font-mono text-primary mt-0.5">
              {formatMinutesToHours(studyMinutes)}
            </div>
            <div className="text-[11px] text-secondary">Target: {formatMinutesToHours(profile.dailyTargetStudyMinutes)}</div>
          </div>

          <div className="panel p-3 text-center bg-subtle">
            <div className="text-[11px] uppercase font-mono text-tertiary">DSA Solved</div>
            <div className="text-lg font-bold font-mono text-primary mt-0.5">
              {dsaSolvedCount} / 3
            </div>
            <div className="text-[11px] text-secondary">Target: {profile.dsaDailyCount}</div>
          </div>

          <div className="panel p-3 text-center bg-subtle">
            <div className="text-[11px] uppercase font-mono text-tertiary">Health Score</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {healthScore}%
            </div>
            <div className="text-[11px] text-secondary">Consistent</div>
          </div>
        </div>

        {/* Today's Topic & Chapter Review Checklist */}
        {targetTopics.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary font-heading flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent" />
                <span>Today's Topic & Chapter Checklist:</span>
              </span>
              <span className="text-[11px] font-mono text-tertiary">
                Click to tick finished
              </span>
            </div>

            <div className="space-y-2.5">
              {targetTopics.map(topic => {
                const breakdown = PlannerEngine.getTopicChapterBreakdown(topic);
                const chapters = topic.studyBreakdown || topic.subtopics || [];

                return (
                  <div key={topic.id} className="p-3.5 rounded-lg bg-[#0b0d16] border border-subtle space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="pill text-[10px] font-mono">{topic.subjectName}</span>
                        <span className="text-xs font-bold text-primary truncate">{topic.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold shrink-0">
                        {breakdown.completed.length}/{breakdown.total} done ({breakdown.percent}%)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {chapters.map((ch, i) => {
                        const isDone = (topic.completedTasks || []).includes(ch);
                        return (
                          <label
                            key={i}
                            onClick={() => onToggleChapter && onToggleChapter(topic.id, ch)}
                            className={`p-2 rounded border flex items-start gap-2 cursor-pointer text-xs transition-all ${
                              isDone
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-subtle border-subtle text-secondary hover:text-primary'
                            }`}
                          >
                            <div className={`check-circle mt-0.5 shrink-0 ${isDone ? 'checked' : ''}`}>
                              {isDone && <Check className="w-3 h-3" />}
                            </div>
                            <span className={isDone ? 'line-through text-emerald-300/90' : ''}>{ch}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-3.5 rounded-md bg-subtle border border-subtle text-xs text-secondary mb-5 leading-relaxed">
          <strong className="text-primary">Scheduler Note: </strong>
          Any uncompleted chapters will automatically be carried over and prioritized in tomorrow's plan. Rest well tonight ({profile.bedTime}) to consolidate memory schemas.
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
            className="btn-primary text-xs px-4 py-2 font-medium"
          >
            <span>Prepare Tomorrow's Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
