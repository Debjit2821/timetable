import React, { useState, useMemo } from 'react';
import { Subject, Topic, DailyPlan } from '../../types';
import { 
  Check, 
  BookOpen, 
  Layers, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  Search, 
  CheckCircle2, 
  RotateCcw,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { PlannerEngine } from '../../services/plannerEngine';

interface TopicChapterTrackerProps {
  syllabus: Subject[];
  plan: DailyPlan;
  onToggleChapter: (topicId: string, chapterName: string) => void;
}

export const TopicChapterTracker: React.FC<TopicChapterTrackerProps> = ({
  syllabus,
  plan,
  onToggleChapter
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const allTopics = useMemo(() => syllabus.flatMap(s => s.topics), [syllabus]);

  // Identify today's targeted topics from timeblocks
  const todayTopicIds = useMemo(() => {
    const ids = new Set<string>();
    plan.timeBlocks.forEach(b => {
      if (b.topicId) ids.add(b.topicId);
    });
    return Array.from(ids);
  }, [plan.timeBlocks]);

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  // Filter topics based on selection/search
  const filteredTopics = useMemo(() => {
    return allTopics.filter(t => {
      const matchSubject = selectedSubjectId === 'all' || t.subjectId === selectedSubjectId;
      const matchSearch = searchQuery === '' || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.studyBreakdown && t.studyBreakdown.some(st => st.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchSubject && matchSearch;
    });
  }, [allTopics, selectedSubjectId, searchQuery]);

  // Topics targeted for today or currently in progress
  const priorityTopics = useMemo(() => {
    return allTopics.filter(t => 
      todayTopicIds.includes(t.id) || 
      t.status === 'in_progress' || 
      (t.completedTasks && t.completedTasks.length > 0 && t.status !== 'completed')
    );
  }, [allTopics, todayTopicIds]);

  const totalChaptersCount = useMemo(() => {
    return allTopics.reduce((sum, t) => sum + (t.studyBreakdown || t.subtopics || []).length, 0);
  }, [allTopics]);

  const completedChaptersCount = useMemo(() => {
    return allTopics.reduce((sum, t) => sum + (t.completedTasks || []).length, 0);
  }, [allTopics]);

  return (
    <div className="panel p-5 sm:p-6 bg-[#11131c] border-subtle space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-primary font-heading tracking-tight">
                Topic & Chapter Completion Tracker
              </h2>
              <span className="pill pill-indigo text-[11px] font-mono font-medium">
                Auto-Rescheduling Active
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Tick chapters you completed today. The scheduler takes note of any unfinished chapters and automatically reschedules them so you never miss a topic.
            </p>
          </div>
        </div>

        {/* Global Chapter Progress Metric */}
        <div className="flex items-center gap-2 self-start sm:self-center font-mono text-xs text-secondary shrink-0">
          <span className="text-tertiary">Chapters Done:</span>
          <span className="text-emerald-400 font-bold">{completedChaptersCount} / {totalChaptersCount}</span>
        </div>
      </div>

      {/* 1. Today's Planned & In-Progress Priority Topics */}
      {priorityTopics.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-[11.5px] font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Today's Target & In-Progress Chapters:</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {priorityTopics.map(topic => {
              const breakdown = PlannerEngine.getTopicChapterBreakdown(topic);
              const chapters = topic.studyBreakdown || topic.subtopics || [];
              const isDone = topic.status === 'completed';

              return (
                <div 
                  key={topic.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isDone 
                      ? 'bg-emerald-950/20 border-emerald-500/30' 
                      : 'bg-[#0b0d16] border-indigo-500/30 ring-1 ring-inset ring-indigo-500/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-subtle">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="pill text-[11px] font-mono font-medium">{topic.subjectName}</span>
                      <span className="text-sm font-bold text-primary font-heading">{topic.name}</span>
                      {isDone ? (
                        <span className="pill pill-emerald text-[11px] font-medium">✓ Topic Mastered (100%)</span>
                      ) : (
                        <span className="pill pill-indigo text-[11px] font-medium">
                          {breakdown.completed.length}/{breakdown.total} chapters ({breakdown.percent}%)
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-secondary font-mono">
                      {isDone ? (
                        <span className="text-emerald-400 font-medium">Ready for Spaced Revision</span>
                      ) : (
                        <span className="text-amber-300 font-medium">
                          {breakdown.remaining.length} chapter{breakdown.remaining.length > 1 ? 's' : ''} left
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chapter Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                    {chapters.map((chapterName, idx) => {
                      const isChapterCompleted = (topic.completedTasks || []).includes(chapterName);

                      return (
                        <label
                          key={idx}
                          onClick={() => onToggleChapter(topic.id, chapterName)}
                          className={`p-2.5 rounded-md border flex items-start gap-2.5 cursor-pointer text-xs transition-all ${
                            isChapterCompleted
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-subtle border-subtle text-secondary hover:border-indigo-500/30 hover:text-primary'
                          }`}
                        >
                          <div className={`check-circle mt-0.5 shrink-0 ${isChapterCompleted ? 'checked' : ''}`}>
                            {isChapterCompleted && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div className="leading-snug">
                            <span className={isChapterCompleted ? 'line-through text-emerald-300/90 font-medium' : 'font-normal'}>
                              {chapterName}
                            </span>
                          </div>
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

      {/* 2. Browse & Mark Any Syllabus Chapter */}
      <div className="pt-2 border-t border-subtle space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="text-xs font-semibold text-primary font-heading">
            Browse All 11 Sections to Mark Any Chapter Done:
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-tertiary absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topic or chapter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-8 text-xs py-1.5 w-full"
              />
            </div>

            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="input text-xs py-1.5 w-36 bg-[#141724]"
            >
              <option value="all">All Sections</option>
              {syllabus.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtered Topics List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredTopics.slice(0, 15).map(topic => {
            const isExpanded = !!expandedTopics[topic.id];
            const breakdown = PlannerEngine.getTopicChapterBreakdown(topic);
            const chapters = topic.studyBreakdown || topic.subtopics || [];
            const isDone = topic.status === 'completed';

            return (
              <div 
                key={topic.id}
                className="panel p-3 bg-subtle border-subtle hover:border-white/10 transition-colors"
              >
                <div 
                  onClick={() => toggleTopicExpand(topic.id)}
                  className="flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <button className="text-secondary hover:text-primary shrink-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <span className="pill text-[10px] font-mono shrink-0">{topic.subjectName}</span>
                    <span className={`text-xs font-semibold truncate ${isDone ? 'text-secondary line-through' : 'text-primary'}`}>
                      {topic.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
                    <span className={isDone ? 'text-emerald-400 font-medium' : 'text-secondary'}>
                      {breakdown.completed.length}/{breakdown.total} done ({breakdown.percent}%)
                    </span>
                  </div>
                </div>

                {/* Expanded Chapters */}
                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 mt-2.5 border-t border-subtle">
                    {chapters.map((chapterName, idx) => {
                      const isChapterCompleted = (topic.completedTasks || []).includes(chapterName);

                      return (
                        <label
                          key={idx}
                          onClick={() => onToggleChapter(topic.id, chapterName)}
                          className={`p-2 rounded border flex items-start gap-2 cursor-pointer text-xs transition-all ${
                            isChapterCompleted
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-white/[0.01] border-subtle text-secondary hover:text-primary'
                          }`}
                        >
                          <div className={`check-circle mt-0.5 shrink-0 ${isChapterCompleted ? 'checked' : ''}`}>
                            {isChapterCompleted && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className={isChapterCompleted ? 'line-through text-emerald-300 font-medium' : ''}>
                            {chapterName}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
