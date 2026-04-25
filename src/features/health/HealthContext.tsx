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
  buildProjectionBasisLabel,
  buildImpactNarrative,
  buildLocalExplanation,
  buildProjectionCycle,
  createUnavailableFutureProjection,
  createInitialOrganStates,
  formatProjectionBand,
  getProjectionCopy,
  getProjectionMinLogEntries,
  getTopNegativeContributors,
  getTopPositiveContributors,
  isProjectionAgeValid,
  rankProjectionLevers,
  simulateToAge70,
  summarizeContributionsByOrgan,
  type ActivityContribution,
  type ActivityEvent,
  type OrganFutureProjection,
  type OrganImpactSummary,
  type OrganKey,
  type OrganStates,
  type StreakState,
} from './index'
import { buildEvents, type WizardState } from './logging'

const STORAGE_KEY = 'petme-health-store-v1'
const MAX_LOG_ENTRIES = 730
const RECENT_ENTRY_COUNT = 14
const OVERVIEW_TREND_WINDOW = 7
const MIN_TREND_DELTA = 1.5
const MIN_PROJECTION_LOG_ENTRIES = getProjectionMinLogEntries()
const SEEDED_HISTORY_DAYS = 365
const HEALTHY_DEMO_AGE = 31
const MODERATE_DEMO_AGE = 33
const UNHEALTHY_DEMO_AGE = 34

export type ProfileState = {
  currentAge?: number
}

export type HealthLogEntry = {
  id: string
  timestamp: string
  events: ActivityEvent[]
  contributions: ActivityContribution[]
}

export type PersistedHealthState = {
  organStates: OrganStates
  streaks: StreakState
  logEntries: HealthLogEntry[]
  profile: ProfileState
}

export type OrganHistoryItem = {
  id: string
  label: string
  detail: string
  tone: string
  timestamp: string
}

export type OrganTrendDirection = 'improving' | 'flat' | 'strained'

export type OrganTrendPoint = {
  id: string
  score: number
  timestamp: string
  label: string
}

export type OrganTrend = {
  points: OrganTrendPoint[]
  delta: number
  direction: OrganTrendDirection
  primaryDrivers: string[]
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
  trend: OrganTrend
  futureProjection: OrganFutureProjection
}

type ReplayedEntrySnapshot = {
  entryId: string
  timestamp: string
  organStates: OrganStates
  contributions: ActivityContribution[]
}

type HealthContextValue = PersistedHealthState & {
  overallScore: number
  statCards: HealthStatCard[]
  latestImpactNarrative: string | null
  latestImpactSummary: OrganImpactSummary[]
  organSummaries: Record<OrganKey, OrganSummary>
  logActivities: (events: ActivityEvent[]) => void
  loadHealthyDemoYear: () => void
  loadModerateDemoYear: () => void
  loadUnhealthyDemoYear: () => void
  setCurrentAge: (age?: number) => void
  resetHealthState: () => void
}

const createEmptyState = (): PersistedHealthState => ({
  organStates: createInitialOrganStates(),
  streaks: {},
  logEntries: [],
  profile: {},
})

