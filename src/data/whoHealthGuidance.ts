export interface HealthGuideline {
  id: string;
  category: string;
  title: string;
  evidenceSource: string;
  recommendation: string;
  dailyAction: string;
  targetMetric: string;
}

export const WHO_HEALTH_GUIDELINES: HealthGuideline[] = [
  {
    id: 'who_aerobic',
    category: 'Physical Activity',
    title: 'Aerobic Exercise (150-300 min/week)',
    evidenceSource: 'WHO Guidelines on Physical Activity and Sedentary Behaviour (2020)',
    recommendation: 'All adults should undertake 150–300 min of moderate-intensity, or 75–150 min of vigorous-intensity physical activity per week, or an equivalent combination for substantial health benefits.',
    dailyAction: 'Engage in at least 30-45 minutes of brisk walking, cycling, or jogging.',
    targetMetric: '30-45 min / day'
  },
  {
    id: 'who_muscle',
    category: 'Physical Activity',
    title: 'Muscle-Strengthening Activity (2+ days/week)',
    evidenceSource: 'WHO Guidelines on Physical Activity and Sedentary Behaviour (2020)',
    recommendation: 'Adults should do muscle-strengthening activities at moderate or greater intensity involving all major muscle groups on 2 or more days a week.',
    dailyAction: 'Bodyweight exercises (pushups, squats, planks) or resistance training.',
    targetMetric: '2-3 sessions / week'
  },
  {
    id: 'who_sedentary',
    category: 'Sedentary Behaviour',
    title: 'Limit Prolonged Desk Sitting',
    evidenceSource: 'WHO Guidelines (2020) & British Journal of Sports Medicine',
    recommendation: 'Limit sedentary time and replace with physical activity of any intensity (including light intensity) to reduce cardiovascular and metabolic health risks.',
    dailyAction: 'Stand up, stretch, or walk for 5-10 minutes every 50-60 minutes of deep study.',
    targetMetric: '1 break per study block'
  },
  {
    id: 'health_eye_202020',
    category: 'Eye Health & Cognitive Rest',
    title: 'The 20-20-20 Eye Rest Protocol',
    evidenceSource: 'American Academy of Ophthalmology (AAO)',
    recommendation: 'To prevent digital eye strain and computer vision syndrome, every 20 minutes look at an object 20 feet away for at least 20 seconds.',
    dailyAction: 'Look outside a window or at distance between problem-solving sets.',
    targetMetric: 'Every 20-30 minutes'
  },
  {
    id: 'health_hydration',
    category: 'Hydration',
    title: 'Daily Hydration (2.5L - 3.0L)',
    evidenceSource: 'European Food Safety Authority (EFSA) & US National Academies',
    recommendation: 'Adequate daily fluid intake is approximately 2.5 to 3.0 liters (8-12 glasses) for active adult males to maintain optimal cognitive function and concentration.',
    dailyAction: 'Keep a water bottle beside your study desk; take regular sips.',
    targetMetric: '8-10 glasses (2.5L)'
  },
  {
    id: 'health_sleep',
    category: 'Sleep Consistency',
    title: '7-8 Hours Restorative Sleep',
    evidenceSource: 'National Sleep Foundation & WHO Mental Health Guidelines',
    recommendation: '7 to 8.5 hours of regular sleep at consistent bedtime/wake times is crucial for long-term memory consolidation, neuroplasticity, and problem-solving speed in competitive exams.',
    dailyAction: 'Stop screen usage 30-45 minutes before bedtime and wind down.',
    targetMetric: '7.5 - 8.0 hours'
  }
];

export const DEFAULT_HEALTH_ROUTINE = {
  morning: [
    { time: '07:00', title: 'Wake up & 1-2 glasses of water (Hydration kickoff)', durationMin: 15 },
    { time: '07:15', title: 'Light morning movement & dynamic stretching', durationMin: 15 },
    { time: '07:45', title: 'Nutritious breakfast & daily focus review', durationMin: 30 }
  ],
  evening: [
    { time: '19:30', title: 'WHO Physical Activity Block (Brisk walk / Exercise)', durationMin: 45 },
    { time: '20:30', title: 'Healthy dinner & brief relaxation', durationMin: 45 }
  ],
  night: [
    { time: '22:30', title: 'Wind-down: Screen dimming, reflection & desk cleanup', durationMin: 30 },
    { time: '23:00', title: 'Sleep target for memory consolidation (7.5 - 8h)', durationMin: 480 }
  ]
};
