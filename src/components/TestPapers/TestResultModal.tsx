import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Clock, 
  Award, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { UserTestAttempt, TestPaper } from '../../types';
import { formatMinutesToHours } from '../../utils/dateUtils';

interface TestResultModalProps {
  attempt: UserTestAttempt;
  testPaper: TestPaper;
  onClose: () => void;
  onRetakeTest?: () => void;
}

export const TestResultModal: React.FC<TestResultModalProps> = ({
  attempt,
  testPaper,
  onClose,
  onRetakeTest
}) => {
  const [selectedTab, setSelectedTab] = useState<'summary' | 'solutions' | 'subjects'>('summary');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const toggleExpand = (qId: string) => {
    setExpandedQuestionId(prev => prev === qId ? null : qId);
  };

  const minutesTaken = Math.floor(attempt.timeTakenSeconds / 60);
  const secondsTaken = attempt.timeTakenSeconds % 60;

  return (
    <div className="modal-overlay">
      <div className="panel max-w-4xl w-full p-6 sm:p-8 relative bg-[#11131c] border-muted shadow-2xl max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-tertiary hover:text-primary p-1 rounded-md bg-subtle border border-subtle"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-1">
            Test Performance & Analysis
          </div>
          <h2 className="text-2xl font-bold text-primary font-heading">
            {attempt.testTitle}
          </h2>
          <div className="flex items-center gap-3 text-xs text-tertiary mt-1 font-mono">
            <span>Submitted: {new Date(attempt.date).toLocaleDateString()}</span>
            <span>·</span>
            <span>Duration: {minutesTaken}m {secondsTaken}s</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-subtle pb-3 mb-6">
          <button
            onClick={() => setSelectedTab('summary')}
            className={`btn-ghost text-xs px-3 py-1.5 ${selectedTab === 'summary' ? 'bg-white/10 text-primary font-semibold' : 'text-secondary'}`}
          >
            Summary & Scorecard
          </button>
          <button
            onClick={() => setSelectedTab('solutions')}
            className={`btn-ghost text-xs px-3 py-1.5 ${selectedTab === 'solutions' ? 'bg-white/10 text-primary font-semibold' : 'text-secondary'}`}
          >
            Question-Wise Solutions ({testPaper.questions.length})
          </button>
          <button
            onClick={() => setSelectedTab('subjects')}
            className={`btn-ghost text-xs px-3 py-1.5 ${selectedTab === 'subjects' ? 'bg-white/10 text-primary font-semibold' : 'text-secondary'}`}
          >
            Subject & Weakness Analysis
          </button>
        </div>

        {/* TAB 1: SUMMARY */}
        {selectedTab === 'summary' && (
          <div className="overflow-y-auto space-y-6 pr-1">
            {/* Score Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="panel p-4 text-center">
                <div className="text-xs text-tertiary font-mono uppercase">Score</div>
                <div className="text-3xl font-bold font-mono text-primary mt-1">
                  {attempt.score} <span className="text-xs text-tertiary">/ {attempt.totalMarks}</span>
                </div>
                <div className="text-xs text-accent font-medium mt-0.5">{attempt.percentage}%</div>
              </div>

              <div className="panel p-4 text-center">
                <div className="text-xs text-tertiary font-mono uppercase">Accuracy</div>
                <div className="text-3xl font-bold font-mono text-emerald-400 mt-1">
                  {attempt.accuracy}%
                </div>
                <div className="text-xs text-tertiary mt-0.5">Attempted Efficiency</div>
              </div>

              <div className="panel p-4 text-center">
                <div className="text-xs text-tertiary font-mono uppercase">Correct / Total</div>
                <div className="text-3xl font-bold font-mono text-primary mt-1">
                  {attempt.correctCount} <span className="text-xs text-tertiary">/ {testPaper.questions.length}</span>
                </div>
                <div className="text-xs text-secondary mt-0.5">{attempt.incorrectCount} incorrect</div>
              </div>

              <div className="panel p-4 text-center">
                <div className="text-xs text-tertiary font-mono uppercase">Time Taken</div>
                <div className="text-2xl font-bold font-mono text-primary mt-1.5">
                  {minutesTaken}m {secondsTaken}s
                </div>
                <div className="text-xs text-tertiary mt-0.5">Allocated: {testPaper.durationMinutes}m</div>
              </div>
            </div>

            {/* Weak Areas Detected Alert */}
            {attempt.weakAreas.length > 0 ? (
              <div className="p-4 rounded-md bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-100">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Weak Areas Detected for Targeted Revision:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {attempt.weakAreas.map((w, i) => (
                    <li key={i}>
                      <strong>{w.subjectName} — {w.topicName}: </strong>
                      <span className="text-amber-300">{w.accuracyPercent}% accuracy</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-4 rounded-md bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Excellent performance! High accuracy maintained across all tested sections.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SOLUTIONS */}
        {selectedTab === 'solutions' && (
          <div className="overflow-y-auto space-y-3 pr-1 divide-y divide-subtle">
            {testPaper.questions.map((q, idx) => {
              const resp = attempt.responses[q.id];
              const isExpanded = expandedQuestionId === q.id;

              let isCorrect = false;
              let isAttempted = resp !== undefined && resp !== '' && (!Array.isArray(resp) || resp.length > 0);

              if (isAttempted) {
                if (q.type === 'MCQ') {
                  isCorrect = String(resp).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();
                } else if (q.type === 'MSQ') {
                  const selectedArr = (Array.isArray(resp) ? resp : [resp]).map(s => String(s).trim().toUpperCase()).sort();
                  const correctArr = (Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]).map(s => String(s).trim().toUpperCase()).sort();
                  isCorrect = selectedArr.length === correctArr.length && selectedArr.every((val, i) => val === correctArr[i]);
                } else if (q.type === 'NAT') {
                  const numVal = parseFloat(String(resp));
                  isCorrect = Math.abs(numVal - parseFloat(String(q.correctAnswer))) <= 0.05;
                }
              }

              return (
                <div key={q.id} className="pt-3">
                  <div 
                    onClick={() => toggleExpand(q.id)}
                    className="flex items-start justify-between gap-3 cursor-pointer hover:bg-white/[0.02] p-2 rounded-md transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      ) : isAttempted ? (
                        <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      ) : (
                        <MinusCircle className="w-4 h-4 text-tertiary mt-0.5 shrink-0" />
                      )}

                      <div>
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="font-bold text-primary font-mono">Q{idx + 1}</span>
                          <span className="pill text-[10px]">{q.type}</span>
                          <span className="pill text-[10px]">{q.sourceType}</span>
                          <span className="text-tertiary font-mono">{q.subjectName}</span>
                        </div>
                        <p className="text-xs text-secondary mt-1 line-clamp-1">
                          {q.questionText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono font-medium text-primary">
                        {isCorrect ? `+${q.marks}` : isAttempted && q.type === 'MCQ' ? `-${q.negativeMarks}` : '0'} marks
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-tertiary" /> : <ChevronDown className="w-4 h-4 text-tertiary" />}
                    </div>
                  </div>

                  {/* Expanded Detailed Solution */}
                  {isExpanded && (
                    <div className="mt-3 p-4 rounded-md bg-subtle border border-subtle space-y-3 text-xs">
                      <div className="font-medium text-primary whitespace-pre-line leading-relaxed">
                        {q.questionText}
                      </div>

                      {q.options && (
                        <div className="space-y-1.5 pt-1">
                          {q.options.map(opt => (
                            <div 
                              key={opt.key}
                              className={`p-2 rounded border text-xs flex items-center justify-between ${
                                (Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt.key) : q.correctAnswer === opt.key)
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-medium'
                                  : (Array.isArray(resp) ? resp.includes(opt.key) : resp === opt.key)
                                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                                  : 'bg-[#11131c] border-subtle text-secondary'
                              }`}
                            >
                              <span><strong>({opt.key})</strong> {opt.text}</span>
                              {(Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt.key) : q.correctAnswer === opt.key) && (
                                <span className="text-[10px] font-mono text-emerald-400">Correct Option</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 border-t border-subtle grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div>
                          <span className="text-tertiary">Your Response: </span>
                          <span className={isCorrect ? 'text-emerald-400 font-bold' : isAttempted ? 'text-rose-400 font-bold' : 'text-tertiary'}>
                            {Array.isArray(resp) ? resp.join(', ') : resp !== undefined && resp !== '' ? String(resp) : 'Unattempted'}
                          </span>
                        </div>
                        <div>
                          <span className="text-tertiary">Official Key: </span>
                          <span className="text-primary font-bold">
                            {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : String(q.correctAnswer)}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded bg-[#090a0f] border border-subtle text-secondary leading-relaxed">
                        <div className="text-[11px] font-semibold text-accent uppercase font-mono mb-1">
                          Official Derivation & Explanation:
                        </div>
                        <p>{q.explanation}</p>
                        <div className="text-[10px] text-tertiary mt-2">
                          <strong>Key Concept: </strong>{q.keyConcept}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: SUBJECT ANALYSIS */}
        {selectedTab === 'subjects' && (
          <div className="overflow-y-auto space-y-4 pr-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary font-mono">
              Subject-Wise Breakdown
            </h3>

            <div className="panel divide-y divide-subtle">
              {Object.entries(attempt.subjectPerformance).map(([sName, data]) => {
                const percent = data.totalMarks > 0 ? Math.round((Math.max(data.score, 0) / data.totalMarks) * 100) : 0;
                return (
                  <div key={sName} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="font-semibold text-primary">{sName}</div>
                      <div className="text-tertiary text-[11px] mt-0.5">
                        {data.correct} of {data.total} questions correct
                      </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-secondary">
                      <span>{data.score.toFixed(2)} / {data.totalMarks} marks</span>
                      <div className="w-20 h-1.5 progress-bar-bg hidden sm:block">
                        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-10 text-right font-bold text-primary">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-subtle flex items-center justify-between mt-auto">
          <span className="text-xs text-tertiary">
            Performance metrics saved to your test history
          </span>

          <div className="flex items-center gap-2">
            {onRetakeTest && (
              <button
                onClick={onRetakeTest}
                className="btn-secondary text-xs px-3.5 py-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-primary text-xs px-4 py-1.5"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
