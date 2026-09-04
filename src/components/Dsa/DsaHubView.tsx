import React, { useState } from 'react';
import { 
  DsaProblem, 
  DsaCategory, 
  DsaDifficulty 
} from '../../types';
import { 
  Check, 
  Search, 
  Lightbulb, 
  ExternalLink,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { DsaEngine } from '../../services/dsaEngine';

interface DsaHubViewProps {
  dsaBank: DsaProblem[];
  todaysProblemIds: string[];
  onRecordAttempt: (problemId: string, success: boolean, timeTakenMin?: number) => void;
}

export const DsaHubView: React.FC<DsaHubViewProps> = ({
  dsaBank,
  todaysProblemIds,
  onRecordAttempt
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDiff, setSelectedDiff] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hintOpenMap, setHintOpenMap] = useState<Record<string, boolean>>({});

  const toggleHint = (problemId: string) => {
    setHintOpenMap(prev => ({ ...prev, [problemId]: !prev[problemId] }));
  };

  const stats = DsaEngine.getCategoryStats();
  const overall = DsaEngine.getOverallStats();

  const todaysProblems = todaysProblemIds
    .map(id => dsaBank.find(p => p.id === id))
    .filter(Boolean) as DsaProblem[];

  const solvedCount = todaysProblems.filter(p => p.status === 'solved').length;

  const filteredProblems = dsaBank.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchDiff = selectedDiff === 'all' || p.difficulty === selectedDiff;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.coreConcept.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchDiff && matchSearch;
  });

  const categories: DsaCategory[] = [
    'Arrays',
    'Strings',
    'Two Pointers',
    'Linked Lists',
    'Stack & Queue',
    'Binary Search',
    'Trees',
    'Binary Search Tree',
    'Heap & Priority Queue',
    'Graphs',
    'Dynamic Programming',
    'Greedy Algorithms',
    'Backtracking',
    'Bit Manipulation'
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-subtle pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-tertiary mb-1">
            Curated Technical Problem Bank
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-primary tracking-tight">
            DSA Practice
          </h1>
        </div>

        <div className="flex items-center gap-5 text-xs text-secondary font-mono">
          <div>
            <span className="text-tertiary">Today: </span>
            <span className="text-primary font-medium">{solvedCount} / 3 completed</span>
          </div>
          <div>
            <span className="text-tertiary">Total: </span>
            <span className="text-primary font-medium">{overall.totalSolved} / {overall.totalProblems}</span>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S 3 ALLOCATED PROBLEMS (FOCUSED) */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-primary font-heading">
          Today's Problem Set
        </h2>

        <div className="space-y-2.5">
          {todaysProblems.map((prob, idx) => {
            const isSolved = prob.status === 'solved';
            const isHintOpen = !!hintOpenMap[prob.id];

            return (
              <div
                key={prob.id}
                className={`panel p-4 transition-all ${
                  !isSolved ? 'border-accent bg-white/[0.03]' : 'opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => onRecordAttempt(prob.id, !isSolved)}
                      className={`check-circle mt-0.5 ${isSolved ? 'checked' : ''}`}
                    >
                      {isSolved && <Check className="w-3 h-3" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${isSolved ? 'line-through text-secondary' : 'text-primary'}`}>
                          {prob.title}
                        </span>
                        <span className="pill text-[10px]">{prob.difficulty}</span>
                        <span className="text-xs text-tertiary font-mono">{prob.category}</span>
                      </div>

                      <p className="text-xs text-secondary mt-1">
                        <strong>Pattern: </strong>{prob.coreConcept}
                      </p>

                      {isHintOpen ? (
                        <div className="mt-2.5 p-2.5 rounded-md bg-subtle border border-subtle text-xs text-amber-200/90">
                          <strong>Hint: </strong>{prob.hint}
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleHint(prob.id)}
                          className="text-[11px] text-tertiary hover:text-secondary mt-1.5 flex items-center gap-1"
                        >
                          <Lightbulb className="w-3 h-3" />
                          <span>Show hint</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <a
                      href={prob.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      <span>Open on {prob.platform}</span>
                      <ExternalLink className="w-3 h-3 text-tertiary" />
                    </a>

                    <button
                      onClick={() => onRecordAttempt(prob.id, !isSolved)}
                      className={`btn-ghost text-xs px-2.5 py-1.5 ${isSolved ? 'text-emerald-400 bg-emerald-500/10' : 'text-secondary'}`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSolved ? 'Solved' : 'Mark Done'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. CATEGORY ACCURACY (CONCISE) */}
      <section className="space-y-3 pt-2">
        <h2 className="text-base font-semibold text-primary font-heading">
          Category Accuracy
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {stats.map(s => (
            <div key={s.category} className="panel p-2.5 text-center">
              <div className="text-[11px] text-tertiary truncate">{s.category}</div>
              <div className="text-xs font-mono font-semibold text-primary mt-0.5">
                {s.solved}/{s.total}
              </div>
              <div className="progress-bar-bg mt-1.5">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${Math.round((s.solved / Math.max(s.total, 1)) * 100)}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. COMPLETE PROBLEM BANK (CLEAN TABLE) */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-primary font-heading">
            Problem Bank ({filteredProblems.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Filter problems..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs py-1 px-2.5 w-48"
            />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="text-xs py-1 px-2.5 w-36"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="panel overflow-x-auto divide-y divide-subtle">
          <table className="w-full text-left text-xs">
            <thead className="bg-subtle text-tertiary font-mono text-[11px]">
              <tr>
                <th className="p-3">Problem</th>
                <th className="p-3">Category</th>
                <th className="p-3">Difficulty</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {filteredProblems.map(prob => {
                const isSolved = prob.status === 'solved';
                return (
                  <tr key={prob.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-medium text-primary">
                      <a href={prob.url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                        <span>{prob.title}</span>
                        <ExternalLink className="w-3 h-3 text-tertiary" />
                      </a>
                    </td>
                    <td className="p-3 text-secondary">{prob.category}</td>
                    <td className="p-3">
                      <span className="pill text-[10px]">{prob.difficulty}</span>
                    </td>
                    <td className="p-3">
                      {isSolved ? (
                        <span className="text-emerald-400 font-medium">Solved</span>
                      ) : (
                        <span className="text-tertiary">Unsolved</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onRecordAttempt(prob.id, !isSolved)}
                        className="btn-ghost text-xs px-2 py-1"
                      >
                        {isSolved ? 'Reset' : 'Done'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
