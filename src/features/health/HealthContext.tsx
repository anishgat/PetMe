/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ORGAN_METADATA } from '../../data/organs'
import {
  applyActivityEvents,
  buildImpactNarrative,
  buildLocalExplanation,
  createInitialOrganStates,
  getTopNegativeContributors,
  getTopPositiveContributors,
  summarizeContributionsByOrgan,
  type ActivityContribution,
  type ActivityEvent,
  type OrganImpactSummary,
  type OrganKey,
  type OrganStates,
  type StreakState,
} from './index'

const STORAGE_KEY = 'petme-health-store-v1'
const MAX_LOG_ENTRIES = 48
const RECENT_ENTRY_COUNT = 14

export type HealthLogEntry = {
  id: string
  timestamp: string
  events: ActivityEvent[]
  contributions: ActivityContribution[]
}

type PersistedHealthState = {
  organStates: OrganStates
  streaks: StreakState
  logEntries: HealthLogEntry[]
}

export type OrganHistoryItem = {
  id: string
  label: string
  detail: string
  tone: string
  timestamp: string
}

export type HealthStatCard = {
  label: string
  value: string
  unit: string
  note: string
  accent: string
  ring: string
  tint: string
  progress: number
}

type OrganSummary = {
  name: string
  score: number
  progress: number
  latestDelta: number
  explanation: string
  helps: string[]
  history: OrganHistoryItem[]
}

type HealthContextValue = PersistedHealthState & {
  overallScore: number
  statCards: HealthStatCard[]
  latestImpactNarrative: string | null
  latestImpactSummary: OrganImpactSummary[]
  organSummaries: Record<OrganKey, OrganSummary>
  logActivities: (events: ActivityEvent[]) => void
  resetHealthState: () => void
}

const createDefaultState = (): PersistedHealthState => ({
  organStates: createInitialOrganStates(),
  streaks: {},
  logEntries: [],
})

const HealthContext = createContext<HealthContextValue | null>(null)

function round(value: number, digits = 1): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function normalizeScore(score: number): number {
  return Math.max(0, Math.min(1, score / 100))
}

function prettifyActivityType(activityType: string): string {
  return activityType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function sumActivity(events: ActivityEvent[], type: ActivityEvent['type']): number {
  return events
    .filter((event) => event.type === type)
    .reduce((total, event) => total + event.amount, 0)
}

function getMoodLabel(score: number): string {
  if (score >= 85) return 'Bright'
  if (score >= 70) return 'Steady'
  if (score >= 55) return 'Tender'
  return 'Drained'
}

function getScoreTone(scoreEffect: number): string {
  if (scoreEffect > 0) return 'bg-emerald-400'
  if (scoreEffect < 0) return 'bg-rose-400'
  return 'bg-amber-400'
}

function buildHistoryItem(
  organ: OrganKey,
  contribution: ActivityContribution,
  entry: HealthLogEntry,
  index: number,
): OrganHistoryItem {
  const label = prettifyActivityType(contribution.activityType)
  const organName = ORGAN_METADATA[organ].name.toLowerCase()
  const effect = contribution.netScoreEffectEstimate
  const magnitude = Math.abs(effect).toFixed(1)
  const detail =
    effect >= 0
      ? `${label} supported your ${organName} and lifted its outlook by about ${magnitude} points.`
      : `${label} added strain to your ${organName} and pulled its outlook down by about ${magnitude} points.`

  return {
    id: `${entry.id}-${organ}-${index}`,
    label,
    detail,
    tone: getScoreTone(effect),
    timestamp: formatTimestamp(entry.timestamp),
  }
}

function loadPersistedState(): PersistedHealthState {
  if (typeof window === 'undefined') {
    return createDefaultState()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()

    const parsed = JSON.parse(raw) as Partial<PersistedHealthState>
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.organStates ||
      !parsed.logEntries ||
      !parsed.streaks
    ) {
      return createDefaultState()
    }

    return {
      organStates: parsed.organStates as OrganStates,
      streaks: parsed.streaks as StreakState,
      logEntries: Array.isArray(parsed.logEntries)
        ? (parsed.logEntries as HealthLogEntry[])
        : [],
    }
  } catch {
    return createDefaultState()
  }
}