function createSeedTimestamp(referenceDate: Date, daysAgo: number): string {
  const date = new Date(referenceDate)
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

function buildHealthySeedValues(timestamp: string, dayIndex: number): WizardState {
  const date = new Date(timestamp)
  const weekday = date.getDay()
  const monthDay = date.getDate()
  const isWeekend = weekday === 0 || weekday === 6
  const cardioDay = weekday === 2 || weekday === 4 || weekday === 6
  const strengthDay = weekday === 1 || weekday === 5
  const activeRecoveryDay = weekday === 3
  const indulgentWeekend = isWeekend && dayIndex % 28 === 0
  const drinkNight = weekday === 5 && dayIndex % 21 === 0

  let mealType: WizardState['mealType'] = 'healthy_meal'
  if (dayIndex % 17 === 0) {
    mealType = 'fiber_rich_meal'
  } else if (dayIndex % 9 === 0) {
    mealType = 'protein_rich_meal'
  } else if (activeRecoveryDay || weekday === 1) {
    mealType = 'balanced_meal'
  }

  if (indulgentWeekend) {
    mealType = monthDay % 3 === 0 ? 'high_sugar_meal' : 'processed_food'
  } else if (dayIndex % 46 === 0) {
    mealType = 'high_sat_fat_meal'
  }

  const sleepDuration = isWeekend ? 8.1 : cardioDay ? 7.8 : 7.5
  const sleepQuality = indulgentWeekend ? 3 : isWeekend ? 5 : 4
  const wakeFeeling = indulgentWeekend ? 3 : 4
  const stressLevel = indulgentWeekend ? 5 : weekday === 1 ? 4 : cardioDay ? 2 : 3
  const walkingSteps = activeRecoveryDay
    ? 6500
    : isWeekend
      ? 9800
      : cardioDay
        ? 8800
        : strengthDay
          ? 7600
          : 7000
  const cardioMinutes = cardioDay ? (weekday === 6 ? 50 : 35) : 0
  const strengthMinutes = strengthDay ? 40 : 0
  const socialMoments = isWeekend ? 3 : weekday === 4 || weekday === 5 ? 2 : 1
  const alcoholDrinks = indulgentWeekend ? 1 : drinkNight ? 2 : 0

  return {
    sleepDuration,
    sleepQuality,
    wakeFeeling,
    stressLevel,
    walkingSteps,
    cardioMinutes,
    strengthMinutes,
    socialMoments,
    mealType,
    alcoholDrinks,
    smokingCigarettes: 0,
  }
}

function buildUnhealthySeedValues(timestamp: string, dayIndex: number): WizardState {
  const date = new Date(timestamp)
  const weekday = date.getDay()
  const isWeekend = weekday === 0 || weekday === 6
  const cardioDay = weekday === 2 || dayIndex % 19 === 0
  const strengthDay = weekday === 6 && dayIndex % 2 === 0
  const smokeDay = weekday === 5
  const drinkDay = weekday === 6

  let mealType: WizardState['mealType']
  if (dayIndex % 9 === 0) {
    mealType = 'high_sugar_meal'
  } else if (dayIndex % 5 === 0) {
    mealType = 'high_sat_fat_meal'
  } else if (dayIndex % 7 === 0) {
    mealType = 'balanced_meal'
  } else {
    mealType = 'processed_food'
  }

  const walkingSteps = cardioDay
    ? 5200
    : strengthDay
      ? 4600
      : isWeekend
        ? 2800
        : 1900

  return {
    sleepDuration: isWeekend ? 6.9 : 6.3,
    sleepQuality: isWeekend ? 3 : 2,
    wakeFeeling: isWeekend ? 3 : 2,
    stressLevel: weekday === 1 ? 6 : 5,
    walkingSteps,
    cardioMinutes: cardioDay ? 28 : 0,
    strengthMinutes: strengthDay ? 24 : 0,
    socialMoments: isWeekend ? 2 : 1,
    mealType,
    alcoholDrinks: drinkDay ? 3 : 0,
    smokingCigarettes: smokeDay ? 3 : 0,
  }
}

function buildModerateSeedValues(timestamp: string, dayIndex: number): WizardState {
  const date = new Date(timestamp)
  const weekday = date.getDay()
  const isWeekend = weekday === 0 || weekday === 6
  const cardioDay = weekday === 2 || weekday === 5
  const strengthDay = weekday === 6
  const activeWalkDay = weekday === 3
  const smokeDay = weekday === 5 && dayIndex % 14 === 0
  const drinkDay = weekday === 6 && dayIndex % 10 === 0

  let mealType: WizardState['mealType'] = 'balanced_meal'
  if (dayIndex % 11 === 0) {
    mealType = 'healthy_meal'
  } else if (dayIndex % 8 === 0) {
    mealType = 'protein_rich_meal'
  } else if (dayIndex % 6 === 0) {
    mealType = 'processed_food'
  }

  if (dayIndex % 27 === 0) {
    mealType = 'high_sugar_meal'
  } else if (dayIndex % 31 === 0) {
    mealType = 'high_sat_fat_meal'
  }

  const walkingSteps = cardioDay
    ? 7200
    : strengthDay
      ? 6800
      : activeWalkDay
        ? 6100
        : isWeekend
          ? 4800
          : 3900

  return {
    sleepDuration: isWeekend ? 7.4 : 6.9,
    sleepQuality: isWeekend ? 4 : 3,
    wakeFeeling: isWeekend ? 4 : 3,
    stressLevel: weekday === 1 ? 5 : weekday === 4 ? 4 : 3,
    walkingSteps,
    cardioMinutes: cardioDay ? 30 : 0,
    strengthMinutes: strengthDay ? 30 : 0,
    socialMoments: isWeekend ? 2 : 1,
    mealType,
    alcoholDrinks: drinkDay ? 2 : 0,
    smokingCigarettes: smokeDay ? 2 : 0,
  }
}

function createDemoSeededState(
  profileAge: number,
  idPrefix: string,
  buildValues: (timestamp: string, dayIndex: number) => WizardState,
): PersistedHealthState {
  const referenceDate = new Date()
  let organStates = createInitialOrganStates()
  let streaks: StreakState = {}
  const chronologicalEntries: HealthLogEntry[] = []

  for (let daysAgo = SEEDED_HISTORY_DAYS - 1; daysAgo >= 0; daysAgo -= 1) {
    const timestamp = createSeedTimestamp(
      referenceDate,
      daysAgo,
    )
    const dayIndex = SEEDED_HISTORY_DAYS - 1 - daysAgo
    const events = buildEvents(buildValues(timestamp, dayIndex)).map(
      (event) => ({
        ...event,
        timestamp,
      }),
    )
    const result = applyActivityEvents(organStates, events, streaks)

    chronologicalEntries.push({
      id: `${idPrefix}-${timestamp.slice(0, 10)}`,
      timestamp,
      events,
      contributions: result.contributions,
    })

    organStates = result.organStates
    streaks = result.streaks
  }

  return {
    organStates,
    streaks,
    logEntries: chronologicalEntries.reverse(),
    profile: {
      currentAge: profileAge,
    },
  }
}

function createHealthySeededState(): PersistedHealthState {
  return createDemoSeededState(
    HEALTHY_DEMO_AGE,
    'healthy-seed',
    buildHealthySeedValues,
  )
}

function createModerateSeededState(): PersistedHealthState {
  return createDemoSeededState(
    MODERATE_DEMO_AGE,
    'moderate-seed',
    buildModerateSeedValues,
  )
}

function createUnhealthySeededState(): PersistedHealthState {
  return createDemoSeededState(
    UNHEALTHY_DEMO_AGE,
    'unhealthy-seed',
    buildUnhealthySeedValues,
  )
}

const HealthContext = createContext<HealthContextValue | null>(null)

function round(value: number, digits = 1): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function normalizeScore(score: number): number {
  return Math.max(0, Math.min(1, score / 100))
}

function sanitizeCurrentAge(age: unknown): number | undefined {
  if (typeof age !== 'number' || !Number.isFinite(age)) {
    return undefined
  }

  const normalized = Math.round(age)
  return isProjectionAgeValid(normalized) ? normalized : undefined
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

function classifyTrend(delta: number): OrganTrendDirection {
  if (delta >= MIN_TREND_DELTA) return 'improving'
  if (delta <= -MIN_TREND_DELTA) return 'strained'
  return 'flat'
}

function computeTrendDelta(points: OrganTrendPoint[], windowSize = OVERVIEW_TREND_WINDOW) {
  const visiblePoints = points.slice(-windowSize)

  if (visiblePoints.length < 2) {
    return 0
  }

  return round(
    visiblePoints[visiblePoints.length - 1].score - visiblePoints[0].score,
  )
}

function replayLogEntries(logEntries: HealthLogEntry[]): ReplayedEntrySnapshot[] {
  const orderedEntries = [...logEntries].reverse()
  const snapshots: ReplayedEntrySnapshot[] = []
  let organStates = createInitialOrganStates()
  let streaks: StreakState = {}

  for (const entry of orderedEntries) {
    const result = applyActivityEvents(organStates, entry.events, streaks)

    snapshots.push({
      entryId: entry.id,
      timestamp: entry.timestamp,
      organStates: result.organStates,
      contributions: result.contributions,
    })

    organStates = result.organStates
    streaks = result.streaks
  }

  return snapshots
}

function summarizePrimaryDrivers(
  organ: OrganKey,
  snapshots: ReplayedEntrySnapshot[],
  direction: OrganTrendDirection,
  limit = 2,
) {
  const contributions = snapshots.flatMap((snapshot) =>
    snapshot.contributions.filter((contribution) => contribution.organ === organ),
  )

  if (contributions.length === 0) {
    return []
  }

  let filtered = contributions

  if (direction === 'improving') {
    filtered = contributions.filter(
      (contribution) => contribution.netScoreEffectEstimate > 0,
    )
  } else if (direction === 'strained') {
    filtered = contributions.filter(
      (contribution) => contribution.netScoreEffectEstimate < 0,
    )
  }

  if (filtered.length === 0) {
    filtered = contributions
  }

  const totals = new Map<ActivityContribution['activityType'], number>()

  for (const contribution of filtered) {
    const current = totals.get(contribution.activityType) ?? 0
    totals.set(
      contribution.activityType,
      current + Math.abs(contribution.netScoreEffectEstimate),
    )
  }

  return Array.from(totals.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([activityType]) => prettifyActivityType(activityType))
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
    return createEmptyState()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createHealthySeededState()

    const parsed = JSON.parse(raw) as Partial<PersistedHealthState>
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.organStates ||
      !parsed.logEntries ||
      !parsed.streaks
    ) {
      return createHealthySeededState()
    }

    return {
      organStates: parsed.organStates as OrganStates,
      streaks: parsed.streaks as StreakState,
      logEntries: Array.isArray(parsed.logEntries)
        ? (parsed.logEntries as HealthLogEntry[])
        : [],
      profile:
        parsed.profile && typeof parsed.profile === 'object'
          ? {
              currentAge: sanitizeCurrentAge(
                (parsed.profile as ProfileState).currentAge,
              ),
            }
          : {},
    }
  } catch {
    return createHealthySeededState()
  }
}

