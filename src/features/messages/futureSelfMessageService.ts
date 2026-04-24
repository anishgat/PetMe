import { ORGAN_METADATA } from '../../data/organs'
import type { BodySystemKey } from '../insights/insightService'
import type { HealthLogEntry } from '../health/HealthContext'
import {
  BENEFICIAL_ACTIVITIES,
  type ActivityType,
  type OrganImpactSummary,
  type OrganKey,
  type StreakState,
} from '../health'
import { createOpenAIResponsesClient } from '../health/llm/openaiClient'
import { buildFutureSelfMessagePrompt } from '../health/llm/prompts'

const LOOKBACK_ENTRY_COUNT = 7
const MAX_GENERATED_MESSAGE_LENGTH = 220

type TrendDirection = 'improving' | 'steady' | 'strained'

type FutureSelfSystemProfile = {
  id: BodySystemKey
  label: string
  organs: OrganKey[]
  helps: string[]
}

type FutureSelfNarrativeInput = {
  trendDirection: TrendDirection
  recentWin: string
  recentStrain?: string
  focusSystem: string
  suggestedNextStep: string
  timeAnchor: string
}

type ActivityAggregate = {
  totalScore: number
  occurrences: number
}

type SystemAggregate = {
  totalScore: number
  activityTotals: Map<ActivityType, number>
}

export type FutureSelfSystemSnapshot = {
  id: BodySystemKey
  label: string
  score: number
}

export type FutureSelfMessageContext = {
  overallScore: number
  latestImpactNarrative?: string | null
  recentCheckInCount: number
  latestCheckInAt?: string
  logEntries: HealthLogEntry[]
  streaks: StreakState
  latestImpactSummary: OrganImpactSummary[]
  systems: FutureSelfSystemSnapshot[]
}

export type FutureSelfMessage = {
  body: string
  toneLabel: string
  source: 'llm' | 'fallback'
}

const FUTURE_SELF_SYSTEM_SEEDS: Array<Omit<FutureSelfSystemProfile, 'helps'>> = [
  { id: 'cardio', label: 'Cardio', organs: ['heart', 'lungs'] },
  { id: 'brain', label: 'Cognitive', organs: ['brain'] },
  {
    id: 'digestive',
    label: 'Digestive',
    organs: ['liver', 'stomach', 'intestines'],
  },
  { id: 'renal', label: 'Renal', organs: ['kidneys'] },
  { id: 'mobility', label: 'Mobility', organs: ['bones'] },
]

function collectSystemHelps(organs: OrganKey[]) {
  return organs.flatMap((organ) => ORGAN_METADATA[organ].helps).filter((help, index, array) => {
    return array.indexOf(help) === index
  })
}

export const FUTURE_SELF_SYSTEM_GROUPS: FutureSelfSystemProfile[] =
  FUTURE_SELF_SYSTEM_SEEDS.map((system) => ({
    ...system,
    helps: collectSystemHelps(system.organs),
  }))

const ORGAN_TO_SYSTEM = FUTURE_SELF_SYSTEM_GROUPS.reduce(
  (mapping, system) => {
    system.organs.forEach((organ) => {
      mapping[organ] = system.id
    })

    return mapping
  },
  {} as Record<OrganKey, BodySystemKey>,
)

const ACTIVITY_PHRASES: Partial<
  Record<ActivityType, { positive: string; negative: string }>
