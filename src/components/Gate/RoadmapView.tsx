import React from 'react';
import { 
  Subject, 
  UserProfile 
} from '../../types';
import { 
  Check, 
  Layers
} from 'lucide-react';
import { PlannerEngine } from '../../services/plannerEngine';

interface RoadmapViewProps {
  syllabus: Subject[];
  profile: UserProfile;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ syllabus, profile }) => {
  const { currentDay, totalDays } = PlannerEngine.getDayNumber(profile.startDate);
  const phases = PlannerEngine.getPhases(syllabus, totalDays, currentDay);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-subtle pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-tertiary mb-1">
            Dynamic 5-Phase Preparation Framework
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-primary tracking-tight">
            Preparation Roadmap
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-secondary font-mono">
          <span className="text-tertiary">Current: </span>
          <span className="text-primary font-medium">Day {currentDay} of {totalDays}</span>
        </div>
      </div>

      {/* 5-Phase Clean Timeline Cards */}
      <div className="space-y-3">
        {phases.map((phase, idx) => {
          const isDone = currentDay > phase.endDay;
          const isCurrent = phase.isCurrent;
          const percent = Math.round((phase.completedTopics / Math.max(phase.totalTopics, 1)) * 100);

          return (
            <div 
              key={phase.phase}
              className={`panel p-4 transition-all ${
                isCurrent ? 'border-accent bg-white/[0.03]' : isDone ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-tertiary">0{idx + 1}</span>
                  <h3 className="text-sm font-semibold text-primary font-heading">
                    {phase.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="pill font-mono text-[10px]">
                    Days {phase.startDay} – {phase.endDay}
                  </span>
                  {isCurrent && <span className="pill pill-indigo text-[10px]">Active</span>}
                  {isDone && <span className="pill pill-emerald text-[10px]">Completed</span>}
                </div>
              </div>

              <p className="text-xs text-secondary mb-3">
                {phase.description}
              </p>

              {/* Progress Bar */}
              <div className="flex items-center justify-between text-xs text-tertiary pt-2 border-t border-subtle font-mono">
                <span>{phase.completedTopics} / {phase.totalTopics} topics complete</span>
                <span>{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
