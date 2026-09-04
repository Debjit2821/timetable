import { 
  TestPaper, 
  TestQuestion, 
  UserTestAttempt, 
  TestType 
} from '../types';
import { DEFAULT_TEST_PAPERS } from '../data/mockTestPapers';

const STORAGE_KEYS = {
  TEST_PAPERS: 'gp_test_papers',
  TEST_ATTEMPTS: 'gp_test_attempts'
};

export class TestEngine {
  /**
   * Retrieves all available test papers (combining defaults and any custom generated sets).
   */
  static getTestPapers(type?: TestType): TestPaper[] {
    if (typeof localStorage === 'undefined') return DEFAULT_TEST_PAPERS;
    const raw = localStorage.getItem(STORAGE_KEYS.TEST_PAPERS);
    let papers: TestPaper[] = DEFAULT_TEST_PAPERS;
    if (raw) {
      try {
        const stored = JSON.parse(raw);
        if (Array.isArray(stored) && stored.length > 0) {
          papers = stored;
        }
      } catch {
        papers = DEFAULT_TEST_PAPERS;
      }
    }
    if (type) {
      return papers.filter(p => p.type === type);
    }
    return papers;
  }

  /**
   * Evaluates a completed test attempt according to official GATE marking scheme.
   */
  static evaluateAttempt(
    testPaper: TestPaper,
    responses: Record<string, string | string[] | number>,
    reviewFlags: Record<string, boolean>,
    timeTakenSeconds: number
  ): UserTestAttempt {
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const subjectPerformance: Record<string, { total: number; correct: number; score: number; totalMarks: number }> = {};
    const topicPerformance: Record<string, { total: number; correct: number; score: number; totalMarks: number }> = {};

    testPaper.questions.forEach(q => {
      const resp = responses[q.id];

      // Init performance structures
      if (!subjectPerformance[q.subjectName]) {
        subjectPerformance[q.subjectName] = { total: 0, correct: 0, score: 0, totalMarks: 0 };
      }
      subjectPerformance[q.subjectName].total += 1;
      subjectPerformance[q.subjectName].totalMarks += q.marks;

      if (!topicPerformance[q.topicName]) {
        topicPerformance[q.topicName] = { total: 0, correct: 0, score: 0, totalMarks: 0 };
      }
      topicPerformance[q.topicName].total += 1;
      topicPerformance[q.topicName].totalMarks += q.marks;

      // Check if attempted
      if (resp === undefined || resp === '' || (Array.isArray(resp) && resp.length === 0)) {
        unattemptedCount += 1;
        return;
      }

      let isCorrect = false;

      if (q.type === 'MCQ') {
        isCorrect = String(resp).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();
      } else if (q.type === 'MSQ') {
        const selectedArr = (Array.isArray(resp) ? resp : [resp]).map(s => String(s).trim().toUpperCase()).sort();
        const correctArr = (Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]).map(s => String(s).trim().toUpperCase()).sort();
        isCorrect = selectedArr.length === correctArr.length && selectedArr.every((val, idx) => val === correctArr[idx]);
      } else if (q.type === 'NAT') {
        const numVal = parseFloat(String(resp));
        if (!isNaN(numVal)) {
          if (typeof q.correctAnswer === 'number') {
            isCorrect = Math.abs(numVal - q.correctAnswer) <= 0.05;
          } else if (typeof q.correctAnswer === 'object' && 'min' in q.correctAnswer && 'max' in q.correctAnswer) {
            isCorrect = numVal >= q.correctAnswer.min && numVal <= q.correctAnswer.max;
          } else {
            isCorrect = Math.abs(numVal - parseFloat(String(q.correctAnswer))) <= 0.05;
          }
        }
      }

      if (isCorrect) {
        correctCount += 1;
        totalScore += q.marks;
        subjectPerformance[q.subjectName].correct += 1;
        subjectPerformance[q.subjectName].score += q.marks;
        topicPerformance[q.topicName].correct += 1;
        topicPerformance[q.topicName].score += q.marks;
      } else {
        incorrectCount += 1;
        // Negative marking applies only to MCQ
        if (q.type === 'MCQ') {
          totalScore -= q.negativeMarks;
          subjectPerformance[q.subjectName].score -= q.negativeMarks;
          topicPerformance[q.topicName].score -= q.negativeMarks;
        }
      }
    });

    const finalScore = Math.max(Math.round(totalScore * 100) / 100, 0);
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const percentage = testPaper.totalMarks > 0 ? Math.round((finalScore / testPaper.totalMarks) * 100) : 0;

    // Detect Weak Areas
    const weakAreas: { subjectName: string; topicName: string; accuracyPercent: number }[] = [];
    Object.entries(topicPerformance).forEach(([tName, data]) => {
      const topicAccuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      if (topicAccuracy < 60) {
        const matchingQ = testPaper.questions.find(q => q.topicName === tName);
        weakAreas.push({
          subjectName: matchingQ?.subjectName || 'General',
          topicName: tName,
          accuracyPercent: topicAccuracy
        });
      }
    });

    const attempt: UserTestAttempt = {
      id: `attempt_${Date.now()}`,
      testPaperId: testPaper.id,
      testTitle: testPaper.title,
      type: testPaper.type,
      subjectName: testPaper.subjectName,
      date: new Date().toISOString(),
      score: finalScore,
      totalMarks: testPaper.totalMarks,
      percentage,
      accuracy,
      correctCount,
      incorrectCount,
      unattemptedCount,
      timeTakenSeconds,
      responses,
      reviewFlags,
      subjectPerformance,
      topicPerformance,
      weakAreas
    };

    this.saveAttempt(attempt);
    return attempt;
  }

  static getAttempts(): UserTestAttempt[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEYS.TEST_ATTEMPTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveAttempt(attempt: UserTestAttempt): void {
    if (typeof localStorage === 'undefined') return;
    const attempts = this.getAttempts();
    attempts.unshift(attempt);
    localStorage.setItem(STORAGE_KEYS.TEST_ATTEMPTS, JSON.stringify(attempts));
  }
}