> = {
  sleep: {
    positive: 'sleeping more steadily',
    negative: 'sleep feeling thinner',
  },
  cardio: {
    positive: 'doing cardio again',
    negative: 'cardio slipping away',
  },
  strength: {
    positive: 'keeping up strength work',
    negative: 'strength work slipping',
  },
  walking: {
    positive: 'walking more',
    negative: 'movement dropping off',
  },
  mobility: {
    positive: 'making time for mobility',
    negative: 'stiff days piling up',
  },
  stress: {
    positive: 'resetting after stress',
    negative: 'stress hanging around',
  },
  smoking: {
    positive: 'cutting back on smoking',
    negative: 'smoking',
  },
  alcohol: {
    positive: 'easing up on alcohol',
    negative: 'alcohol',
  },
  alcohol_heavy_intake: {
    positive: 'pulling back from heavy drinking',
    negative: 'heavy drinking',
  },
  processed_food: {
    positive: 'stepping away from processed food',
    negative: 'processed food stacking up',
  },
  healthy_meal: {
    positive: 'choosing healthier meals',
    negative: 'meals feeling less supportive',
  },
  balanced_meal: {
    positive: 'keeping meals balanced',
    negative: 'meals feeling less steady',
  },
  high_sugar_meal: {
    positive: 'cutting back on sugar-heavy meals',
    negative: 'sugar-heavy meals',
  },
  high_sat_fat_meal: {
    positive: 'cutting back on heavier meals',
    negative: 'heavier meals',
  },
  protein_rich_meal: {
    positive: 'getting more protein',
    negative: 'protein support dipping',
  },
  fiber_rich_meal: {
    positive: 'choosing more fiber-rich meals',
    negative: 'fiber support dipping',
  },
  hydration: {
    positive: 'staying hydrated',
    negative: 'hydration slipping',
  },
  sedentary_day: {
    positive: 'breaking up sedentary days',
    negative: 'low-movement days',
  },
  social_connection: {
    positive: 'staying socially connected',
    negative: 'feeling less connected',
  },
}

function prettifyActivityType(activityType: string) {
  return activityType.replace(/_/g, ' ')
}

function describeActivity(type: ActivityType, sentiment: 'positive' | 'negative') {
  const phrase = ACTIVITY_PHRASES[type]?.[sentiment]
  if (phrase) return phrase

  const readable = prettifyActivityType(type)
  return sentiment === 'positive' ? `building more ${readable}` : readable
}

function getScoreBand(score: number) {
  if (score >= 80) return 'strong'
  if (score >= 60) return 'steady'
  return 'recovering'
}

function getToneLabel(trendDirection: TrendDirection, overallScore: number) {
  const band = getScoreBand(overallScore)

  if (trendDirection === 'improving') {
    return band === 'strong' ? 'Momentum' : 'Lift'
  }

  if (trendDirection === 'steady') {
    return band === 'recovering' ? 'Grounding' : 'Steady'
  }

  return band === 'recovering' ? 'Recovery' : 'Reset'
}

function getTimeAnchor(latestCheckInAt?: string) {
  if (!latestCheckInAt) {
    return 'lately'
  }

  const timestamp = new Date(latestCheckInAt).getTime()
  if (!Number.isFinite(timestamp)) {
    return 'lately'
  }

  const elapsedHours = (Date.now() - timestamp) / (1000 * 60 * 60)

  if (elapsedHours <= 24) return 'today'
  if (elapsedHours <= 72) return 'lately'
  return 'this week'
}

function classifyTrend(score: number): TrendDirection {
  if (score >= 1.5) return 'improving'
  if (score <= -1.5) return 'strained'
  return 'steady'
}

function getLatestImpactScore(
  systemId: BodySystemKey,
  impacts: OrganImpactSummary[],
) {
  return impacts.reduce((total, impact) => {
    if (ORGAN_TO_SYSTEM[impact.organ] !== systemId) {
      return total
    }

    return total + impact.scoreDelta
  }, 0)
}

function getFocusSystem(
  systems: FutureSelfSystemSnapshot[],
  latestImpactSummary: OrganImpactSummary[],
) {
  const [focusSystem] = [...systems].sort((left, right) => {
    if (left.score !== right.score) {
      return left.score - right.score
    }

    return (
      getLatestImpactScore(left.id, latestImpactSummary) -
      getLatestImpactScore(right.id, latestImpactSummary)
    )
  })

  return focusSystem ?? {
    id: FUTURE_SELF_SYSTEM_GROUPS[0].id,
    label: FUTURE_SELF_SYSTEM_GROUPS[0].label,
    score: 100,
  }
}