export function HealthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedHealthState>(() => loadPersistedState())

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<HealthContextValue>(() => {
    const allContributions = state.logEntries.flatMap((entry) => entry.contributions)
    const recentEvents = state.logEntries
      .slice(0, RECENT_ENTRY_COUNT)
      .flatMap((entry) => entry.events)
    const latestImpactSummary = summarizeContributionsByOrgan(
      state.logEntries[0]?.contributions ?? [],
      4,
    )
    const latestImpactNarrative = buildImpactNarrative(latestImpactSummary)
    const latestImpactByOrgan = new Map(
      latestImpactSummary.map((impact) => [impact.organ, impact.scoreDelta]),
    )

    const organSummaries = Object.keys(ORGAN_METADATA).reduce(
      (accumulator, organKey) => {
        const organ = organKey as OrganKey
        const stateForOrgan = state.organStates[organ]
        const topNegative = getTopNegativeContributors(organ, allContributions)
        const topPositive = getTopPositiveContributors(organ, allContributions)
        const explanation = buildLocalExplanation({
          organ,
          state: stateForOrgan,
          topNegative,
          topPositive,
        })

        const history = state.logEntries
          .flatMap((entry) =>
            entry.contributions
              .filter((contribution) => contribution.organ === organ)
              .map((contribution, index) => buildHistoryItem(organ, contribution, entry, index)),
          )
          .slice(0, 6)

        accumulator[organ] = {
          name: ORGAN_METADATA[organ].name,
          score: stateForOrgan.score,
          progress: normalizeScore(stateForOrgan.score),
          latestDelta: latestImpactByOrgan.get(organ) ?? 0,
          explanation,
          helps: ORGAN_METADATA[organ].helps,
          history,
        }

        return accumulator
      },
      {} as Record<OrganKey, OrganSummary>,
    )

    const overallScore = round(
      Object.values(state.organStates).reduce((total, organ) => total + organ.score, 0) /
        Object.keys(state.organStates).length,
    )
    const weeklySteps = sumActivity(recentEvents, 'walking')
    const recentSleepEvents = recentEvents.filter((event) => event.type === 'sleep')
    const averageSleepHours =
      recentSleepEvents.length > 0
        ? round(
            recentSleepEvents.reduce((total, event) => total + event.amount, 0) /
              recentSleepEvents.length,
          )
        : 0
    const brainScore = state.organStates.brain.score
    const mood = getMoodLabel(brainScore)
    const latestTimestamp = state.logEntries[0]?.timestamp

    const statCards: HealthStatCard[] = [
      {
        label: 'Movement',
        value: weeklySteps.toLocaleString(),
        unit: 'steps',
        note:
          weeklySteps > 0
            ? 'Walking is supporting heart, lungs, and bones this week.'
            : 'Add a walk log to start nudging your future self upward.',
        accent: 'from-emerald-400/80 via-lime-300/60 to-transparent',
        ring: 'border-emerald-200/70',
        tint: 'text-emerald-950',
        progress: Math.min(1, weeklySteps / 42000),
      },
      {
        label: 'Sleep',
        value: averageSleepHours > 0 ? averageSleepHours.toFixed(1) : '0.0',
        unit: 'hours',
        note:
          averageSleepHours >= 7
            ? 'Sleep is giving your brain and heart real recovery reserve.'
            : 'A steadier sleep rhythm will help your recovery reserve rebuild.',
        accent: 'from-sky-400/80 via-cyan-200/60 to-transparent',
        ring: 'border-sky-200/70',
        tint: 'text-sky-950',
        progress: Math.min(1, averageSleepHours / 8),
      },
      {
        label: 'Mood',
        value: mood,
        unit: 'state',
        note:
          latestTimestamp != null
            ? `Latest update ${formatTimestamp(latestTimestamp)}. Overall score is ${overallScore.toFixed(
                1,
              )}.`
            : 'No activity logged yet. Start with one check-in to wake up the model.',
        accent: 'from-amber-300/80 via-orange-200/60 to-transparent',
        ring: 'border-orange-200/80',
        tint: 'text-orange-950',
        progress: normalizeScore(brainScore),
      },
    ]

    return {
      ...state,
      overallScore,
      statCards,
      latestImpactNarrative,
      latestImpactSummary,
      organSummaries,
      logActivities: (events: ActivityEvent[]) => {
        setState((current) => {
          const timestamp = new Date().toISOString()
          const stampedEvents = events.map((event) => ({
            ...event,
            timestamp: event.timestamp ?? timestamp,
          }))
          const result = applyActivityEvents(
            current.organStates,
            stampedEvents,
            current.streaks,
          )

          const nextEntry: HealthLogEntry = {
            id:
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `${Date.now()}`,
            timestamp,
            events: stampedEvents,
            contributions: result.contributions,
          }

          return {
            organStates: result.organStates,
            streaks: result.streaks,
            logEntries: [nextEntry, ...current.logEntries].slice(0, MAX_LOG_ENTRIES),
          }
        })
      },
      resetHealthState: () => {
        setState(createDefaultState())
      },
    }
  }, [state])

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
}

export function useHealth() {
  const context = useContext(HealthContext)

  if (!context) {
    throw new Error('useHealth must be used within HealthProvider.')
  }

  return context
}
