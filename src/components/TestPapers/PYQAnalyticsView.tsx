import React from 'react';
import { 
  BarChart2, 
  CheckCircle2, 
  XCircle, 
  Award, 
  AlertTriangle, 
  TrendingUp, 
  Bookmark, 
  Layers,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { PYQEngine } from '../../services/pyqEngine';
import { YearAuditRecord, PaperAuditRecord } from '../../types';

export const PYQAnalyticsView: React.FC = () => {
  const analytics = PYQEngine.getAnalytics();
  const coverageReport = PYQEngine.getCoverageReport();
  const auditReport = PYQEngine.getDetailedAuditReport();

  return (
    <div className="space-y-6">
      {/* 1. Global Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="panel p-4 text-center">
          <div className="text-xs text-tertiary font-mono uppercase">27-Year Official PYQs</div>
          <div className="text-3xl font-bold font-mono text-emerald-400 mt-1">
            {coverageReport.totalQuestions}
          </div>
          <div className="text-xs text-secondary mt-0.5">{coverageReport.yearsCoveredCount} / 27 Years (2000–2026)</div>
        </div>

        <div className="panel p-4 text-center">
          <div className="text-xs text-tertiary font-mono uppercase">Questions Attempted</div>
          <div className="text-3xl font-bold font-mono text-indigo-400 mt-1">
            {analytics.attemptedCount}
          </div>
          <div className="text-xs text-secondary mt-0.5">{analytics.completionPercent}% Completed</div>
        </div>

        <div className="panel p-4 text-center">
          <div className="text-xs text-tertiary font-mono uppercase">Overall Accuracy</div>
          <div className="text-3xl font-bold font-mono text-primary mt-1">
            {analytics.accuracyPercent}%
          </div>
          <div className="text-xs text-secondary mt-0.5">{analytics.correctCount} Correct / {analytics.incorrectCount} Incorrect</div>
        </div>

        <div className="panel p-4 text-center">
          <div className="text-xs text-tertiary font-mono uppercase">Bookmarked Questions</div>
          <div className="text-3xl font-bold font-mono text-amber-400 mt-1">
            {analytics.bookmarkedCount}
          </div>
          <div className="text-xs text-secondary mt-0.5">Saved for Spaced Revision</div>
        </div>
      </div>

      {/* 2. Historical Paper Coverage Breakdown */}
      <div className="panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-primary font-heading uppercase tracking-wider">
              27-Year Official Paper Coverage & Audit (2000 – 2026)
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            {coverageReport.yearsCoveredCount} / 27 Years Active ({auditReport.totalVerifiedImported} Verified PYQs)
          </span>
        </div>

        {/* Quick Grid of Years */}
        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2 pt-1 text-center">
          {coverageReport.yearsList.map(y => {
            const count = coverageReport.questionsByYear[y] || 0;
            const perf = analytics.yearPerformance[y];
            return (
              <div 
                key={y}
                className="p-2.5 rounded bg-subtle border border-subtle hover:border-white/20 transition-colors"
              >
                <div className="font-mono text-xs font-bold text-primary">{y}</div>
                <div className="text-[10px] text-tertiary mt-0.5">{count} Qs</div>
                {perf && perf.correct > 0 && (
                  <div className="text-[10px] font-mono text-emerald-400 font-semibold mt-0.5">
                    {perf.accuracy}%
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Full Year-by-Year Completeness Table */}
        <div className="border border-subtle rounded-md overflow-hidden mt-3">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141724] text-tertiary font-mono uppercase text-[10px] border-b border-subtle">
              <tr>
                <th className="p-2.5">Year</th>
                <th className="p-2.5">Organizing Institute</th>
                <th className="p-2.5">Paper / Shift</th>
                <th className="p-2.5 text-center">Target Qs</th>
                <th className="p-2.5 text-center">Imported</th>
                <th className="p-2.5 text-center">Missing</th>
                <th className="p-2.5 text-right">Audit Status</th>
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
                          ✓ 100% Ingested
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
      </div>

      {/* 3. Weak Topics vs Strong Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weak Topics */}
        <div className="panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 font-heading">
            <AlertTriangle className="w-4 h-4" />
            <span>Weak Topics Identified (Accuracy &lt; 60%)</span>
          </div>

          {analytics.weakTopics.length > 0 ? (
            <div className="divide-y divide-subtle">
              {analytics.weakTopics.map((w, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-primary">{w.topicName}</div>
                    <div className="text-tertiary text-[11px] font-mono">{w.subjectName}</div>
                  </div>
                  <span className="font-mono text-amber-400 font-semibold">{w.accuracy}% acc</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-secondary py-3">
              No weak topics detected yet! Complete more 26-year PYQs to generate diagnostic analysis.
            </div>
          )}
        </div>

        {/* Strong Topics */}
        <div className="panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-heading">
            <Award className="w-4 h-4" />
            <span>Mastered Topics (Accuracy &ge; 75%)</span>
          </div>

          {analytics.strongTopics.length > 0 ? (
            <div className="divide-y divide-subtle">
              {analytics.strongTopics.map((s, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-primary">{s.topicName}</div>
                    <div className="text-tertiary text-[11px] font-mono">{s.subjectName}</div>
                  </div>
                  <span className="font-mono text-emerald-400 font-semibold">{s.accuracy}% acc</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-secondary py-3">
              Solve and answer questions correctly to build your list of mastered topics.
            </div>
          )}
        </div>
      </div>

      {/* 4. Subject-Wise Mastery Across 11 Sections */}
      <div className="panel p-5 space-y-4">
        <div className="text-xs font-semibold text-primary font-heading uppercase tracking-wider">
          Subject-Wise PYQ Mastery (All 11 Official Sections)
        </div>

        <div className="divide-y divide-subtle">
          {Object.entries(coverageReport.questionsBySubject).map(([sId, sData]) => {
            const perf = analytics.subjectPerformance[sId] || { total: sData.count, attempted: 0, correct: 0, accuracy: 0 };
            return (
              <div key={sId} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-primary truncate">{sData.subjectName}</div>
                  <div className="text-tertiary text-[11px] font-mono mt-0.5">
                    {perf.correct} solved of {perf.attempted} attempted ({sData.count} questions in database)
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono text-secondary shrink-0">
                  <div className="w-24 h-1.5 progress-bar-bg hidden sm:block">
                    <div className="progress-bar-fill" style={{ width: `${perf.accuracy}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-primary">{perf.accuracy}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