export function HealthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedHealthState>(() => loadPersistedState())

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<HealthContextValue>(() => {
    const allContributions = state.logEntries.flatMap((entry) => entry.contributions)
    const replayedSnapshots = replayLogEntries(state.logEntries)
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
    const projectionCycle = buildProjectionCycle(state.logEntries)
    const projectionAvailable =
      sanitizeCurrentAge(state.profile.currentAge) != null &&
      state.logEntries.length >= MIN_PROJECTION_LOG_ENTRIES &&
      projectionCycle.length > 0
    const currentAge = sanitizeCurrentAge(state.profile.currentAge)
    const projectionSimulation =
      projectionAvailable && currentAge != null
        ? simulateToAge70({
            currentAge,
            organStates: state.organStates,
            streaks: state.streaks,
            cycle: projectionCycle,
          })
        : null
    const projectionLevers =
      projectionAvailable && currentAge != null
        ? rankProjectionLevers({
            currentAge,
            organStates: state.organStates,
            streaks: state.streaks,
            cycle: projectionCycle,
          })
        : null
    const projectionBasisLabel = buildProjectionBasisLabel(projectionCycle)

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
        const trendPoints = replayedSnapshots.map((snapshot) => ({
          id: snapshot.entryId,
          score: snapshot.organStates[organ].score,
          timestamp: snapshot.timestamp,
          label: formatTimestamp(snapshot.timestamp),
        }))
        const trendDelta = computeTrendDelta(trendPoints)
        const trendDirection = classifyTrend(trendDelta)
        const primaryDrivers = summarizePrimaryDrivers(
          organ,
          replayedSnapshots.slice(-OVERVIEW_TREND_WINDOW),
          trendDirection,
        )

        const history = state.logEntries
          .flatMap((entry) =>
            entry.contributions
              .filter((contribution) => contribution.organ === organ)
              .map((contribution, index) =>
                buildHistoryItem(organ, contribution, entry, index),
              ),
          )
          .slice(0, 6)

        const futureProjection =
          projectionSimulation && projectionLevers
            ? (() => {
                const projectedScore = projectionSimulation.projectedScores[organ]
                const copy = getProjectionCopy(organ, projectedScore)

                return {
                  available: true,
                  projectedScore,
                  band: formatProjectionBand(projectedScore),
                  points: projectionSimulation.pointsByOrgan[organ],
                  scenarioTitle: copy.scenarioTitle,
                  scenarioBody: copy.scenarioBody,
                  abilityBullets: copy.abilityBullets,
                  topSupports: projectionLevers[organ].supports.slice(0, 2),
                  topDrags: projectionLevers[organ].drags.slice(0, 2),
                  basisLabel: projectionBasisLabel,
                }
              })()
            : createUnavailableFutureProjection()

        accumulator[organ] = {
          name: ORGAN_METADATA[organ].name,
          score: stateForOrgan.score,
          progress: normalizeScore(stateForOrgan.score),
          latestDelta: latestImpactByOrgan.get(organ) ?? 0,
          explanation,
          helps: ORGAN_METADATA[organ].helps,
          history,
          trend: {
            points: trendPoints,
            delta: trendDelta,
            direction: trendDirection,
            primaryDrivers,
          },
          futureProjection,
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
            profile: current.profile,
          }
        })
      },
      loadHealthyDemoYear: () => {
        setState(createHealthySeededState())
      },
      loadModerateDemoYear: () => {
        setState(createModerateSeededState())
      },
      loadUnhealthyDemoYear: () => {
        setState(createUnhealthySeededState())
      },
      setCurrentAge: (age?: number) => {
        setState((current) => ({
          ...current,
          profile: {
            currentAge: sanitizeCurrentAge(age),
          },
        }))
      },
      resetHealthState: () => {
        setState((current) => ({
          ...createEmptyState(),
          profile: current.profile,
        }))
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
