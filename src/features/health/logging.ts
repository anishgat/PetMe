import type { ActivityEvent } from './model/types'

export type MealType =
  | 'none'
  | 'healthy_meal'
  | 'balanced_meal'
  | 'processed_food'
  | 'high_sugar_meal'
  | 'high_sat_fat_meal'
  | 'protein_rich_meal'
  | 'fiber_rich_meal'

export type LogDomain =
  | 'sleep'
  | 'mood'
  | 'social'
  | 'substances'
  | 'diet'
  | 'movement'

export type WizardState = {
  sleepDuration: number
  sleepQuality: number
  wakeFeeling: number
  stressLevel: number
  walkingSteps: number
  cardioMinutes: number
  strengthMinutes: number
  socialMoments: number
  mealType: MealType
  alcoholDrinks: number
  smokingCigarettes: number
}

export const INITIAL_LOG_VALUES: WizardState = {
  sleepDuration: 7,
  sleepQuality: 3,
  wakeFeeling: 3,
  stressLevel: 4,
  walkingSteps: 5000,
  cardioMinutes: 0,
  strengthMinutes: 0,
  socialMoments: 1,
  mealType: 'balanced_meal',
  alcoholDrinks: 0,
  smokingCigarettes: 0,
}

export const LOG_DOMAIN_ORDER: LogDomain[] = [
  'sleep',
  'mood',
  'movement',
  'social',
  'diet',
  'substances',
]

export const LOG_DOMAIN_LABELS: Record<LogDomain, string> = {
  sleep: 'Sleep',
  mood: 'Mood',
  movement: 'Movement',
  social: 'Social',
  diet: 'Diet',
  substances: 'Substances',
}

export const DIET_OPTIONS: Array<{ value: MealType; label: string; hint: string }> = [
  {
    value: 'healthy_meal',
    label: 'Fresh & whole',
    hint: 'Mostly whole foods and balanced ingredients.',
  },
  {
    value: 'balanced_meal',
    label: 'Balanced',
    hint: 'A typical decent meal with some variety.',
  },
  {
    value: 'protein_rich_meal',
    label: 'Protein focused',
    hint: 'Extra protein intake today.',
  },
  {
    value: 'fiber_rich_meal',
    label: 'Fiber focused',
    hint: 'Vegetables, legumes, or high-fiber foods.',
  },
  {
    value: 'processed_food',
    label: 'Mostly processed',
    hint: 'Packaged or highly processed food.',
  },
  {
    value: 'high_sugar_meal',
    label: 'High sugar',
    hint: 'Sugar-heavy eating pattern today.',
  },
  {
    value: 'high_sat_fat_meal',
    label: 'High saturated fat',
    hint: 'Heavier saturated fat intake today.',
  },
  {
    value: 'none',
    label: 'Skip diet for now',
    hint: 'No diet tag for this check-in.',
  },
]

const DOMAIN_EVENT_TYPES: Record<LogDomain, Set<ActivityEvent['type']>> = {
  sleep: new Set(['sleep']),
  mood: new Set(['stress']),
  movement: new Set(['walking', 'cardio', 'strength', 'sedentary_day']),
  social: new Set(['social_connection']),
  diet: new Set([
    'healthy_meal',
    'balanced_meal',
    'processed_food',
    'high_sugar_meal',
    'high_sat_fat_meal',
    'protein_rich_meal',
    'fiber_rich_meal',
  ]),
  substances: new Set(['alcohol', 'alcohol_heavy_intake', 'smoking']),
}

export function buildEvents(values: WizardState): ActivityEvent[] {
  const events: ActivityEvent[] = []
  const addEvent = (event: ActivityEvent | null) => {
    if (event) events.push(event)
  }

  const sleepModifier = 0.8 + ((values.sleepQuality + values.wakeFeeling) / 10) * 0.4
  const effectiveSleep = Math.min(12, Math.max(0, values.sleepDuration * sleepModifier))
  if (effectiveSleep > 0) {
    addEvent({
      type: 'sleep',
      amount: Number(effectiveSleep.toFixed(1)),
      unit: 'hour',
      source: 'manual',
      confidence: 1,
    })
  }

  if (values.stressLevel > 0) {
    addEvent({
      type: 'stress',
      amount: values.stressLevel,
      unit: 'level_10',
      source: 'manual',
      confidence: 1,
    })
  }

  if (values.walkingSteps > 0) {
    addEvent({
      type: 'walking',
      amount: values.walkingSteps,
      unit: 'steps',
      source: 'manual',
      confidence: 1,
    })
  }

  if (values.cardioMinutes > 0) {
    addEvent({
      type: 'cardio',
      amount: values.cardioMinutes,
      unit: 'minute',
      source: 'manual',
      confidence: 1,
    })
  }

  if (values.strengthMinutes > 0) {
    addEvent({
      type: 'strength',
      amount: values.strengthMinutes,
      unit: 'minute',
      source: 'manual',
      confidence: 1,
    })
  }

  if (
    values.walkingSteps < 2500 &&
    values.cardioMinutes === 0 &&
    values.strengthMinutes === 0
  ) {
    addEvent({
      type: 'sedentary_day',
      amount: 1,
      unit: 'count',
      source: 'manual',
      confidence: 1,
    })
  }

  if (values.socialMoments > 0) {
    addEvent({
      type: 'social_connection',
      amount: values.socialMoments,
      unit: 'count',
      source: 'manual',
      confidence: 1,
    })
  }

  if (values.mealType !== 'none') {
    addEvent({
      type: values.mealType,
      amount: 1,
      unit: 'meal',
      source: 'manual',
      confidence: 1,
    })
  }

  if (values.alcoholDrinks >= 5) {
    addEvent({
      type: 'alcohol_heavy_intake',
      amount: values.alcoholDrinks,
      unit: 'drink',
      source: 'manual',
      confidence: 1,
    })
  } else if (values.alcoholDrinks > 0) {
    addEvent({
      type: 'alcohol',
      amount: values.alcoholDrinks,
      unit: 'drink',
      source: 'manual',
      confidence: 1,
    })
  }

  if (values.smokingCigarettes > 0) {
    addEvent({
      type: 'smoking',
      amount: values.smokingCigarettes,
      unit: 'cigarette',
      source: 'manual',
      confidence: 1,
    })
  }

  return events
}

export function buildEventsForDomain(
  values: WizardState,
  domain: LogDomain,
): ActivityEvent[] {
  const eventTypes = DOMAIN_EVENT_TYPES[domain]

  return buildEvents(values).filter((event) => eventTypes.has(event.type))
}
