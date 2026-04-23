import { ORGAN_METADATA } from '../../../data/organs'
import type { ActivityContribution, OrganKey } from './types'

export type OrganImpactSummary = {
  organ: OrganKey
  label: string
  scoreDelta: number
  direction: 'up' | 'down' | 'flat'
  drivers: string[]
}

function prettifyActivityType(activityType: string) {
  return activityType.replace(/_/g, ' ')
}

function summarizeDirection(scoreDelta: number): OrganImpactSummary['direction'] {
  if (scoreDelta > 0.05) return 'up'
  if (scoreDelta < -0.05) return 'down'
  return 'flat'
}

export function summarizeContributionsByOrgan(
  contributions: ActivityContribution[],
  limit = 8,
): OrganImpactSummary[] {
  const byOrgan = new Map<
    OrganKey,
    { scoreDelta: number; drivers: Set<string> }
  >()

  for (const contribution of contributions) {
    const current = byOrgan.get(contribution.organ) ?? {
      scoreDelta: 0,
      drivers: new Set<string>(),
    }

    current.scoreDelta += contribution.netScoreEffectEstimate
    current.drivers.add(prettifyActivityType(contribution.activityType))
    byOrgan.set(contribution.organ, current)
  }

  return Array.from(byOrgan.entries())
    .map(([organ, value]) => ({
      organ,
      label: ORGAN_METADATA[organ].name,
      scoreDelta: Math.round(value.scoreDelta * 10) / 10,
      direction: summarizeDirection(value.scoreDelta),
      drivers: Array.from(value.drivers),
    }))
    .sort((left, right) => Math.abs(right.scoreDelta) - Math.abs(left.scoreDelta))
    .slice(0, limit)
}

export function buildImpactNarrative(
  impacts: OrganImpactSummary[],
  limit = 2,
): string | null {
  const primary = impacts
    .filter((impact) => impact.direction !== 'flat')
    .slice(0, limit)

  if (primary.length === 0) {
    return null
  }

  const fragments = primary.map((impact) => {
    const signedDelta =
      impact.scoreDelta > 0 ? `+${impact.scoreDelta.toFixed(1)}` : impact.scoreDelta.toFixed(1)
    const verb = impact.direction === 'up' ? 'supported' : 'strained'
    return `${verb} ${impact.label.toLowerCase()} (${signedDelta})`
  })

  return `This check-in ${fragments.join(' and ')}.`
}
