import { HealthHabitChecklist } from '../types';

export interface HealthScoreBreakdown {
  score: number; // 0 - 100
  exercisePercent: number;
  hydrationPercent: number;
  breaksPercent: number;
  nutritionPercent: number;
  sleepPercent: number;
  statusLabel: string;
  actionableFeedback: string;
  completedItemsCount: number;
  totalItemsCount: number;
}

export class HealthEngine {
  /**
   * Computes the daily lifestyle consistency score based on evidence-based WHO targets.
   * Not a medical diagnosis — purely a routine consistency score.
   */
  static calculateScore(habits: HealthHabitChecklist): HealthScoreBreakdown {
    // 1. Exercise (WHO 30-45m target): 25 points
    const exercisePercent = habits.exerciseCompleted ? 100 : Math.min(Math.round((habits.exerciseMinutes / 40) * 100), 100);
    const exercisePoints = (exercisePercent / 100) * 25;

    // 2. Hydration (2.5L / 10 glasses): 20 points
    const hydrationPercent = Math.min(Math.round((habits.hydrationGlasses / habits.hydrationGoalGlasses) * 100), 100);
    const hydrationPoints = (hydrationPercent / 100) * 20;

    // 3. Regular Study Breaks & Eye Rest: 20 points
    const studyBreaksRatio = Math.min(habits.studyBreaksTaken / Math.max(habits.studyBreaksGoal, 1), 1);
    const eyeRestRatio = habits.midMorningEyeRest ? 0.5 : 0;
    const sittingRatio = habits.excessiveSittingAvoided ? 0.5 : 0;
    const breaksPercent = Math.round(((studyBreaksRatio * 0.5) + eyeRestRatio + sittingRatio) * 100);
    const breaksPoints = (breaksPercent / 100) * 20;

    // 4. Healthy Nutrition & Meals (Kickoff + Breakfast + Lunch + Dinner): 15 points
    let nutritionCount = 0;
    if (habits.morningKickoffHydration) nutritionCount += 0.25;
    if (habits.nutritiousBreakfast) nutritionCount += 0.25;
    if (habits.healthyMeals) nutritionCount += 0.25;
    if (habits.healthyDinner) nutritionCount += 0.25;
    const nutritionPercent = Math.round(nutritionCount * 100);
    const nutritionPoints = (nutritionPercent / 100) * 15;

    // 5. Restorative Sleep & Wind-Down (7.5 - 8.0 hours): 20 points
    let sleepPointsRaw = 0;
    if (habits.sleepTargetAchieved) {
      sleepPointsRaw += 0.7;
    } else if (habits.sleepHours > 0) {
      sleepPointsRaw += Math.min((habits.sleepHours / 7.5) * 0.7, 0.7);
    }
    if (habits.nightWindDown) sleepPointsRaw += 0.3;
    const sleepPercent = Math.round(sleepPointsRaw * 100);
    const sleepPoints = (sleepPercent / 100) * 20;

    const totalScore = Math.min(Math.round(exercisePoints + hydrationPoints + breaksPoints + nutritionPoints + sleepPoints), 100);

    // Count checked items
    const checklistItems = [
      habits.morningKickoffHydration,
      habits.morningStretching,
      habits.nutritiousBreakfast,
      habits.studyBreaksTaken >= 4,
      habits.midMorningEyeRest,
      habits.excessiveSittingAvoided,
      habits.healthyMeals,
      habits.exerciseCompleted,
      habits.healthyDinner,
      habits.nightWindDown,
      habits.sleepTargetAchieved
    ];
    const completedItemsCount = checklistItems.filter(Boolean).length;
    const totalItemsCount = checklistItems.length;

    let statusLabel = 'Optimal Peak Performance';
    let actionableFeedback = 'Great balance between intense GATE preparation and physical recovery!';

    if (totalScore < 50) {
      statusLabel = 'Needs Recovery Focus';
      actionableFeedback = 'Make sure to take 5-minute movement breaks and hydrate. High cognitive stamina requires regular physical rest.';
    } else if (totalScore < 80) {
      statusLabel = 'Good Consistency';
      actionableFeedback = 'Keep up the momentum. Complete your 30-minute WHO physical activity block tonight.';
    }

    return {
      score: totalScore,
      exercisePercent,
      hydrationPercent,
      breaksPercent,
      nutritionPercent,
      sleepPercent,
      statusLabel,
      actionableFeedback,
      completedItemsCount,
      totalItemsCount
    };
  }
}
