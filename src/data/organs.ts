export const ORGAN_DATA = {
  heart: {
    name: 'Heart',
    rating: 0.82,
    note: 'Cardiovascular resilience is steady, with room to improve recovery and resting rate.',
    history: [
      {
        label: 'Processed food',
        detail: 'Several high-sodium meals pushed blood pressure higher this week.',
        tone: 'bg-rose-400',
      },
      {
        label: 'Cardio sessions',
        detail: 'Recent runs and brisk walks improved circulation and endurance.',
        tone: 'bg-emerald-400',
      },
      {
        label: 'Elevated stress',
        detail: 'Busy days kept your heart rate higher than baseline.',
        tone: 'bg-amber-400',
      },
    ],
    helps: ['Cardio 3x/week', 'More fiber', '7-9h sleep', 'Stress resets'],
  },
  lungs: {
    name: 'Lungs',
    rating: 0.76,
    note: 'Breathing capacity is stable, with better stamina on active days.',
    history: [
      {
        label: 'Outdoor walk',
        detail: 'Fresh air and sustained movement supported lung elasticity.',
        tone: 'bg-emerald-400',
      },
      {
        label: 'Low movement day',
        detail: 'Sedentary time made stairs feel harder than usual.',
        tone: 'bg-amber-400',
      },
      {
        label: 'Poor air quality',
        detail: 'Two high-AQI days left your breathing slightly irritated.',
        tone: 'bg-rose-400',
      },
    ],
    helps: ['Daily walks', 'Breathwork', 'Hydration', 'Fresh air breaks'],
  },
  brain: {
    name: 'Brain',
    rating: 0.88,
    note: 'Focus and mood are trending up when sleep and movement stay consistent.',
    history: [
      {
        label: 'Deep work blocks',
        detail: 'Long focus sessions improved mental clarity and confidence.',
        tone: 'bg-emerald-400',
      },
      {
        label: 'Late-night screen time',
        detail: 'Shorter sleep windows reduced attention the next morning.',
        tone: 'bg-rose-400',
      },
      {
        label: 'Movement break',
        detail: 'Short walks lifted mood and reduced mental fatigue.',
        tone: 'bg-emerald-400',
      },
    ],
    helps: ['Morning light', 'Sleep routine', 'Omega-3 foods', 'Meditation'],
  },
  liver: {
    name: 'Liver',
    rating: 0.79,
    note: 'Recovery and filtration look good overall, but food quality still matters.',
    history: [
      {
        label: 'Balanced meals',
        detail: 'Higher-protein lunches helped stabilize energy and metabolic load.',
        tone: 'bg-emerald-400',
      },
      {
        label: 'Sugary snacks',
        detail: 'Frequent sugar spikes increased the strain on fat processing.',
        tone: 'bg-rose-400',
      },
      {
        label: 'Hydration rebound',
        detail: 'A few strong hydration days improved overall recovery.',
        tone: 'bg-emerald-400',
      },
    ],
    helps: ['Less added sugar', 'Hydration', 'Whole foods', 'Consistent sleep'],
  },
  stomach: {
    name: 'Stomach',
    rating: 0.74,
    note: 'Digestion is responsive, especially when meals are regular and lighter late at night.',
    history: [
      {
        label: 'Late heavy dinner',
        detail: 'A rich meal close to bedtime increased reflux and sluggishness.',
        tone: 'bg-rose-400',
      },
      {
        label: 'Regular meal timing',
        detail: 'Predictable meal windows reduced bloating and discomfort.',
        tone: 'bg-emerald-400',
      },
      {
        label: 'Fast eating',
        detail: 'Rushing meals likely increased stomach irritation this week.',
        tone: 'bg-amber-400',
      },
    ],
    helps: ['Eat slower', 'Lighter late meals', 'Ginger or tea', 'Meal consistency'],
  },
  intestines: {
    name: 'Intestines',
    rating: 0.77,
    note: 'Gut rhythm is fairly stable, with clear improvement from fiber and hydration.',
    history: [
      {
        label: 'Fiber intake',
        detail: 'Vegetables and oats supported smoother digestion and fullness.',
        tone: 'bg-emerald-400',
      },
      {
        label: 'Low water intake',
        detail: 'A few low-hydration days slowed digestion and comfort.',
        tone: 'bg-amber-400',
      },
      {
        label: 'Highly processed snacks',
        detail: 'Lower-quality foods increased bloating and irregularity.',
        tone: 'bg-rose-400',
      },
    ],
    helps: ['More fiber', 'Water throughout the day', 'Fermented foods', 'Daily movement'],
  },
  kidneys: {
    name: 'Kidneys',
    rating: 0.81,
    note: 'Fluid balance and filtration are solid, and they respond quickly to hydration habits.',
    history: [
      {
        label: 'Hydration streak',
        detail: 'Consistent water intake kept filtration and energy more stable.',
        tone: 'bg-emerald-400',
      },
      {
        label: 'Salty meals',
        detail: 'A few high-sodium days increased the load on fluid regulation.',
        tone: 'bg-amber-400',
      },
      {
        label: 'Sleep recovery',
        detail: 'Better sleep improved overnight regulation and recovery.',
        tone: 'bg-emerald-400',
      },
    ],
    helps: ['Steady hydration', 'Moderate sodium', 'Sleep recovery', 'Regular movement'],
  },
  bones: {
    name: 'Bones',
    rating: 0.81,
    note: 'Strength response is steady and resilient with load, posture, and nutrition support.',
    history: [
      {
        label: 'Strength training',
        detail: 'Resistance work supported joints and bone loading this week.',
        tone: 'bg-emerald-400',
      },
      {
        label: 'Low calcium day',
        detail: 'A few meals missed calcium-rich or fortified foods.',
        tone: 'bg-rose-400',
      },
      {
        label: 'Long sitting',
        detail: 'Extended desk time led to stiffness through hips and back.',
        tone: 'bg-amber-400',
      },
    ],
    helps: ['Lift 2x/week', 'Calcium-rich foods', 'Posture resets', 'Vitamin D'],
  },
} as const

export type OrganKey = keyof typeof ORGAN_DATA
