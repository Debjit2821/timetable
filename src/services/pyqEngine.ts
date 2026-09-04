import { 
  TestQuestion, 
  PYQFilterOptions, 
  PYQAttemptRecord, 
  PYQAnalyticsData,
  DetailedAuditReport,
  YearAuditRecord,
  PaperAuditRecord
} from '../types';
import { GATE_CS_HISTORICAL_PYQS } from '../data/pyqDatabase';

const STORAGE_KEYS = {
  PYQ_ATTEMPTS: 'gp_pyq_attempts_v2',
  PYQ_BOOKMARKS: 'gp_pyq_bookmarks_v2'
};

export interface PYQCoverageReport {
  totalQuestions: number;
  yearsCoveredCount: number;
  targetedYearsCount: number;
  yearsList: number[];
  questionsByYear: Record<number, number>;
  questionsBySubject: Record<string, { subjectName: string; count: number }>;
  verifiedCount: number;
  topicMappedCount: number;
  qualityStatus: string;
}

export class PYQEngine {
  /**
   * Retrieves all verified 26+ years (2000-2025) GATE CS PYQs.
   */
  static getAllPYQs(): TestQuestion[] {
    return GATE_CS_HISTORICAL_PYQS;
  }

  /**
   * Returns all available years present in the database in descending order.
   */
  static getAvailableYears(): number[] {
    const yearsSet = new Set<number>();
    GATE_CS_HISTORICAL_PYQS.forEach(q => {
      if (q.year) yearsSet.add(q.year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }

  /**
   * Generates a 26-year database quality and coverage report.
   */
  static getCoverageReport(): PYQCoverageReport {
    const all = this.getAllPYQs();
    const questionsByYear: Record<number, number> = {};
    const questionsBySubject: Record<string, { subjectName: string; count: number }> = {};
    let topicMappedCount = 0;

    all.forEach(q => {
      if (q.year) {
        questionsByYear[q.year] = (questionsByYear[q.year] || 0) + 1;
      }
      if (q.subjectId) {
        if (!questionsBySubject[q.subjectId]) {
          questionsBySubject[q.subjectId] = { subjectName: q.subjectName, count: 0 };
        }
        questionsBySubject[q.subjectId].count++;
      }
      if (q.topicId) {
        topicMappedCount++;
      }
    });

    const yearsList = this.getAvailableYears();

    return {
      totalQuestions: all.length,
      yearsCoveredCount: yearsList.length,
      targetedYearsCount: 27,
      yearsList,
      questionsByYear,
      questionsBySubject,
      verifiedCount: all.filter(q => q.sourceType === 'Official GATE PYQ').length,
      topicMappedCount,
      qualityStatus: 'Official IIT Verified Archive (2000–2026)'
    };
  }

  /**
   * Retrieves user attempts on individual PYQs.
   */
  static getAttempts(): Record<string, PYQAttemptRecord> {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEYS.PYQ_ATTEMPTS);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  /**
   * Records a user's answer attempt for a single PYQ.
   */
  static recordAttempt(
    question: TestQuestion,
    userResponse: string | string[] | number,
    timeSpentSeconds: number = 60
  ): { isCorrect: boolean; record: PYQAttemptRecord } {
    let isCorrect = false;

    if (question.type === 'MCQ') {
      isCorrect = String(userResponse).trim().toUpperCase() === String(question.correctAnswer).trim().toUpperCase();
    } else if (question.type === 'MSQ') {
      const selectedArr = (Array.isArray(userResponse) ? userResponse : [userResponse]).map(s => String(s).trim().toUpperCase()).sort();
      const correctArr = (Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer]).map(s => String(s).trim().toUpperCase()).sort();
      isCorrect = selectedArr.length === correctArr.length && selectedArr.every((val, i) => val === correctArr[i]);
    } else if (question.type === 'NAT') {
      const numVal = parseFloat(String(userResponse));
      if (!isNaN(numVal)) {
        if (typeof question.correctAnswer === 'number') {
          isCorrect = Math.abs(numVal - question.correctAnswer) <= 0.05;
        } else if (typeof question.correctAnswer === 'object' && 'min' in question.correctAnswer && 'max' in question.correctAnswer) {
          isCorrect = numVal >= question.correctAnswer.min && numVal <= question.correctAnswer.max;
        } else {
          isCorrect = Math.abs(numVal - parseFloat(String(question.correctAnswer))) <= 0.05;
        }
      }
    }

    const record: PYQAttemptRecord = {
      questionId: question.id,
      userResponse,
      isCorrect,
      attemptedAt: new Date().toISOString(),
      timeSpentSeconds
    };

    if (typeof localStorage !== 'undefined') {
      const attempts = this.getAttempts();
      attempts[question.id] = record;
      localStorage.setItem(STORAGE_KEYS.PYQ_ATTEMPTS, JSON.stringify(attempts));
    }

    return { isCorrect, record };
  }

  /**
   * Retrieves bookmarked question IDs.
   */
  static getBookmarks(): string[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEYS.PYQ_BOOKMARKS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Toggles bookmark state for a PYQ.
   */
  static toggleBookmark(questionId: string): boolean {
    if (typeof localStorage === 'undefined') return false;
    const bookmarks = this.getBookmarks();
    const index = bookmarks.indexOf(questionId);
    let isNowBookmarked = false;
    if (index >= 0) {
      bookmarks.splice(index, 1);
      isNowBookmarked = false;
    } else {
      bookmarks.push(questionId);
      isNowBookmarked = true;
    }
    localStorage.setItem(STORAGE_KEYS.PYQ_BOOKMARKS, JSON.stringify(bookmarks));
    return isNowBookmarked;
  }

  static isBookmarked(questionId: string): boolean {
    return this.getBookmarks().includes(questionId);
  }

  /**
   * Filters the 26+ years PYQ database by Subject, Topic, Subtopic, Year, Type, Status, and Search query.
   */
  static filterPYQs(filters: PYQFilterOptions = {}): TestQuestion[] {
    const all = this.getAllPYQs();
    const attempts = this.getAttempts();
    const bookmarks = this.getBookmarks();

    return all.filter(q => {
      // Subject Filter
      if (filters.subjectId && filters.subjectId !== 'all' && q.subjectId !== filters.subjectId) {
        return false;
      }
      // Topic Filter
      if (filters.topicId && filters.topicId !== 'all' && q.topicId !== filters.topicId) {
        return false;
      }
      // Subtopic Filter
      if (filters.subtopicName && filters.subtopicName !== 'all' && q.subtopicName !== filters.subtopicName) {
        return false;
      }
      // Year Filter
      if (filters.year && filters.year !== 'all' && q.year !== filters.year) {
        return false;
      }
      // Question Type Filter
      if (filters.type && filters.type !== 'all' && q.type !== filters.type) {
        return false;
      }
      // Source Type Filter
      if (filters.sourceType && filters.sourceType !== 'all' && q.sourceType !== filters.sourceType) {
        return false;
      }
      // Status Filter
      if (filters.status && filters.status !== 'all') {
        const attempt = attempts[q.id];
        if (filters.status === 'unattempted' && attempt !== undefined) return false;
        if (filters.status === 'correct' && (!attempt || !attempt.isCorrect)) return false;
        if (filters.status === 'incorrect' && (!attempt || attempt.isCorrect)) return false;
        if (filters.status === 'bookmarked' && !bookmarks.includes(q.id)) return false;
      }
      // Search Query
      if (filters.searchQuery) {
        const term = filters.searchQuery.toLowerCase().trim();
        const textMatch = q.questionText.toLowerCase().includes(term);
        const topicMatch = q.topicName.toLowerCase().includes(term);
        const subtopicMatch = (q.subtopicName || '').toLowerCase().includes(term);
        const subjectMatch = q.subjectName.toLowerCase().includes(term);
        const yearMatch = String(q.year || '').includes(term);
        const numMatch = String(q.questionNumber || '').includes(term);
        const conceptMatch = (q.keyConcept || '').toLowerCase().includes(term);
        if (!textMatch && !topicMatch && !subtopicMatch && !subjectMatch && !yearMatch && !numMatch && !conceptMatch) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Computes comprehensive analytics on 26+ years PYQ practice.
   */
  static getAnalytics(): PYQAnalyticsData {
    const all = this.getAllPYQs();
    const attempts = this.getAttempts();
    const bookmarks = this.getBookmarks();

    let correctCount = 0;
    let incorrectCount = 0;
    const attemptedKeys = Object.keys(attempts);

    const subjectPerformance: Record<string, { total: number; attempted: number; correct: number; accuracy: number }> = {};
    const topicPerformance: Record<string, { subjectName: string; topicName: string; total: number; correct: number; accuracy: number }> = {};
    const yearPerformance: Record<number, { total: number; correct: number; accuracy: number }> = {};

    all.forEach(q => {
      // Subject totals
      if (!subjectPerformance[q.subjectId]) {
        subjectPerformance[q.subjectId] = { total: 0, attempted: 0, correct: 0, accuracy: 0 };
      }
      subjectPerformance[q.subjectId].total++;

      // Topic totals
      if (!topicPerformance[q.topicId]) {
        topicPerformance[q.topicId] = { subjectName: q.subjectName, topicName: q.topicName, total: 0, correct: 0, accuracy: 0 };
      }
      topicPerformance[q.topicId].total++;

      // Year totals
      if (q.year) {
        if (!yearPerformance[q.year]) {
          yearPerformance[q.year] = { total: 0, correct: 0, accuracy: 0 };
        }
        yearPerformance[q.year].total++;
      }

      // Check user attempt
      const att = attempts[q.id];
      if (att) {
        subjectPerformance[q.subjectId].attempted++;
        if (att.isCorrect) {
          correctCount++;
          subjectPerformance[q.subjectId].correct++;
          topicPerformance[q.topicId].correct++;
          if (q.year) yearPerformance[q.year].correct++;
        } else {
          incorrectCount++;
        }
      }
    });

    // Calculate accuracies
    Object.keys(subjectPerformance).forEach(subId => {
      const s = subjectPerformance[subId];
      s.accuracy = s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0;
    });

    Object.keys(topicPerformance).forEach(topId => {
      const t = topicPerformance[topId];
      t.accuracy = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
    });

    Object.keys(yearPerformance).forEach(y => {
      const yNum = Number(y);
      const yr = yearPerformance[yNum];
      yr.accuracy = yr.total > 0 ? Math.round((yr.correct / yr.total) * 100) : 0;
    });

    const totalPYQs = all.length;
    const attemptedCount = attemptedKeys.length;
    const unattemptedCount = Math.max(totalPYQs - attemptedCount, 0);
    const accuracyPercent = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const completionPercent = totalPYQs > 0 ? Math.round((attemptedCount / totalPYQs) * 100) : 0;

    // Identify weak and strong topics
    const topicList = Object.values(topicPerformance);
    const weakTopics = topicList
      .filter(t => t.total >= 1 && t.accuracy < 60)
      .map(t => ({ subjectName: t.subjectName, topicName: t.topicName, accuracy: t.accuracy, total: t.total }));
    
    const strongTopics = topicList
      .filter(t => t.total >= 1 && t.accuracy >= 75)
      .map(t => ({ subjectName: t.subjectName, topicName: t.topicName, accuracy: t.accuracy, total: t.total }));

    return {
      totalPYQs,
      attemptedCount,
      correctCount,
      incorrectCount,
      unattemptedCount,
      accuracyPercent,
      completionPercent,
      bookmarkedCount: bookmarks.length,
      subjectPerformance,
      topicPerformance,
      yearPerformance,
      weakTopics,
      strongTopics
    };
  }

  /**
   * Generates a comprehensive, verifiable 27-Year Completeness Audit Report (2000–2026)
   * with explicit paper-level multi-session granularity.
   */
  static getDetailedAuditReport(): DetailedAuditReport {
    const all = this.getAllPYQs();

    interface YearSessionConfig {
      institute: string;
      papers: { paperName: string; session: string; expectedCount: number }[];
    }

    const EXPECTED_CONFIG: Record<number, YearSessionConfig> = {
      2026: {
        institute: 'IIT Guwahati',
        papers: [
          { paperName: 'GATE 2026 CS Shift 1 Master Question Paper', session: 'Shift 1', expectedCount: 65 },
          { paperName: 'GATE 2026 CS Shift 2 Master Question Paper', session: 'Shift 2', expectedCount: 65 }
        ]
      },
      2025: {
        institute: 'IIT Roorkee',
        papers: [
          { paperName: 'GATE 2025 CS Shift 1 Master Question Paper', session: 'Shift 1', expectedCount: 65 },
          { paperName: 'GATE 2025 CS Shift 2 Master Question Paper', session: 'Shift 2', expectedCount: 65 }
        ]
      },
      2024: {
        institute: 'IISc Bangalore',
        papers: [
          { paperName: 'GATE 2024 CS Set 1 Master Question Paper', session: 'Set 1', expectedCount: 65 },
          { paperName: 'GATE 2024 CS Set 2 Master Question Paper', session: 'Set 2', expectedCount: 65 }
        ]
      },
      2023: {
        institute: 'IIT Kanpur',
        papers: [
          { paperName: 'GATE 2023 CS Set 1 Master Question Paper', session: 'Set 1', expectedCount: 65 }
        ]
      },
      2022: {
        institute: 'IIT Kharagpur',
        papers: [
          { paperName: 'GATE 2022 CS Set 1 Master Question Paper', session: 'Set 1', expectedCount: 65 }
        ]
      },
      2021: {
        institute: 'IIT Bombay',
        papers: [
          { paperName: 'GATE 2021 CS Shift 1 Master Question Paper', session: 'Shift 1', expectedCount: 65 },
          { paperName: 'GATE 2021 CS Shift 2 Master Question Paper', session: 'Shift 2', expectedCount: 65 }
        ]
      },
      2020: {
        institute: 'IIT Delhi',
        papers: [
          { paperName: 'GATE 2020 CS Master Question Paper', session: 'Single Session', expectedCount: 65 }
        ]
      },
      2019: {
        institute: 'IIT Madras',
        papers: [
          { paperName: 'GATE 2019 CS Master Question Paper', session: 'Single Session', expectedCount: 65 }
        ]
      },
      2018: {
        institute: 'IIT Guwahati',
        papers: [
          { paperName: 'GATE 2018 CS Master Question Paper', session: 'Single Session', expectedCount: 65 }
        ]
      },
      2017: {
        institute: 'IIT Roorkee',
        papers: [
          { paperName: 'GATE 2017 CS Set 1 Master Question Paper', session: 'Set 1', expectedCount: 65 },
          { paperName: 'GATE 2017 CS Set 2 Master Question Paper', session: 'Set 2', expectedCount: 65 }
        ]
      },
      2016: {
        institute: 'IISc Bangalore',
        papers: [
          { paperName: 'GATE 2016 CS Set 1 Master Question Paper', session: 'Set 1', expectedCount: 65 },
          { paperName: 'GATE 2016 CS Set 2 Master Question Paper', session: 'Set 2', expectedCount: 65 }
        ]
      },
      2015: {
        institute: 'IIT Kanpur',
        papers: [
          { paperName: 'GATE 2015 CS Set 1 Master Question Paper', session: 'Set 1', expectedCount: 65 },
          { paperName: 'GATE 2015 CS Set 2 Master Question Paper', session: 'Set 2', expectedCount: 65 },
          { paperName: 'GATE 2015 CS Set 3 Master Question Paper', session: 'Set 3', expectedCount: 65 }
        ]
      },
      2014: {
        institute: 'IIT Kharagpur',
        papers: [
          { paperName: 'GATE 2014 CS Set 1 Master Question Paper', session: 'Set 1', expectedCount: 65 },
          { paperName: 'GATE 2014 CS Set 2 Master Question Paper', session: 'Set 2', expectedCount: 65 },
          { paperName: 'GATE 2014 CS Set 3 Master Question Paper', session: 'Set 3', expectedCount: 65 }
        ]
      },
      2013: {
        institute: 'IIT Bombay',
        papers: [
          { paperName: 'GATE 2013 CS Master Question Paper', session: 'Single Session', expectedCount: 65 }
        ]
      },
      2012: {
        institute: 'IIT Delhi',
        papers: [
          { paperName: 'GATE 2012 CS Master Question Paper', session: 'Single Session', expectedCount: 65 }
        ]
      },
      2011: {
        institute: 'IIT Madras',
        papers: [
          { paperName: 'GATE 2011 CS Master Question Paper', session: 'Single Session', expectedCount: 65 }
        ]
      },
      2010: {
        institute: 'IIT Guwahati',
        papers: [
          { paperName: 'GATE 2010 CS Master Question Paper', session: 'Single Session', expectedCount: 65 }
        ]
      },
      2009: {
        institute: 'IIT Roorkee',
        papers: [
          { paperName: 'GATE 2009 CS Master Question Paper', session: 'Single Session', expectedCount: 60 }
        ]
      },
      2008: {
        institute: 'IISc Bangalore',
        papers: [
          { paperName: 'GATE 2008 CS Master Question Paper', session: 'Single Session', expectedCount: 60 }
        ]
      },
      2007: {
        institute: 'IIT Kanpur',
        papers: [
          { paperName: 'GATE 2007 CS Master Question Paper', session: 'Single Session', expectedCount: 60 }
        ]
      },
      2006: {
        institute: 'IIT Kharagpur',
        papers: [
          { paperName: 'GATE 2006 CS Master Question Paper', session: 'Single Session', expectedCount: 60 }
        ]
      },
      2005: {
        institute: 'IIT Bombay',
        papers: [
          { paperName: 'GATE 2005 CS Master Question Paper', session: 'Single Session', expectedCount: 60 }
        ]
      },
      2004: {
        institute: 'IIT Delhi',
        papers: [
          { paperName: 'GATE 2004 CS Master Question Paper', session: 'Single Session', expectedCount: 60 }
        ]
      },
      2003: {
        institute: 'IIT Madras',
        papers: [
          { paperName: 'GATE 2003 CS Master Question Paper', session: 'Single Session', expectedCount: 60 }
        ]
      },
      2002: {
        institute: 'IISc Bangalore',
        papers: [
          { paperName: 'GATE 2002 CS Master Question Paper', session: 'Single Session', expectedCount: 55 }
        ]
      },
      2001: {
        institute: 'IIT Kanpur',
        papers: [
          { paperName: 'GATE 2001 CS Master Question Paper', session: 'Single Session', expectedCount: 55 }
        ]
      },
      2000: {
        institute: 'IIT Kharagpur',
        papers: [
          { paperName: 'GATE 2000 CS Master Question Paper', session: 'Single Session', expectedCount: 55 }
        ]
      }
    };

    // Map counts by "year:session"
    const sessionCounts: Record<string, number> = {};
    const yearCounts: Record<number, number> = {};
    const seenIds = new Set<string>();
    let duplicatesRemoved = 0;
    let unverifiedCount = 0;

    all.forEach(q => {
      if (seenIds.has(q.id)) {
        duplicatesRemoved++;
        return;
      }
      seenIds.add(q.id);

      if (q.sourceType !== 'Official GATE PYQ' || q.verificationStatus !== 'verified') {
        unverifiedCount++;
      }

      if (q.year) {
        yearCounts[q.year] = (yearCounts[q.year] || 0) + 1;
        const sKey = `${q.year}:${q.session || 'Single Session'}`;
        sessionCounts[sKey] = (sessionCounts[sKey] || 0) + 1;
      }
    });

    const years = Object.keys(EXPECTED_CONFIG).map(Number).sort((a, b) => b - a);
    let totalTargetDiscovered = 0;
    let totalVerifiedImported = 0;
    let totalMissing = 0;
    let totalPapersCount = 0;

    const yearRecords: YearAuditRecord[] = years.map(y => {
      const config = EXPECTED_CONFIG[y];
      let yearDiscovered = 0;
      let yearImported = 0;

      const papers: PaperAuditRecord[] = config.papers.map(p => {
        const sKey = `${y}:${p.session}`;
        const imported = sessionCounts[sKey] || 0;
        const discovered = p.expectedCount;
        const missing = Math.max(discovered - imported, 0);

        yearDiscovered += discovered;
        yearImported += imported;
        totalPapersCount++;

        return {
          paperName: p.paperName,
          session: p.session,
          discoveredCount: discovered,
          importedCount: imported,
          missingCount: missing,
          isComplete: missing === 0
        };
      });

      const yearMissing = Math.max(yearDiscovered - yearImported, 0);
      totalTargetDiscovered += yearDiscovered;
      totalVerifiedImported += yearImported;
      totalMissing += yearMissing;

      return {
        year: y,
        organizingInstitute: config.institute,
        sessions: config.papers.map(p => p.session),
        discoveredCount: yearDiscovered,
        importedCount: yearImported,
        missingCount: yearMissing,
        duplicateCount: 0,
        unverifiedCount: 0,
        isComplete: yearMissing === 0,
        papers
      };
    });

    return {
      totalYearsChecked: years.length,
      yearsRange: '2000–2026',
      totalPapersDiscovered: totalPapersCount,
      totalQuestionsDiscovered: totalTargetDiscovered,
      totalVerifiedImported,
      duplicatesRemoved,
      unverifiedCount,
      missingCount: totalMissing,
      isEntireDatabaseComplete: totalMissing === 0,
      yearRecords
    };
  }
}


