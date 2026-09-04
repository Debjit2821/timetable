import React, { useState } from 'react';
import { 
  FileText, 
  Clock, 
  Award, 
  CheckCircle2, 
  Layers, 
  BookOpen, 
  HelpCircle, 
  Play, 
  BarChart2, 
  History, 
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Bookmark,
  XCircle,
  Sparkles
} from 'lucide-react';
import { TestPaper, UserTestAttempt, TestType, Subject, TestQuestion } from '../../types';
import { TestEngine } from '../../services/testEngine';
import { PYQEngine } from '../../services/pyqEngine';
import { TestExecutionModal } from './TestExecutionModal';
import { TestResultModal } from './TestResultModal';
import { TopicWisePracticeView } from './TopicWisePracticeView';
import { PYQAnalyticsView } from './PYQAnalyticsView';
import { formatMinutesToHours } from '../../utils/dateUtils';

interface TestPapersHubViewProps {
  syllabus: Subject[];
}

export const TestPapersHubView: React.FC<TestPapersHubViewProps> = ({ syllabus }) => {
  const [activeTab, setActiveTab] = useState<
    'full_mock' | 'subject_test' | 'topic_practice' | 'all_pyqs' | 'bookmarked' | 'incorrect' | 'history' | 'analytics'
  >('topic_practice');

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [activeTestPaper, setActiveTestPaper] = useState<TestPaper | null>(null);
  const [activeResultAttempt, setActiveResultAttempt] = useState<UserTestAttempt | null>(null);
  const [activeResultPaper, setActiveResultPaper] = useState<TestPaper | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const allTestPapers = TestEngine.getTestPapers();
  const testAttempts = TestEngine.getAttempts();
  const totalPYQs = PYQEngine.getAllPYQs().length;
  const bookmarks = PYQEngine.getBookmarks();

  // Filter test papers for full_mock and subject_test tabs
  const filteredPapers = allTestPapers.filter(paper => {
    if (activeTab === 'full_mock' && paper.type !== 'full_mock') return false;
    if (activeTab === 'subject_test' && paper.type !== 'subject_test') return false;
    if (selectedSubjectFilter !== 'all' && paper.subjectId !== selectedSubjectFilter) return false;
    if (searchQuery) {
      const matchTitle = paper.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSubtitle = paper.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTitle || matchSubtitle;
    }
    return true;
  });

  const handleStartTest = (paper: TestPaper) => {
    setActiveTestPaper(paper);
  };

  const handleLaunchCustomCbt = (title: string, questions: TestQuestion[]) => {
    const customPaper: TestPaper = {
      id: `custom_cbt_${Date.now()}`,
      title,
      subtitle: 'Custom 26-Year GATE PYQ Practice Drill',
      type: 'pyq_practice',
      totalQuestions: questions.length,
      totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
      durationMinutes: Math.max(Math.round(questions.length * 2.5), 15),
      questions
    };
    setActiveTestPaper(customPaper);
  };

  const handleViewAttemptDetails = (attempt: UserTestAttempt) => {
    const matchedPaper = allTestPapers.find(p => p.id === attempt.testPaperId) || {
      id: attempt.testPaperId,
      title: attempt.testTitle,
      subtitle: 'Completed Assessment',
      type: attempt.type,
      totalQuestions: 15,
      totalMarks: attempt.totalMarks,
      durationMinutes: 45,
      questions: []
    };
    setActiveResultAttempt(attempt);
    setActiveResultPaper(matchedPaper);
  };

  const handleTestFinished = (attempt: UserTestAttempt) => {
    const finishedPaper = activeTestPaper;
    setActiveTestPaper(null);
    if (finishedPaper) {
      setActiveResultAttempt(attempt);
      setActiveResultPaper(finishedPaper);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-subtle pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>26+ Years Verified GATE CS PYQs & CBT Engine (2000–2025)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-primary tracking-tight">
            Test Papers & 26-Year PYQs
          </h1>
        </div>

        {/* Global Summary Stats */}
        <div className="flex items-center gap-5 text-xs text-secondary font-mono">
          <div>
            <span className="text-tertiary">26-Year PYQs: </span>
            <span className="text-primary font-medium">{totalPYQs} verified</span>
          </div>
          <div>
            <span className="text-tertiary">Tests Taken: </span>
            <span className="text-primary font-medium">{testAttempts.length}</span>
          </div>
        </div>
      </div>

      {/* Primary Category Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-subtle">
        <button
          onClick={() => setActiveTab('topic_practice')}
          className={`btn-ghost text-xs px-3 py-1.5 whitespace-nowrap ${activeTab === 'topic_practice' ? 'bg-white/10 text-primary font-semibold' : 'text-secondary'}`}
        >
          Topic-Wise Practice (11 Sections)
        </button>
        <button
          onClick={() => setActiveTab('all_pyqs')}
          className={`btn-ghost text-xs px-3 py-1.5 whitespace-nowrap ${activeTab === 'all_pyqs' ? 'bg-white/10 text-primary font-semibold' : 'text-secondary'}`}
        >
          Practice All PYQs (2000–2025)
        </button>
        <button
          onClick={() => setActiveTab('full_mock')}
          className={`btn-ghost text-xs px-3 py-1.5 whitespace-nowrap ${activeTab === 'full_mock' ? 'bg-white/10 text-primary font-semibold' : 'text-secondary'}`}
        >
          Full-Length Mocks
        </button>
        <button
          onClick={() => setActiveTab('subject_test')}
          className={`btn-ghost text-xs px-3 py-1.5 whitespace-nowrap ${activeTab === 'subject_test' ? 'bg-white/10 text-primary font-semibold' : 'text-secondary'}`}
        >
          Subject Tests
        </button>
        <button
          onClick={() => setActiveTab('bookmarked')}
          className={`btn-ghost text-xs px-3 py-1.5 whitespace-nowrap ${activeTab === 'bookmarked' ? 'bg-white/10 text-primary font-semibold' : 'text-secondary'}`}
        >
          Bookmarked ({bookmarks.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`btn-ghost text-xs px-3 py-1.5 whitespace-nowrap ${activeTab === 'analytics' ? 'bg-white/10 text-primary font-semibold' : 'text-secondary'}`}
        >
          PYQ Analytics & Weak Topics
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`btn-ghost text-xs px-3 py-1.5 whitespace-nowrap ${activeTab === 'history' ? 'bg-white/10 text-primary font-semibold' : 'text-secondary'}`}
        >
          Test History ({testAttempts.length})
        </button>
      </div>

      {/* VIEW 1: TOPIC-WISE PRACTICE & 26-YEAR PYQS */}
      {activeTab === 'topic_practice' && (
        <TopicWisePracticeView
          syllabus={syllabus}
          onOpenTestRunner={handleLaunchCustomCbt}
        />
      )}

      {/* VIEW 2: PRACTICE ALL PYQS */}
      {activeTab === 'all_pyqs' && (
        <TopicWisePracticeView
          syllabus={syllabus}
          onOpenTestRunner={handleLaunchCustomCbt}
        />
      )}

      {/* VIEW 3: BOOKMARKED PYQS */}
      {activeTab === 'bookmarked' && (
        <TopicWisePracticeView
          syllabus={syllabus}
          onOpenTestRunner={handleLaunchCustomCbt}
        />
      )}

      {/* VIEW 4: FULL MOCKS & SUBJECT TESTS */}
      {(activeTab === 'full_mock' || activeTab === 'subject_test') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {activeTab === 'subject_test' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-tertiary">Subject:</span>
                <select
                  value={selectedSubjectFilter}
                  onChange={e => setSelectedSubjectFilter(e.target.value)}
                  className="text-xs py-1 px-2.5 max-w-xs"
                >
                  <option value="all">All 11 Official Subjects</option>
                  {syllabus.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {filteredPapers.map(paper => (
              <div key={paper.id} className="panel p-4 hover:bg-white/[0.02] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-primary font-heading">
                      {paper.title}
                    </h3>
                    <span className="pill text-[10px] font-mono">{paper.type.replace('_', ' ')}</span>
                    {paper.year && (
                      <span className="pill pill-indigo text-[10px] font-mono">GATE {paper.year}</span>
                    )}
                    {paper.subjectName && (
                      <span className="text-xs text-tertiary font-mono">({paper.subjectName})</span>
                    )}
                  </div>

                  <p className="text-xs text-secondary">
                    {paper.subtitle}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-tertiary font-mono pt-1">
                    <span>{paper.questions.length} Questions</span>
                    <span>·</span>
                    <span>{paper.totalMarks} Marks</span>
                    <span>·</span>
                    <span>{paper.durationMinutes} Minutes</span>
                    <span>·</span>
                    <span>MCQ, MSQ, NAT</span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartTest(paper)}
                  className="btn-primary text-xs px-4 py-2 shrink-0 self-start sm:self-center"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Test</span>
                </button>
              </div>
            ))}

            {filteredPapers.length === 0 && (
              <div className="panel p-8 text-center text-xs text-secondary">
                No tests found matching the selected filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 5: PYQ ANALYTICS */}
      {activeTab === 'analytics' && (
        <PYQAnalyticsView />
      )}

      {/* VIEW 6: TEST HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {testAttempts.map(attempt => {
            const mins = Math.floor(attempt.timeTakenSeconds / 60);
            return (
              <div key={attempt.id} className="panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-primary font-heading">
                      {attempt.testTitle}
                    </h3>
                    <span className="pill text-[10px] font-mono">{attempt.type.replace('_', ' ')}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-secondary pt-0.5">
                    <span>Score: <strong className="text-primary">{attempt.score} / {attempt.totalMarks}</strong></span>
                    <span>Accuracy: <strong className="text-emerald-400">{attempt.accuracy}%</strong></span>
                    <span>Time: <strong className="text-primary">{mins}m</strong></span>
                    <span className="text-tertiary">{new Date(attempt.date).toLocaleDateString()}</span>
                  </div>

                  {attempt.weakAreas.length > 0 && (
                    <div className="text-[11px] text-amber-300/90 pt-1">
                      Weakness detected: {attempt.weakAreas.map(w => `${w.topicName} (${w.accuracyPercent}%)`).join(', ')}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleViewAttemptDetails(attempt)}
                  className="btn-secondary text-xs px-3.5 py-1.5 shrink-0 self-start sm:self-center"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>View Analysis</span>
                </button>
              </div>
            );
          })}

          {testAttempts.length === 0 && (
            <div className="panel p-8 text-center text-xs text-secondary space-y-2">
              <History className="w-6 h-6 text-tertiary mx-auto mb-1" />
              <div className="font-semibold text-primary">No test attempts yet</div>
              <p className="text-tertiary">Select any test paper or topic drill from the categories above to start practicing.</p>
            </div>
          )}
        </div>
      )}

      {/* Active CBT Test Execution Modal */}
      {activeTestPaper && (
        <TestExecutionModal
          testPaper={activeTestPaper}
          onClose={() => setActiveTestPaper(null)}
          onTestComplete={handleTestFinished}
        />
      )}

      {/* Result Analysis Modal */}
      {activeResultAttempt && activeResultPaper && (
        <TestResultModal
          attempt={activeResultAttempt}
          testPaper={activeResultPaper}
          onClose={() => {
            setActiveResultAttempt(null);
            setActiveResultPaper(null);
          }}
          onRetakeTest={() => {
            const paperToRetake = activeResultPaper;
            setActiveResultAttempt(null);
            setActiveResultPaper(null);
            setActiveTestPaper(paperToRetake);
          }}
        />
      )}
    </div>
  );
};
