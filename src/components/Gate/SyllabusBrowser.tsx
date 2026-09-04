import React, { useState } from 'react';
import { 
  Subject, 
  Topic 
} from '../../types';
import { 
  Check, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Layers,
  FileText,
  BookOpen
} from 'lucide-react';
import { formatMinutesToHours } from '../../utils/dateUtils';

interface SyllabusBrowserProps {
  syllabus: Subject[];
  onUpdateTopicStatus: (topicId: string, status: Topic['status'], pyqSolved?: number) => void;
}

export const SyllabusBrowser: React.FC<SyllabusBrowserProps> = ({
  syllabus,
  onUpdateTopicStatus
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const toggleExpand = (topicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const allTopics = syllabus.flatMap(s => s.topics);
  const totalTopics = allTopics.length;
  const completedTopics = allTopics.filter(t => t.status === 'completed').length;
  const totalSyllabusMinutes = allTopics.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const totalPYQs = allTopics.reduce((acc, t) => acc + t.pyqTotal, 0);
  const solvedPYQs = allTopics.reduce((acc, t) => acc + t.pyqSolved, 0);
  const coveragePercent = Math.round((completedTopics / Math.max(totalTopics, 1)) * 100);

  const filteredSubjects = syllabus.map(subject => {
    const matchesSubject = selectedSubjectId === 'all' || subject.id === selectedSubjectId;
    if (!matchesSubject) return null;

    const filteredTopics = subject.topics.filter(topic => {
      const matchSearch = topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.officialSyllabusText && topic.officialSyllabusText.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (topic.studyBreakdown && topic.studyBreakdown.some(st => st.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (topic.subtopics && topic.subtopics.some(st => st.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchSearch;
    });

    if (filteredTopics.length === 0 && searchQuery) return null;

    return {
      ...subject,
      topics: filteredTopics
    };
  }).filter(Boolean) as Subject[];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-subtle pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-tertiary mb-1">
            Official GATE 2027 Computer Science & IT (CS) — 11 Sections
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-primary tracking-tight">
            Official GATE Syllabus & Study Breakdown
          </h1>
        </div>

        {/* Minimal Progress Summary */}
        <div className="flex items-center gap-5 text-xs text-secondary font-mono">
          <div>
            <span className="text-tertiary">Progress: </span>
            <span className="text-primary font-medium">{completedTopics}/{totalTopics} ({coveragePercent}%)</span>
          </div>
          <div>
            <span className="text-tertiary">Est. Time: </span>
            <span className="text-primary font-medium">{formatMinutesToHours(totalSyllabusMinutes)}</span>
          </div>
          <div>
            <span className="text-tertiary">PYQs: </span>
            <span className="text-emerald-400 font-medium">{solvedPYQs}/{totalPYQs}</span>
          </div>
        </div>
      </div>

      {/* Search & Subject Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topics or subtopics..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={`btn-ghost text-xs px-2.5 py-1 ${selectedSubjectId === 'all' ? 'bg-white/10 text-primary font-semibold' : 'text-tertiary'}`}
          >
            All (11)
          </button>
          {syllabus.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSubjectId(s.id)}
              className={`btn-ghost text-xs px-2.5 py-1 ${selectedSubjectId === s.id ? 'bg-white/10 text-primary font-semibold' : 'text-tertiary'}`}
            >
              {s.code}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Subjects & Topics List */}
      <div className="space-y-4">
        {filteredSubjects.map(subject => {
          const subjectCompleted = subject.topics.filter(t => t.status === 'completed').length;
          const subjectTotal = subject.topics.length;
          const subjectPercent = Math.round((subjectCompleted / Math.max(subjectTotal, 1)) * 100);

          return (
            <div key={subject.id} className="panel overflow-hidden">
              {/* Subject Title Bar */}
              <div className="p-3.5 bg-subtle border-b border-subtle flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="pill font-mono font-semibold">
                    Section {subject.officialSectionNumber || subject.order}: {subject.code}
                  </span>
                  <span className="text-sm font-semibold text-primary font-heading">
                    {subject.name}
                  </span>
                  <span className="text-xs text-tertiary">
                    · ~{subject.weightage}% marks
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-tertiary">
                  <span>{subjectCompleted}/{subjectTotal} done</span>
                  <div className="w-16 h-1.5 progress-bar-bg hidden sm:block">
                    <div className="progress-bar-fill" style={{ width: `${subjectPercent}%` }} />
                  </div>
                </div>
              </div>

              {/* Topics Rows */}
              <div className="divide-y divide-subtle">
                {subject.topics.map(topic => {
                  const isDone = topic.status === 'completed';
                  const isExpanded = !!expandedTopics[topic.id];
                  const studyTasks = topic.studyBreakdown || topic.subtopics || [];

                  return (
                    <div key={topic.id} className="p-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div 
                          className="flex items-start gap-2.5 cursor-pointer flex-1"
                          onClick={() => toggleExpand(topic.id)}
                        >
                          <button className="mt-0.5 text-tertiary hover:text-primary">
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-medium ${isDone ? 'text-secondary' : 'text-primary'}`}>
                                {topic.name}
                              </span>
                              <span className="pill text-[10px]">{topic.importance}</span>
                              <span className="text-[11px] text-tertiary font-mono">Diff: {topic.difficulty}/5</span>
                              {topic.revisionLevel > 0 && (
                                <span className="pill pill-indigo text-[10px]">Rev #{topic.revisionLevel}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-tertiary mt-0.5">
                              <span>{formatMinutesToHours(topic.estimatedMinutes)}</span>
                              <span>·</span>
                              <span>{studyTasks.length} study tasks</span>
                              <span>·</span>
                              <span>PYQs: {topic.pyqSolved}/{topic.pyqTotal}</span>
                            </div>
                          </div>
                        </div>

                        {/* Complete Action Button */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => onUpdateTopicStatus(
                              topic.id,
                              isDone ? 'not_started' : 'completed',
                              isDone ? 0 : topic.pyqTotal
                            )}
                            className={`btn-ghost text-xs px-2.5 py-1 ${isDone ? 'text-emerald-400 bg-emerald-500/10' : 'text-secondary'}`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{isDone ? 'Done' : 'Mark Done'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Section: Official Syllabus Text vs GatePlanner Study Breakdown */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-subtle pl-6 space-y-3 text-xs">
                          {/* 1. Faithful Official GATE 2027 Text */}
                          {topic.officialSyllabusText && (
                            <div className="p-3 rounded-md bg-[#090a0f] border border-subtle text-secondary">
                              <div className="text-[11px] font-semibold text-accent uppercase font-mono mb-1 flex items-center gap-1.5">
                                <BookOpen className="w-3 h-3" />
                                <span>Official GATE 2027 Syllabus (Source: IIT Madras)</span>
                              </div>
                              <p className="text-secondary leading-relaxed font-normal">
                                {topic.officialSyllabusText}
                              </p>
                            </div>
                          )}

                          {/* 2. GatePlanner Structured Study Breakdown */}
                          <div>
                            <div className="text-[11px] uppercase font-mono text-tertiary tracking-wider mb-1.5 flex items-center gap-1.5">
                              <Layers className="w-3 h-3" />
                              <span>GatePlanner Study Breakdown (Learning Tasks):</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {studyTasks.map((st, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-secondary p-1 rounded bg-subtle">
                                  <span className="w-1 h-1 rounded-full bg-accent" />
                                  <span>{st}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
