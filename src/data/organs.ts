export const ORGAN_DATA = {
  heart: {
    name: 'Heart',
    rating: 0.82,
    note: 'Cardiovascular age tracking below chronological age.',
    history: [
      {
        label: 'Processed food',
        detail: '4 fast food entries this week',
        tone: 'bg-rose-400',
      },
      {
        label: 'Cardio 3×/wk',
        detail: 'Running sessions boosting cardiac efficiency',
        tone: 'bg-emerald-400',
      },
      {
        label: 'Elevated stress',
        detail: 'Cortisol raising resting heart rate',
        tone: 'bg-amber-400',
      },
    ],
    helps: [
      'Cardio 3×/week',
      'Reduce saturated fat',
      '7–9h sleep',
      'Manage stress',
    ],
  },
  lungs: {
    name: 'Lungs',
    rating: 0.76,
    note: 'Breath capacity steady with room to improve.',
    history: [
      {
        label: 'Outdoor walk',
        detail: 'Fresh air supports lung elasticity',
        tone: 'bg-emerald-400',
      },
      {
        label: 'Low movement day',
        detail: 'Shortness of breath after stairs',
        tone: 'bg-amber-400',
      },
      {
        label: 'Poor air quality',
        detail: 'Two high AQI days this week',
        tone: 'bg-rose-400',
      },
    ],
    helps: ['Daily walks', 'Breathwork 5 min', 'Indoor plants', 'Hydration'],
  },
  brain: {
    name: 'Brain',
    rating: 0.88,
    note: 'Focus trending up with steady routines.',
    history: [
      {
        label: 'Deep work blocks',
        detail: '90-minute sessions improve clarity',
        tone: 'bg-emerald-400',
      },
      {
        label: 'Late-night screen time',
        detail: '2 nights cut sleep quality',
        tone: 'bg-rose-400',
      },
      {
        label: 'Movement break',
        detail: 'Short walks lifted mood',
        tone: 'bg-emerald-400',
      },
    ],
    helps: ['Morning light', 'No screens 1h before bed', 'Omega-3', 'Meditation'],
  },
  bones: {
    name: 'Bones',
    rating: 0.81,
    note: 'Strength response is steady and resilient.',
    history: [
      {
        label: 'Strength training',
        detail: '2 sessions loading major joints',
        tone: 'bg-emerald-400',
      },
      {
        label: 'Low calcium day',
        detail: 'Missed dairy or fortified foods',
        tone: 'bg-rose-400',
      },
      {
        label: 'Long sitting',
        detail: 'Hip stiffness after 6h desk time',
        tone: 'bg-amber-400',
      },
    ],
    helps: ['Lift 2×/week', 'Calcium-rich foods', 'Posture resets', 'Vitamin D'],
  },
} as const

export type OrganKey = keyof typeof ORGAN_DATA
