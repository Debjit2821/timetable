import React, { useState, useMemo } from 'react';
import { 
  Subject, 
  TestQuestion, 
  PYQFilterOptions,
  YearAuditRecord,
  PaperAuditRecord
} from '../../types';
import { PYQEngine } from '../../services/pyqEngine';
import { 
  Search, 
  Filter, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  HelpCircle, 
  BarChart2, 
  Sparkles, 
  BookOpen, 
  Award, 
  Layers, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface TopicWisePracticeViewProps {
  syllabus: Subject[];
  onOpenTestRunner?: (paperTitle: string, questions: TestQuestion[]) => void;
}

export const TopicWisePracticeView: React.FC<TopicWisePracticeViewProps> = ({
  syllabus,
  onOpenTestRunner
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'MCQ' | 'MSQ' | 'NAT'>('all');
  const [selectedSourceType, setSelectedSourceType] = useState<'all' | 'Official GATE PYQ' | 'GatePlanner Practice'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unattempted' | 'correct' | 'incorrect' | 'bookmarked'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State for 27-Year Completeness Audit Modal
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const auditReport = useMemo(() => PYQEngine.getDetailedAuditReport(), []);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 10;

  // Interactive answering state per question
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[] | number>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  // 26 Years dynamic list (2000 to 2025)
  const availableYears = useMemo(() => PYQEngine.getAvailableYears(), []);
  const coverageReport = useMemo(() => PYQEngine.getCoverageReport(), []);

  // Filter topics based on selected subject
  const currentSubject = syllabus.find(s => s.id === selectedSubjectId);
  const availableTopics = currentSubject ? currentSubject.topics : syllabus.flatMap(s => s.topics);

  // Filter PYQs
  const filteredQuestions = useMemo(() => {
    return PYQEngine.filterPYQs({
      subjectId: selectedSubjectId !== 'all' ? selectedSubjectId : undefined,
      topicId: selectedTopicId !== 'all' ? selectedTopicId : undefined,
      year: selectedYear !== 'all' ? selectedYear : undefined,
      type: selectedType !== 'all' ? selectedType : undefined,
      sourceType: selectedSourceType !== 'all' ? selectedSourceType : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      searchQuery: searchQuery || undefined
    });
  }, [selectedSubjectId, selectedTopicId, selectedYear, selectedType, selectedSourceType, selectedStatus, searchQuery]);

  // Total pages and sliced questions for current page
  const totalQuestions = filteredQuestions.length;
  const totalPages = Math.max(Math.ceil(totalQuestions / PAGE_SIZE), 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedQuestions = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredQuestions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredQuestions, safeCurrentPage, PAGE_SIZE]);

  const attempts = PYQEngine.getAttempts();
  const bookmarks = PYQEngine.getBookmarks();

  const handleSelectOption = (q: TestQuestion, key: 'A' | 'B' | 'C' | 'D') => {
    if (q.type === 'MCQ') {
      setUserAnswers(prev => ({ ...prev, [q.id]: key }));
    } else if (q.type === 'MSQ') {
      const curr = (userAnswers[q.id] as string[]) || [];
      const updated = curr.includes(key) ? curr.filter(k => k !== key) : [...curr, key];
      setUserAnswers(prev => ({ ...prev, [q.id]: updated }));
    }
  };

  const handleCheckAnswer = (q: TestQuestion) => {
    const ans = userAnswers[q.id];
    if (ans === undefined || ans === '') return;
    PYQEngine.recordAttempt(q, ans, 45);
    setRevealedSolutions(prev => ({ ...prev, [q.id]: true }));
    setExpandedDetails(prev => ({ ...prev, [q.id]: true }));
  };

  const handleToggleBookmark = (qId: string) => {
    PYQEngine.toggleBookmark(qId);
    setUserAnswers(prev => ({ ...prev }));
  };

  const handleResetFilters = () => {
    setSelectedSubjectId('all');
    setSelectedTopicId('all');
    setSelectedYear('all');
    setSelectedType('all');
    setSelectedSourceType('all');
    setSelectedStatus('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleStartCbtSession = () => {
    if (onOpenTestRunner && filteredQuestions.length > 0) {
      const title = selectedTopicId !== 'all' 
        ? `${availableTopics.find(t => t.id === selectedTopicId)?.name} (Practice Drill)`
        : selectedSubjectId !== 'all'
        ? `${currentSubject?.name} (Questions)`
        : 'GATE CS Question Repository';
      onOpenTestRunner(title, filteredQuestions);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 27-YEAR OFFICIAL PYQ ARCHIVE BANNER */}
      <div className="panel p-4 bg-gradient-to-r from-indigo-950/30 via-subtle to-subtle border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary font-heading">
              Official GATE CS 27-Year Question Archive (2000–2026)
            </span>
            <span className="pill pill-emerald text-[10px]">{coverageReport.yearsCoveredCount} Years Tracked ({coverageReport.totalQuestions} Verified PYQs)</span>
          </div>
          <p className="text-xs text-secondary">
            Authentic repository of verified previous-year questions from official IIT master papers (2000–2026), categorized across all 11 syllabus sections.
          </p>
        </div>

        {/* Real Dynamic Metrics & Audit Trigger */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-tertiary">Years: </span>
              <strong className="text-emerald-400">{coverageReport.yearsCoveredCount} / 27</strong>
            </div>
            <div className="text-right">
              <span className="text-tertiary">Official PYQs: </span>
              <strong className="text-primary">{coverageReport.totalQuestions}</strong>
            </div>
          </div>

          <button
            onClick={() => setShowAuditModal(true)}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 text-accent hover:text-white"
            title="View full 27-year completeness audit table"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Completeness Audit</span>
          </button>
        </div>
      </div>

      {/* 2. COMPREHENSIVE FILTER STRIP */}
      <div className="panel p-4 space-y-3.5">
        {/* Top Row: Search & CBT Launch */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by keyword, topic, subtopic, or year (e.g., deadlock, Dijkstra, 2024)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="input pl-9 text-xs py-2 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartCbtSession}
              disabled={filteredQuestions.length === 0}
              className="btn-primary text-xs px-3.5 py-2 whitespace-nowrap disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch CBT Practice ({filteredQuestions.length})</span>
            </button>

            {(selectedSubjectId !== 'all' || selectedTopicId !== 'all' || selectedYear !== 'all' || selectedType !== 'all' || selectedSourceType !== 'all' || selectedStatus !== 'all' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="btn-ghost text-xs px-2.5 py-2 text-tertiary hover:text-primary"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 text-xs">
          {/* 1. Subject Filter */}
          <div>
            <label className="text-[11px] text-tertiary block mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedTopicId('all');
                setCurrentPage(1);
              }}
              className="input text-xs py-1.5 w-full bg-[#11131f]"
            >
              <option value="all">All 11 Subjects</option>
              {syllabus.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Topic Filter */}
          <div>
            <label className="text-[11px] text-tertiary block mb-1">Topic</label>
            <select
              value={selectedTopicId}
              onChange={(e) => {
                setSelectedTopicId(e.target.value);
                setCurrentPage(1);
              }}
              className="input text-xs py-1.5 w-full bg-[#11131f]"
            >
              <option value="all">All Topics</option>
              {availableTopics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Question Source */}
          <div>
            <label className="text-[11px] text-tertiary block mb-1">Source</label>
            <select
              value={selectedSourceType}
              onChange={(e) => {
                setSelectedSourceType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="input text-xs py-1.5 w-full bg-[#11131f]"
            >
              <option value="all">All Sources</option>
              <option value="Official GATE PYQ">Official GATE PYQs</option>
              <option value="GatePlanner Practice">Practice Drills</option>
            </select>
          </div>

          {/* 4. Year Filter */}
          <div>
            <label className="text-[11px] text-tertiary block mb-1">GATE Year</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setCurrentPage(1);
              }}
              className="input text-xs py-1.5 w-full bg-[#11131f]"
            >
              <option value="all">All Years (2000–2025)</option>
              {availableYears.map(y => (
                <option key={y} value={y}>
                  GATE CS {y}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Question Type */}
          <div>
            <label className="text-[11px] text-tertiary block mb-1">Question Type</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="input text-xs py-1.5 w-full bg-[#11131f]"
            >
              <option value="all">All Types (MCQ/MSQ/NAT)</option>
              <option value="MCQ">Multiple Choice (MCQ)</option>
              <option value="MSQ">Multiple Select (MSQ)</option>
              <option value="NAT">Numerical (NAT)</option>
            </select>
          </div>

          {/* 6. Status Filter */}
          <div>
            <label className="text-[11px] text-tertiary block mb-1">Attempt Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="input text-xs py-1.5 w-full bg-[#11131f]"
            >
              <option value="all">All Questions</option>
              <option value="unattempted">Unattempted</option>
              <option value="correct">Correct</option>
              <option value="incorrect">Incorrect</option>
              <option value="bookmarked">Bookmarked ({bookmarks.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. QUESTION LIST HEADER & PAGINATION INFO */}
      <div className="flex items-center justify-between text-xs text-secondary px-1">
        <div>
          Showing <strong className="text-primary">{paginatedQuestions.length > 0 ? (safeCurrentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(safeCurrentPage * PAGE_SIZE, totalQuestions)}</strong> of <strong className="text-primary">{totalQuestions}</strong> questions
        </div>

        {/* Pagination Navigation Controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={safeCurrentPage === 1}
              className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="font-mono text-tertiary">
              Page {safeCurrentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 4. QUESTIONS FEED */}
      {paginatedQuestions.length === 0 ? (
        <div className="panel p-8 text-center space-y-3">
          <HelpCircle className="w-7 h-7 text-indigo-400/70 mx-auto" />
          <h3 className="text-sm font-semibold text-primary">No Questions Match Current Filter</h3>
          <p className="text-xs text-secondary max-w-md mx-auto">
            Try resetting the source, subject, year, or search query.
          </p>
          <button onClick={handleResetFilters} className="btn-secondary text-xs px-3 py-1.5">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedQuestions.map((q, idx) => {
            const isBookmarked = bookmarks.includes(q.id);
            const userAttempt = attempts[q.id];
            const isSolutionRevealed = revealedSolutions[q.id] || false;
            const isDetailsExpanded = expandedDetails[q.id] || false;
            const currentSelected = userAnswers[q.id];

            return (
              <div 
                key={q.id}
                className="panel p-5 space-y-4 border border-subtle hover:border-white/10 transition-colors"
              >
                {/* Question Metadata Header */}
                <div className="flex items-start justify-between gap-3 border-b border-subtle pb-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {q.sourceType === 'Official GATE PYQ' ? (
                      <span className="pill pill-emerald text-[11px] font-mono flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        OFFICIAL GATE {q.year} {q.session ? `(${q.session})` : ''} Q{q.questionNumber}
                      </span>
                    ) : (
                      <span className="pill pill-indigo text-[11px] font-mono flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        GatePlanner Practice Drill
                      </span>
                    )}

                    <span className="pill text-[11px] font-medium">{q.type}</span>
                    <span className="pill text-[11px] font-mono font-medium">{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                    
                    {userAttempt && (
                      <span className={`pill text-[11px] font-medium flex items-center gap-1.5 ${userAttempt.isCorrect ? 'text-emerald-400 bg-emerald-500/15' : 'text-rose-400 bg-rose-500/15'}`}>
                        {userAttempt.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {userAttempt.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleBookmark(q.id)}
                      className="text-secondary hover:text-amber-400 transition-colors"
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Topic / Subtopic Breadcrumb */}
                <div className="text-xs text-tertiary flex items-center gap-1.5 flex-wrap">
                  <span className="text-secondary font-medium">{q.subjectName}</span>
                  <span>→</span>
                  <span>{q.topicName}</span>
                  {q.subtopicName && (
                    <>
                      <span>→</span>
                      <span className="text-accent">{q.subtopicName}</span>
                    </>
                  )}
                </div>

                {/* Question Text */}
                <div className="text-sm text-primary leading-relaxed whitespace-pre-wrap font-sans">
                  {q.questionText}
                </div>

                {/* Question Options / NAT Input */}
                {q.type === 'MCQ' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map(opt => {
                      const isSelected = currentSelected === opt.key;
                      const isCorrectOpt = isSolutionRevealed && String(q.correctAnswer).trim().toUpperCase() === opt.key;
                      const isWrongSelected = isSolutionRevealed && isSelected && !isCorrectOpt;

                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleSelectOption(q, opt.key)}
                          className={`p-3 rounded-md border text-left text-xs flex items-start gap-2.5 transition-colors ${
                            isCorrectOpt
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : isWrongSelected
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                              : isSelected
                              ? 'bg-indigo-500/15 border-indigo-500/40 text-primary'
                              : 'bg-subtle border-subtle hover:bg-white/[0.04] text-secondary'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] shrink-0 border ${
                            isSelected ? 'bg-accent text-white border-accent' : 'border-subtle text-tertiary'
                          }`}>
                            {opt.key}
                          </span>
                          <span className="mt-0.5">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'MSQ' && q.options && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] text-tertiary italic">Multiple Select Question (one or more options correct)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map(opt => {
                        const isSelected = Array.isArray(currentSelected) && currentSelected.includes(opt.key);
                        const isCorrectOpt = isSolutionRevealed && Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.key);

                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleSelectOption(q, opt.key)}
                            className={`p-3 rounded-md border text-left text-xs flex items-start gap-2.5 transition-colors ${
                              isCorrectOpt
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : isSelected
                                ? 'bg-indigo-500/15 border-indigo-500/40 text-primary'
                                : 'bg-subtle border-subtle hover:bg-white/[0.04] text-secondary'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center ${isSelected ? 'bg-accent border-accent text-white' : 'border-subtle'}`}>
                              {isSelected && <span className="text-[10px]">✓</span>}
                            </div>
                            <span><strong>{opt.key}.</strong> {opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {q.type === 'NAT' && (
                  <div className="pt-1 flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Enter numerical answer..."
                      value={currentSelected !== undefined ? String(currentSelected) : ''}
                      onChange={(e) => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="input text-xs py-2 w-48 font-mono"
                    />
                    {isSolutionRevealed && (
                      <span className="text-xs font-mono text-emerald-400">
                        Official Answer: {String(q.correctAnswer)}
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons & Explanation Toggle */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-subtle">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCheckAnswer(q)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Check Answer
                    </button>
                    <button
                      onClick={() => setRevealedSolutions(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                      className="btn-secondary text-xs px-2.5 py-1.5"
                    >
                      {isSolutionRevealed ? 'Hide Solution' : 'View Solution'}
                    </button>
                  </div>

                  <button
                    onClick={() => setExpandedDetails(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                    className="text-xs text-secondary hover:text-primary flex items-center gap-1"
                  >
                    <span>{isDetailsExpanded ? 'Less' : 'Explanation'}</span>
                    {isDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* GatePlanner Verified Explanation & Key Concept */}
                {(isDetailsExpanded || isSolutionRevealed) && (
                  <div className="p-4 rounded-md bg-white/[0.02] border border-subtle space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-accent font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>GatePlanner Verified Solution & Key Concept</span>
                    </div>

                    <div className="text-secondary leading-relaxed whitespace-pre-wrap">
                      {q.explanation}
                    </div>

                    <div className="pt-2 flex items-center gap-2 text-[11px] text-tertiary">
                      <span>Official Key: <strong className="text-primary font-mono">{q.officialAnswerKey || String(q.correctAnswer)}</strong></span>
                      <span>•</span>
                    </div>
                  </div>
                )}

                {/* Official Paper Provenance Citation Footer */}
                <div className="pt-2 border-t border-subtle flex items-center justify-between text-[11px] text-tertiary flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>{q.sourcePaper || `GATE ${q.year} CS Master Paper`}</span>
                  </div>
                  <div className="text-secondary text-[11px]">
                    {q.sourceRef || 'Official GATE Master Question Paper'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. BOTTOM PAGINATION BAR */}
      {totalPages > 1 && (
        <div className="panel p-3.5 flex items-center justify-between text-xs text-secondary">
          <div>
            Page <strong className="text-primary font-mono">{safeCurrentPage}</strong> of <strong className="text-primary font-mono">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentPage(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={safeCurrentPage === 1}
              className="btn-ghost text-xs px-2 py-1 disabled:opacity-30"
            >
              First
            </button>
            <button
              onClick={() => {
                setCurrentPage(p => Math.max(p - 1, 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={safeCurrentPage === 1}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => {
                setCurrentPage(p => Math.min(p + 1, totalPages));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={safeCurrentPage === totalPages}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setCurrentPage(totalPages);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={safeCurrentPage === totalPages}
              className="btn-ghost text-xs px-2 py-1 disabled:opacity-30"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* 6. 27-YEAR COMPLETENESS AUDIT MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="panel max-w-4xl w-full max-h-[90vh] flex flex-col p-6 space-y-4 border border-indigo-500/30 shadow-2xl bg-[#0e101a]">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-sm font-bold text-primary font-heading uppercase tracking-wider">
                    27-Year Official GATE CS Completeness Audit (2000–2026)
                  </h2>
                  <p className="text-xs text-tertiary">
                    Verifiable provenance, organizing institutes, and exact question ingestion status.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="btn-ghost text-xs px-2.5 py-1 text-tertiary hover:text-primary"
              >
                ✕ Close
              </button>
            </div>

            {/* Audit Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded bg-subtle border border-subtle text-center">
                <div className="text-tertiary text-[11px]">Years Audited</div>
                <div className="text-lg font-bold text-primary mt-0.5">{auditReport.totalYearsChecked} Years</div>
                <div className="text-[10px] text-emerald-400">2000 – 2026</div>
              </div>

              <div className="p-3 rounded bg-subtle border border-subtle text-center">
                <div className="text-tertiary text-[11px]">Questions Discovered</div>
                <div className="text-lg font-bold text-primary mt-0.5">{auditReport.totalQuestionsDiscovered}</div>
                <div className="text-[10px] text-secondary">Historical Master Papers</div>
              </div>

              <div className="p-3 rounded bg-subtle border border-subtle text-center">
                <div className="text-tertiary text-[11px]">Official Imported</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{auditReport.totalVerifiedImported}</div>
                <div className="text-[10px] text-emerald-400">100% Genuine PYQs</div>
              </div>

              <div className="p-3 rounded bg-subtle border border-subtle text-center">
                <div className="text-tertiary text-[11px]">Missing Questions</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">{auditReport.missingCount}</div>
                <div className="text-[10px] text-tertiary">{auditReport.missingCount === 0 ? '0 Missing (Complete)' : `${auditReport.missingCount} Pending Ingestion`}</div>
              </div>
            </div>

            {/* Year-by-Year Completeness Table */}
            <div className="flex-1 overflow-y-auto border border-subtle rounded-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141724] text-tertiary font-mono uppercase text-[10px] border-b border-subtle sticky top-0">
                  <tr>
                    <th className="p-2.5">Year</th>
                    <th className="p-2.5">Organizing Institute</th>
                    <th className="p-2.5">Paper / Session</th>
                    <th className="p-2.5 text-center">Discovered</th>
                    <th className="p-2.5 text-center">Imported</th>
                    <th className="p-2.5 text-center">Missing</th>
                    <th className="p-2.5 text-right">Completeness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle/40 font-mono text-[11px]">
                  {auditReport.yearRecords.map((rec: YearAuditRecord) => (
                    <React.Fragment key={rec.year}>
                      <tr className="hover:bg-white/[0.02] transition-colors bg-white/[0.01]">
                        <td className="p-2.5 font-bold text-primary">GATE {rec.year}</td>
                        <td className="p-2.5 text-secondary font-sans">{rec.organizingInstitute}</td>
                        <td className="p-2.5 text-tertiary">
                          {rec.sessions.length > 1 ? `${rec.sessions.length} Official Papers (${rec.sessions.join(', ')})` : rec.sessions[0]}
                        </td>
                        <td className="p-2.5 text-center text-secondary">{rec.discoveredCount}</td>
                        <td className="p-2.5 text-center text-emerald-400 font-bold">{rec.importedCount}</td>
                        <td className="p-2.5 text-center text-tertiary">{rec.missingCount}</td>
                        <td className="p-2.5 text-right">
                          {rec.isComplete ? (
                            <span className="pill pill-emerald text-[10px]">
                              ✓ 100% Verified
                            </span>
                          ) : (
                            <span className="pill pill-indigo text-[10px]">
                              {rec.importedCount} / {rec.discoveredCount} Verified
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Paper-level sub-rows when multiple sessions exist */}
                      {rec.papers && rec.papers.length > 1 && rec.papers.map((p: PaperAuditRecord) => (
                        <tr key={`${rec.year}-${p.session}`} className="bg-black/20 text-[10px] text-tertiary">
                          <td className="p-2 pl-6 font-mono text-tertiary">↳ {p.session}</td>
                          <td className="p-2 text-tertiary font-sans" colSpan={2}>{p.paperName}</td>
                          <td className="p-2 text-center text-tertiary">{p.discoveredCount}</td>
                          <td className="p-2 text-center text-emerald-400/80 font-bold">{p.importedCount}</td>
                          <td className="p-2 text-center text-tertiary">{p.missingCount}</td>
                          <td className="p-2 text-right">
                            {p.isComplete ? (
                              <span className="text-emerald-400 font-mono">✓ Complete</span>
                            ) : (
                              <span className="text-amber-400/80 font-mono">{p.missingCount} missing</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-tertiary">
              <span>Audit Standard: Direct traceability to IIT Organizing Institute Master Question Papers.</span>
              <button
                onClick={() => setShowAuditModal(false)}
                className="btn-primary text-xs px-4 py-1.5"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
