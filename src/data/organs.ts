import type { OrganKey } from '../features/health/model/types'

type OrganMetadata = {
  name: string
  helps: string[]
}

export const ORGAN_METADATA: Record<OrganKey, OrganMetadata> = {
  heart: {
    name: 'Heart',
    helps: ['Cardio 3x/week', 'More fiber', '7-9h sleep', 'Stress resets'],
  },
  lungs: {
    name: 'Lungs',
    helps: ['Daily walks', 'Breathwork', 'Hydration', 'Fresh air breaks'],
  },
  brain: {
    name: 'Brain',
    helps: ['Morning light', 'Sleep routine', 'Omega-3 foods', 'Meditation'],
  },
  liver: {
    name: 'Liver',
    helps: ['Less added sugar', 'Hydration', 'Whole foods', 'Consistent sleep'],
  },
  stomach: {
    name: 'Stomach',
    helps: ['Eat slower', 'Lighter late meals', 'Ginger or tea', 'Meal consistency'],
  },
  intestines: {
    name: 'Intestines',
    helps: ['More fiber', 'Water throughout the day', 'Fermented foods', 'Daily movement'],
  },
  kidneys: {
    name: 'Kidneys',
    helps: ['Steady hydration', 'Moderate sodium', 'Sleep recovery', 'Regular movement'],
  },
  bones: {
    name: 'Bones',
    helps: ['Lift 2x/week', 'Calcium-rich foods', 'Posture resets', 'Vitamin D'],
  },
}

export type OrganMetadataKey = keyof typeof ORGAN_METADATA