function buildAggregates(logEntries: HealthLogEntry[]) {
  const activityTotals = new Map<ActivityType, ActivityAggregate>()
  const systemTotals = new Map<BodySystemKey, SystemAggregate>(
    FUTURE_SELF_SYSTEM_GROUPS.map((system) => [
      system.id,
      {
        totalScore: 0,
        activityTotals: new Map<ActivityType, number>(),
      },
    ]),
  )

  for (const entry of logEntries.slice(0, LOOKBACK_ENTRY_COUNT)) {
    for (const event of entry.events) {
      const current = activityTotals.get(event.type) ?? {
        totalScore: 0,
        occurrences: 0,
      }

      current.occurrences += 1
      activityTotals.set(event.type, current)
    }

    for (const contribution of entry.contributions) {
      const activityAggregate = activityTotals.get(contribution.activityType) ?? {
        totalScore: 0,
        occurrences: 0,
      }
      activityAggregate.totalScore += contribution.netScoreEffectEstimate
      activityTotals.set(contribution.activityType, activityAggregate)

      const systemId = ORGAN_TO_SYSTEM[contribution.organ]
      const systemAggregate = systemTotals.get(systemId)

      if (!systemAggregate) {
        continue
      }

      systemAggregate.totalScore += contribution.netScoreEffectEstimate
      systemAggregate.activityTotals.set(
        contribution.activityType,
        (systemAggregate.activityTotals.get(contribution.activityType) ?? 0) +
          contribution.netScoreEffectEstimate,
      )
    }
  }

  const trendScore = Array.from(systemTotals.values()).reduce((total, system) => {
    return total + system.totalScore
  }, 0)

  return {
    activityTotals,
    systemTotals,
    trendScore,
  }
}

function getRecentWin(
  activityTotals: Map<ActivityType, ActivityAggregate>,
) {
  const [recentWin] = Array.from(activityTotals.entries())
    .map(([type, aggregate]) => {
      const supportScore =
        aggregate.totalScore +
        Math.max(0, aggregate.occurrences - 1) * 0.45 +
        (BENEFICIAL_ACTIVITIES.includes(type) ? 0.15 : 0)

      return {
        type,
        supportScore,
        totalScore: aggregate.totalScore,
        occurrences: aggregate.occurrences,
      }
    })
    .filter((aggregate) => aggregate.totalScore > 0)
    .sort((left, right) => {
      if (right.supportScore !== left.supportScore) {
        return right.supportScore - left.supportScore
      }

      return right.occurrences - left.occurrences
    })

  if (!recentWin) {
    return 'showing up for check-ins'
  }

  return describeActivity(recentWin.type, 'positive')
}

function getRecentStrain(
  focusSystemId: BodySystemKey,
  systemTotals: Map<BodySystemKey, SystemAggregate>,
  streaks: StreakState,
  latestImpactSummary: OrganImpactSummary[],
) {
  const focusSystem = systemTotals.get(focusSystemId)

  if (focusSystem) {
    const [recentStrain] = Array.from(focusSystem.activityTotals.entries())
      .filter(([, score]) => score < 0)
      .map(([type, score]) => {
        const streakDays = streaks[type] ?? 0
        const weightedScore = score * (1 + Math.min(streakDays, 5) * 0.12)

        return {
          type,
          weightedScore,
        }
      })
      .sort((left, right) => left.weightedScore - right.weightedScore)

    if (recentStrain) {
      return describeActivity(recentStrain.type, 'negative')
    }
  }

  const fallbackImpact = latestImpactSummary.find((impact) => {
    return impact.direction === 'down' && ORGAN_TO_SYSTEM[impact.organ] === focusSystemId
  })

  return fallbackImpact ? `${fallbackImpact.label.toLowerCase()} strain` : undefined
}

function normalizeToken(token: string) {
  return token.toLowerCase().replace(/(ing|ed|s)$/g, '')
}

function tokenizePhrase(phrase: string) {
  return phrase
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(normalizeToken)
    .filter((token) => token.length >= 3)
}

function phrasesOverlap(left: string, right: string) {
  const rightTokens = new Set(tokenizePhrase(right))
  return tokenizePhrase(left).some((token) => rightTokens.has(token))
}

function getSuggestedNextStep(
  focusSystemId: BodySystemKey,
  recentWin: string,
  focusSystemLabel: string,
) {
  const system = FUTURE_SELF_SYSTEM_GROUPS.find((item) => item.id === focusSystemId)
  const helps = system?.helps ?? []

  const nextStep = helps.find((help) => !phrasesOverlap(help, recentWin))

  return nextStep ?? helps[0] ?? `One gentle ${focusSystemLabel.toLowerCase()} reset`
}

