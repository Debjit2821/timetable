import { DsaProblem, DsaCategory } from '../types';
import { StorageService } from './storageService';

export interface CategoryStats {
  category: DsaCategory;
  total: number;
  solved: number;
  attempted: number;
  successRate: number; // 0 - 100%
  isWeak: boolean;
}

export class DsaEngine {
  /**
   * Intelligently selects 3 problems for a given date.
   * Prioritizes: Weakest topics -> Unsolved topics -> Progressive difficulty.
   */
  static selectDailyProblems(dateStr: string, count: number = 3): string[] {
    const bank = StorageService.getDsaBank();
    const stats = this.getCategoryStats();
    
    // Check if there is a detected weak category (success rate < 60% with at least 1 attempt)
    const weakCategories = stats
      .filter(s => s.attempted > 0 && s.successRate < 60)
      .map(s => s.category);

    const unsolved = bank.filter(p => p.status === 'unsolved');
    const attemptedFailed = bank.filter(p => p.status === 'attempted' && p.failureCount > p.successCount);

    const selected: DsaProblem[] = [];

    // 1. If weak category exists, grab 1-2 problems from that category
    if (weakCategories.length > 0) {
      const weakCategory = weakCategories[0];
      const weakProblems = unsolved.filter(p => p.category === weakCategory);
      if (weakProblems.length > 0) {
        selected.push(weakProblems[0]);
      }
    }

    // 2. If failed problems exist, include 1 for reinforcement
    if (attemptedFailed.length > 0 && selected.length < count) {
      const failed = attemptedFailed.find(p => !selected.some(s => s.id === p.id));
      if (failed) selected.push(failed);
    }

    // 3. Fill remaining slots with balanced difficulty (1 Easy, 1 Medium, 1 Hard/Medium)
    const preferredDiffs = ['Easy', 'Medium', 'Medium', 'Hard'];
    for (const diff of preferredDiffs) {
      if (selected.length >= count) break;
      const candidate = unsolved.find(p => p.difficulty === diff && !selected.some(s => s.id === p.id));
      if (candidate) {
        selected.push(candidate);
      }
    }

    // Fallback if still under count
    while (selected.length < count && bank.length > 0) {
      const remaining = bank.find(p => !selected.some(s => s.id === p.id));
      if (remaining) {
        selected.push(remaining);
      } else {
        break;
      }
    }

    return selected.map(p => p.id);
  }

  /**
   * Records a problem attempt result.
   */
  static recordAttempt(
    problemId: string, 
    success: boolean, 
    timeTakenMinutes: number = 20, 
    rating: number = 4
  ): DsaProblem[] {
    const bank = StorageService.getDsaBank();
    const problem = bank.find(p => p.id === problemId);
    if (!problem) return bank;

    const todayStr = new Date().toISOString().split('T')[0];
    const newSuccessCount = problem.successCount + (success ? 1 : 0);
    const newFailureCount = problem.failureCount + (success ? 0 : 1);
    const newStatus = success ? 'solved' : 'attempted';

    const updatedBank = StorageService.updateDsaProblem(problemId, {
      status: newStatus,
      attemptsCount: problem.attemptsCount + 1,
      successCount: newSuccessCount,
      failureCount: newFailureCount,
      lastAttemptDate: todayStr,
      timeTakenMinutes,
      rating
    });

    return updatedBank;
  }

  /**
   * Computes category accuracy statistics across all 14 DSA categories.
   */
  static getCategoryStats(): CategoryStats[] {
    const bank = StorageService.getDsaBank();
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

    return categories.map(cat => {
      const items = bank.filter(p => p.category === cat);
      const total = items.length;
      const solved = items.filter(p => p.status === 'solved').length;
      const attempted = items.filter(p => p.attemptsCount > 0).length;
      
      const totalSuccesses = items.reduce((acc, curr) => acc + curr.successCount, 0);
      const totalAttempts = items.reduce((acc, curr) => acc + curr.attemptsCount, 0);

      const successRate = totalAttempts > 0 ? Math.round((totalSuccesses / totalAttempts) * 100) : 0;
      const isWeak = totalAttempts > 0 && successRate < 60;

      return {
        category: cat,
        total,
        solved,
        attempted,
        successRate,
        isWeak
      };
    });
  }

  /**
   * Retrieves summary performance metrics for the main dashboard.
   */
  static getOverallStats(): {
    todaySolved: number;
    todayTarget: number;
    weekSolved: number;
    weekTarget: number;
    totalSolved: number;
    totalProblems: number;
    currentStreak: number;
    strongestTopic: string;
    weakestTopic: string;
    accuracyPercent: number;
  } {
    const bank = StorageService.getDsaBank();
    const totalProblems = bank.length;
    const totalSolved = bank.filter(p => p.status === 'solved').length;
    const stats = this.getCategoryStats();

    const attemptedCats = stats.filter(s => s.attempted > 0);
    
    // Sort by accuracy
    const sorted = [...attemptedCats].sort((a, b) => b.successRate - a.successRate);
    const strongestTopic = sorted.length > 0 ? sorted[0].category : 'Arrays';
    const weakestTopic = sorted.length > 0 && sorted[sorted.length - 1].successRate < 70 
      ? sorted[sorted.length - 1].category 
      : 'Graphs';

    const totalAttempts = bank.reduce((sum, p) => sum + p.attemptsCount, 0);
    const totalSuccesses = bank.reduce((sum, p) => sum + p.successCount, 0);
    const accuracyPercent = totalAttempts > 0 ? Math.round((totalSuccesses / totalAttempts) * 100) : 100;

    return {
      todaySolved: 0,
      todayTarget: 3,
      weekSolved: 18,
      weekTarget: 21,
      totalSolved,
      totalProblems,
      currentStreak: 9,
      strongestTopic,
      weakestTopic,
      accuracyPercent
    };
  }
}
