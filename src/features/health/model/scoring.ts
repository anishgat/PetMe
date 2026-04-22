import type {
  ActivityContribution,
  ActivityEvent,
  ActivityImpactMap,
  DailyUpdateResult,
  OrganImpact,
  OrganKey,
  OrganState,
  OrganStates,
  StreakState,
} from "./types";
import {
  ACTIVITY_IMPACTS,
  BENEFICIAL_ACTIVITIES,
  HARMFUL_ACTIVITIES,
} from "./organImpacts";

const ALL_ORGANS: OrganKey[] = [
  "heart",
  "lungs",
  "brain",
  "liver",
  "stomach",
  "intestines",
  "kidneys",
  "bones",
];

const ACUTE_WEIGHT = 1.2;
const CHRONIC_WEIGHT = 1.8;
const RECOVERY_WEIGHT = 1.0;

const DECAY = {
  acute: 0.65,
  chronic: 0.97,
  recovery: 0.99,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function createInitialOrganState(): OrganState {
  return {
    score: 100,
    acuteLoad: 0,
    chronicLoad: 0,
    recoveryReserve: 0,
  };
}

export function createInitialOrganStates(): OrganStates {
  return {
    heart: createInitialOrganState(),
    lungs: createInitialOrganState(),
    brain: createInitialOrganState(),
    liver: createInitialOrganState(),
    stomach: createInitialOrganState(),
    intestines: createInitialOrganState(),
    kidneys: createInitialOrganState(),
    bones: createInitialOrganState(),
  };
}

export function computeScore(state: Omit<OrganState, "score">): number {
  return clamp(
    100 -
      ACUTE_WEIGHT * state.acuteLoad -
      CHRONIC_WEIGHT * state.chronicLoad +
      RECOVERY_WEIGHT * state.recoveryReserve,
    0,
    100,
  );
}

export function applyDailyDecay(states: OrganStates): OrganStates {
  const next: Partial<OrganStates> = {};

  for (const organ of ALL_ORGANS) {
    const current = states[organ];
    const acuteLoad = Math.max(0, current.acuteLoad * DECAY.acute);
    const chronicLoad = Math.max(0, current.chronicLoad * DECAY.chronic);
    const recoveryReserve = Math.max(0, current.recoveryReserve * DECAY.recovery);

    next[organ] = {
      acuteLoad: round(acuteLoad),
      chronicLoad: round(chronicLoad),
      recoveryReserve: round(recoveryReserve),
      score: round(
        computeScore({
          acuteLoad,
          chronicLoad,
          recoveryReserve,
        }),
      ),
    };
  }

  return next as OrganStates;
}

function isHarmfulActivity(type: ActivityEvent["type"]): boolean {
  return HARMFUL_ACTIVITIES.includes(type);
}

function isBeneficialActivity(type: ActivityEvent["type"]): boolean {
  return BENEFICIAL_ACTIVITIES.includes(type);
}

function getStreakMultiplier(activity: ActivityEvent, streaks: StreakState): number {
  const streakDays = streaks[activity.type] ?? 0;

  if (isHarmfulActivity(activity.type)) {
    return 1 + Math.min(0.08 * streakDays, 0.8);
  }

  return 1;
}

function getBeneficialDiminishingMultiplier(activity: ActivityEvent): number {
  if (!isBeneficialActivity(activity.type)) return 1;

  const amount = Math.max(activity.amount, 0);

  switch (activity.type) {
    case "cardio":
    case "strength":
    case "mobility":
      return clamp(0.35 + Math.log1p(amount) / 4, 0.35, 1);

    case "walking":
      return clamp(Math.sqrt(amount / 6000), 0.2, 1);

    case "sleep":
      return 1;

    default:
      return clamp(1 / Math.sqrt(Math.max(amount, 1)), 0.35, 1);
  }
}

function normalizeActivityAmount(activity: ActivityEvent): number {
  switch (activity.type) {
    case "smoking":
      return activity.amount;

    case "sleep":
      if (activity.amount >= 7) {
        return Math.min(activity.amount / 8, 1.25);
      }
      return Math.max(activity.amount / 8, 0.4);

    case "cardio":
    case "strength":
    case "mobility":
      return activity.amount / 30;

    case "walking":
      return activity.amount / 6000;

    case "stress":
      return activity.amount / 5;

    case "alcohol":
    case "alcohol_heavy_intake":
      return activity.amount;

    case "processed_food":
    case "healthy_meal":
    case "balanced_meal":
    case "high_sugar_meal":
    case "high_sat_fat_meal":
    case "protein_rich_meal":
    case "fiber_rich_meal":
      return activity.amount;

    case "hydration":
      return activity.amount;

    case "sedentary_day":
    case "social_connection":
      return activity.amount;

    default:
      return activity.amount;
  }
}

function getConfidenceMultiplier(activity: ActivityEvent): number {
  if (activity.confidence == null) return 1;
  return clamp(activity.confidence, 0.5, 1);
}

function scaleImpact(
  baseImpact: OrganImpact,
  scale: number,
  harmfulMultiplier: number,
  beneficialMultiplier: number,
): OrganImpact {
  const acute =
    baseImpact.acute *
    scale *
    (baseImpact.acute > 0 ? harmfulMultiplier : beneficialMultiplier);

  const chronic =
    baseImpact.chronic *
    scale *
    (baseImpact.chronic > 0 ? harmfulMultiplier : beneficialMultiplier);

  const recovery =
    baseImpact.recovery *
    scale *
    (baseImpact.recovery < 0 ? harmfulMultiplier : beneficialMultiplier);

  return {
    acute: round(acute),
    chronic: round(chronic),
    recovery: round(recovery),
  };
}

function estimateScoreEffect(impact: OrganImpact): number {
  return round(
    -ACUTE_WEIGHT * impact.acute -
      CHRONIC_WEIGHT * impact.chronic +
      RECOVERY_WEIGHT * impact.recovery,
  );
}

function applyImpactToOrgan(state: OrganState, impact: OrganImpact): OrganState {
  const acuteLoad = Math.max(0, state.acuteLoad + impact.acute);
  const chronicLoad = Math.max(0, state.chronicLoad + impact.chronic);
  const recoveryReserve = Math.max(0, state.recoveryReserve + impact.recovery);

  return {
    acuteLoad: round(acuteLoad),
    chronicLoad: round(chronicLoad),
    recoveryReserve: round(recoveryReserve),
    score: round(computeScore({ acuteLoad, chronicLoad, recoveryReserve })),
  };
}

function getActivityImpactMap(activity: ActivityEvent): ActivityImpactMap {
  return ACTIVITY_IMPACTS[activity.type] ?? {};
}

export function updateStreaks(
  previousStreaks: StreakState,
  events: ActivityEvent[],
): StreakState {
  const next: StreakState = { ...previousStreaks };

  for (const type of HARMFUL_ACTIVITIES) {
    const hasActivity = events.some((event) => event.type === type && event.amount > 0);
    next[type] = hasActivity ? (next[type] ?? 0) + 1 : 0;
  }

  return next;
}

export function applyActivityEvents(
  states: OrganStates,
  events: ActivityEvent[],
  previousStreaks: StreakState = {},
): DailyUpdateResult {
  const decayedStates = applyDailyDecay(states);
  const nextStates: OrganStates = { ...decayedStates };
  const contributions: ActivityContribution[] = [];
  const nextStreaks = updateStreaks(previousStreaks, events);

  for (const event of events) {
    const baseMap = getActivityImpactMap(event);
    const scale = normalizeActivityAmount(event) * getConfidenceMultiplier(event);
    const harmfulMultiplier = getStreakMultiplier(event, nextStreaks);
    const beneficialMultiplier = getBeneficialDiminishingMultiplier(event);

    for (const organ of Object.keys(baseMap) as OrganKey[]) {
      const baseImpact = baseMap[organ];
      if (!baseImpact) continue;

      const scaledImpact = scaleImpact(
        baseImpact,
        scale,
        harmfulMultiplier,
        beneficialMultiplier,
      );

      nextStates[organ] = applyImpactToOrgan(nextStates[organ], scaledImpact);

      contributions.push({
        activityType: event.type,
        organ,
        acuteDelta: scaledImpact.acute,
        chronicDelta: scaledImpact.chronic,
        recoveryDelta: scaledImpact.recovery,
        netScoreEffectEstimate: estimateScoreEffect(scaledImpact),
      });
    }
  }

  return {
    organStates: nextStates,
    contributions,
    streaks: nextStreaks,
  };
}

export function getTopNegativeContributors(
  organ: OrganKey,
  contributions: ActivityContribution[],
  limit = 3,
): ActivityContribution[] {
  return contributions
    .filter((c) => c.organ === organ && c.netScoreEffectEstimate < 0)
    .sort((a, b) => a.netScoreEffectEstimate - b.netScoreEffectEstimate)
    .slice(0, limit);
}

export function getTopPositiveContributors(
  organ: OrganKey,
  contributions: ActivityContribution[],
  limit = 3,
): ActivityContribution[] {
  return contributions
    .filter((c) => c.organ === organ && c.netScoreEffectEstimate > 0)
    .sort((a, b) => b.netScoreEffectEstimate - a.netScoreEffectEstimate)
    .slice(0, limit);
}