function buildNarrativeInput(
  context: FutureSelfMessageContext,
): FutureSelfNarrativeInput {
  const { activityTotals, systemTotals, trendScore } = buildAggregates(context.logEntries)
  const focusSystem = getFocusSystem(context.systems, context.latestImpactSummary)
  const recentWin = getRecentWin(activityTotals)

  return {
    trendDirection: classifyTrend(trendScore),
    recentWin,
    recentStrain: getRecentStrain(
      focusSystem.id,
      systemTotals,
      context.streaks,
      context.latestImpactSummary,
    ),
    focusSystem: focusSystem.label.toLowerCase(),
    suggestedNextStep: getSuggestedNextStep(
      focusSystem.id,
      recentWin,
      focusSystem.label,
    ),
    timeAnchor: getTimeAnchor(context.latestCheckInAt),
  }
}

function buildFallbackMessage(input: FutureSelfNarrativeInput) {
  if (input.trendDirection === 'improving') {
    return `I can feel how ${input.recentWin} is helping me ${input.timeAnchor}. ${input.suggestedNextStep} would keep our ${input.focusSystem} momentum going.`
  }

  if (input.trendDirection === 'steady') {
    return `I'm staying steady because ${input.recentWin} has been helping me ${input.timeAnchor}. ${input.suggestedNextStep} would give our ${input.focusSystem} the next lift.`
  }

  if (input.recentStrain) {
    return `I'm still with you, and ${input.recentWin} is helping me hold on. ${input.suggestedNextStep} would ease the ${input.recentStrain} I feel in our ${input.focusSystem}.`
  }

  return `I'm still with you, and ${input.recentWin} is helping me hold on. ${input.suggestedNextStep} would help our ${input.focusSystem} recover.`
}

function sanitizeMessageBody(body: string) {
  return body
    .replace(/\s+/g, ' ')
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim()
}

function isValidGeneratedMessage(body: string) {
  const sanitized = sanitizeMessageBody(body)
  if (!sanitized || sanitized.length > MAX_GENERATED_MESSAGE_LENGTH) {
    return false
  }

  const sentenceMatches = sanitized.match(/[^.!?]+[.!?]?/g) ?? []
  const sentenceCount = sentenceMatches.filter((sentence) => sentence.trim().length > 0)
    .length

  if (sentenceCount === 0 || sentenceCount > 2) {
    return false
  }

  return /\bI(?:'m| am| can| feel| know| notice| need| want| see| keep| stay| stayed)?\b/.test(
    sanitized,
  )
}

async function synthesizeFutureSelfMessage(
  context: FutureSelfMessageContext,
  toneLabel: string,
  input: FutureSelfNarrativeInput,
) {
  const apiKey =
    import.meta.env.DEV && typeof import.meta.env.VITE_OPENAI_API_KEY === 'string'
      ? import.meta.env.VITE_OPENAI_API_KEY.trim()
      : ''

  if (!apiKey) {
    return null
  }

  const client = createOpenAIResponsesClient({ apiKey })
  const prompt = buildFutureSelfMessagePrompt({
    toneLabel,
    trendDirection: input.trendDirection,
    timeAnchor: input.timeAnchor,
    overallScore: context.overallScore,
    recentWin: input.recentWin,
    recentStrain: input.recentStrain,
    focusSystem: input.focusSystem,
    suggestedNextStep: input.suggestedNextStep,
  })

  try {
    const response = await client.complete(prompt)
    const sanitized = sanitizeMessageBody(response)
    return isValidGeneratedMessage(sanitized) ? sanitized : null
  } catch {
    return null
  }
}

export async function generateFutureSelfMessage(
  context: FutureSelfMessageContext,
): Promise<FutureSelfMessage> {
  if (context.recentCheckInCount === 0) {
    return {
      body: 'I am still learning from you. One gentle check-in gives me enough signal to reflect something useful back.',
      toneLabel: 'Warm-up',
      source: 'fallback',
    }
  }

  const narrativeInput = buildNarrativeInput(context)
  const toneLabel = getToneLabel(narrativeInput.trendDirection, context.overallScore)
  const llmMessage = await synthesizeFutureSelfMessage(
    context,
    toneLabel,
    narrativeInput,
  )

  if (llmMessage) {
    return {
      body: llmMessage,
      toneLabel,
      source: 'llm',
    }
  }

  return {
    body: buildFallbackMessage(narrativeInput),
    toneLabel,
    source: 'fallback',
  }
}
