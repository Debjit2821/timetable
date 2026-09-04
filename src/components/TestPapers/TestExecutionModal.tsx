import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Clock, 
  Calculator, 
  CheckSquare, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  AlertCircle,
  Flag
} from 'lucide-react';
import { TestPaper, TestQuestion, UserTestAttempt } from '../../types';
import { TestEngine } from '../../services/testEngine';

interface TestExecutionModalProps {
  testPaper: TestPaper;
  onClose: () => void;
  onTestComplete: (attempt: UserTestAttempt) => void;
}

export const TestExecutionModal: React.FC<TestExecutionModalProps> = ({
  testPaper,
  onClose,
  onTestComplete
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(testPaper.durationMinutes * 60);
  const [responses, setResponses] = useState<Record<string, string | string[] | number>>({});
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({
    [testPaper.questions[0]?.id || '']: true
  });
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('');

  // Start timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentQuestion = testPaper.questions[currentQuestionIndex];

  // Mark as visited when switching questions
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < testPaper.questions.length) {
      const q = testPaper.questions[index];
      setVisitedQuestions(prev => ({ ...prev, [q.id]: true }));
      setCurrentQuestionIndex(index);
    }
  };

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;

    if (currentQuestion.type === 'MCQ') {
      setResponses(prev => ({ ...prev, [currentQuestion.id]: key }));
    } else if (currentQuestion.type === 'MSQ') {
      const currentSelected = (responses[currentQuestion.id] as string[]) || [];
      const exists = currentSelected.includes(key);
      const updated = exists 
        ? currentSelected.filter(k => k !== key)
        : [...currentSelected, key];
      setResponses(prev => ({ ...prev, [currentQuestion.id]: updated }));
    }
  };

  const handleNatInput = (val: string) => {
    if (!currentQuestion) return;
    setResponses(prev => ({ ...prev, [currentQuestion.id]: val }));
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    setResponses(prev => {
      const updated = { ...prev };
      delete updated[currentQuestion.id];
      return updated;
    });
  };

  const handleToggleReviewFlag = () => {
    if (!currentQuestion) return;
    setReviewFlags(prev => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id]
    }));
  };

  const handleSaveAndNext = () => {
    if (currentQuestionIndex + 1 < testPaper.questions.length) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const handleSubmitTest = () => {
    const timeTaken = testPaper.durationMinutes * 60 - secondsRemaining;
    const attempt = TestEngine.evaluateAttempt(testPaper, responses, reviewFlags, timeTaken);
    onTestComplete(attempt);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentQuestion) return null;

  // Counts for Palette
  let answeredCount = 0;
  let markedCount = 0;
  let unattemptedCount = 0;

  testPaper.questions.forEach(q => {
    const resp = responses[q.id];
    const isAns = resp !== undefined && resp !== '' && (!Array.isArray(resp) || resp.length > 0);
    const isMarked = !!reviewFlags[q.id];
    if (isAns) answeredCount++;
    if (isMarked) markedCount++;
    if (!isAns) unattemptedCount++;
  });

  return (
    <div className="modal-overlay p-2 sm:p-4">
      <div className="panel max-w-6xl w-full h-[94vh] flex flex-col relative bg-[#0d0f17] border-muted shadow-2xl overflow-hidden">
        {/* Top CBT Bar */}
        <div className="h-14 bg-[#121520] border-b border-subtle px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-primary font-heading truncate max-w-xs sm:max-w-md">
              {testPaper.title}
            </span>
            <span className="pill text-[10px] uppercase font-mono">{testPaper.type.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Calculator Toggle */}
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className={`btn-ghost text-xs px-2.5 py-1 ${showCalculator ? 'bg-white/10 text-primary' : 'text-secondary'}`}
              title="Virtual Scientific Calculator"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calculator</span>
            </button>

            {/* Timer */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-subtle border border-subtle text-xs font-mono font-bold text-accent">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="btn-primary text-xs px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 border-emerald-400"
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Main CBT Workspace: Left (Question) + Right (Palette) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT: QUESTION & ANSWER PANEL */}
          <div className="flex-1 flex flex-col justify-between overflow-y-auto p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-subtle">
            {/* Question Info Header */}
            <div>
              <div className="flex items-center justify-between border-b border-subtle pb-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-primary font-mono text-sm">
                    Question {currentQuestionIndex + 1} of {testPaper.questions.length}
                  </span>
                  <span className="pill text-[10px] font-mono">{currentQuestion.type}</span>
                  <span className="pill pill-indigo text-[10px]">{currentQuestion.sourceType}</span>
                  {currentQuestion.year && (
                    <span className="pill text-[10px] font-mono">GATE {currentQuestion.year}</span>
                  )}
                  <span className="text-tertiary font-mono">({currentQuestion.subjectName})</span>
                </div>

                <div className="text-xs font-mono text-secondary shrink-0">
                  <span className="text-emerald-400 font-medium">+{currentQuestion.marks}</span>
                  {currentQuestion.type === 'MCQ' && (
                    <span className="text-rose-400 ml-1">(-{currentQuestion.negativeMarks})</span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm text-primary whitespace-pre-line leading-relaxed mb-6 font-normal">
                {currentQuestion.questionText}
              </div>

              {/* Answer Input Area (MCQ / MSQ / NAT) */}
              <div className="space-y-2.5 max-w-2xl mb-6">
                {currentQuestion.type === 'MCQ' && currentQuestion.options && (
                  <div className="space-y-2">
                    {currentQuestion.options.map(opt => {
                      const isSelected = responses[currentQuestion.id] === opt.key;
                      return (
                        <div
                          key={opt.key}
                          onClick={() => handleSelectOption(opt.key)}
                          className={`p-3 rounded-md border text-xs cursor-pointer flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'bg-indigo-950/40 border-indigo-500/50 text-primary font-medium shadow-sm'
                              : 'bg-[#11131c] border-subtle text-secondary hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className={`check-circle ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span><strong>({opt.key})</strong> {opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === 'MSQ' && currentQuestion.options && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-tertiary font-mono mb-1">
                      (One or more options may be correct. No negative marks.)
                    </div>
                    {currentQuestion.options.map(opt => {
                      const selectedArr = (responses[currentQuestion.id] as string[]) || [];
                      const isSelected = selectedArr.includes(opt.key);
                      return (
                        <div
                          key={opt.key}
                          onClick={() => handleSelectOption(opt.key)}
                          className={`p-3 rounded-md border text-xs cursor-pointer flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'bg-indigo-950/40 border-indigo-500/50 text-primary font-medium'
                              : 'bg-[#11131c] border-subtle text-secondary hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className={`check-circle ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <CheckSquare className="w-3 h-3 text-white" />}
                          </div>
                          <span><strong>({opt.key})</strong> {opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === 'NAT' && (
                  <div className="p-4 rounded-md bg-[#11131c] border border-subtle space-y-2">
                    <label className="block text-xs font-mono text-tertiary">
                      Enter Real Number Answer (Virtual Keypad):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={String(responses[currentQuestion.id] || '')}
                        onChange={e => handleNatInput(e.target.value)}
                        placeholder="e.g. 11 or 2.67"
                        className="text-sm font-mono py-2 max-w-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="pt-4 border-t border-subtle flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearResponse}
                  className="btn-ghost text-xs px-2.5 py-1.5 text-secondary hover:text-rose-400"
                >
                  Clear Response
                </button>
                <button
                  onClick={handleToggleReviewFlag}
                  className={`btn-ghost text-xs px-2.5 py-1.5 ${
                    reviewFlags[currentQuestion.id] ? 'text-purple-400 font-semibold' : 'text-secondary'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{reviewFlags[currentQuestion.id] ? 'Marked' : 'Mark for Review'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleSaveAndNext}
                  className="btn-primary text-xs px-4 py-1.5"
                >
                  <span>Save & Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: QUESTION PALETTE */}
          <div className="w-full lg:w-72 bg-[#0a0c13] p-4 flex flex-col justify-between overflow-y-auto shrink-0">
            <div>
              <div className="text-xs font-semibold text-primary font-heading mb-3">
                Question Palette
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-tertiary mb-4 pb-3 border-b border-subtle">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">✓</span>
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold">⚑</span>
                  <span>Marked ({markedCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold">•</span>
                  <span>Unanswered ({unattemptedCount})</span>
                </div>
              </div>

              {/* 1..N Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {testPaper.questions.map((q, idx) => {
                  const resp = responses[q.id];
                  const isAns = resp !== undefined && resp !== '' && (!Array.isArray(resp) || resp.length > 0);
                  const isMarked = !!reviewFlags[q.id];
                  const isCurrent = idx === currentQuestionIndex;

                  let styleClass = 'bg-subtle text-tertiary border-subtle';
                  if (isAns && isMarked) {
                    styleClass = 'bg-purple-950/60 border-purple-400 text-purple-200 font-bold';
                  } else if (isAns) {
                    styleClass = 'bg-emerald-950/60 border-emerald-400 text-emerald-300 font-bold';
                  } else if (isMarked) {
                    styleClass = 'bg-purple-950/40 border-purple-500/50 text-purple-300';
                  } else if (visitedQuestions[q.id]) {
                    styleClass = 'bg-rose-950/30 border-rose-500/30 text-rose-300';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      className={`h-8 rounded text-xs font-mono border transition-all flex items-center justify-center ${styleClass} ${
                        isCurrent ? 'ring-2 ring-indigo-400' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Calculator Popup if enabled */}
            {showCalculator && (
              <div className="mt-4 p-3 rounded-md bg-[#161926] border border-muted text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-tertiary">
                  <span>Virtual Scientific Tool</span>
                  <button onClick={() => setShowCalculator(false)}><X className="w-3 h-3" /></button>
                </div>
                <input
                  type="text"
                  value={calcInput}
                  onChange={e => setCalcInput(e.target.value)}
                  placeholder="e.g. log2(64) or sqrt(16)"
                  className="text-xs font-mono py-1"
                />
                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                  {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','C','='].map(btn => (
                    <button
                      key={btn}
                      onClick={() => {
                        if (btn === 'C') setCalcInput('');
                        else if (btn === '=') {
                          try {
                            // Safe math evaluate
                            const res = Function(`"use strict"; return (${calcInput})`)();
                            setCalcInput(String(res));
                          } catch {
                            setCalcInput('Error');
                          }
                        } else {
                          setCalcInput(prev => prev + btn);
                        }
                      }}
                      className="p-1 rounded bg-subtle border border-subtle hover:bg-white/10"
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Confirmation Dialog */}
        {showSubmitConfirm && (
          <div className="modal-overlay">
            <div className="panel max-w-md w-full p-6 relative bg-[#11131c] border-muted shadow-2xl">
              <h3 className="text-base font-bold text-primary font-heading mb-2">
                Submit Test Paper?
              </h3>
              <p className="text-xs text-secondary mb-4 leading-relaxed">
                You have answered <strong>{answeredCount}</strong> of <strong>{testPaper.questions.length}</strong> questions ({unattemptedCount} unattempted).
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="btn-ghost text-xs px-3 py-2"
                >
                  Resume Test
                </button>
                <button
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    handleSubmitTest();
                  }}
                  className="btn-primary text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-500 border-emerald-400"
                >
                  Confirm & View Results
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
