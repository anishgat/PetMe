import type { BodySystemKey } from '../insights/insightService'

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
  systems: FutureSelfSystemSnapshot[]
}

export type FutureSelfMessage = {
  body: string
  toneLabel: string
  placeholder: true
}

function getScoreBand(score: number) {
  if (score >= 80) return 'strong'
  if (score >= 60) return 'steady'
  return 'recovering'
}

function getLowestSystem(systems: FutureSelfSystemSnapshot[]) {
  return systems.reduce((lowest, current) => {
    if (lowest == null) return current
    return current.score < lowest.score ? current : lowest
  }, systems[0])
}

export async function generateFutureSelfMessage(
  context: FutureSelfMessageContext,
): Promise<FutureSelfMessage> {
  if (context.recentCheckInCount === 0) {
    return {
      body: 'I am still learning from you. One gentle check-in gives me enough signal to reflect something useful back.',
      toneLabel: 'Warm-up',
      placeholder: true,
    }
  }

  const lowestSystem = getLowestSystem(context.systems)
  const band = getScoreBand(context.overallScore)
  const impactLead =
    context.latestImpactNarrative != null ? `${context.latestImpactNarrative} ` : ''

  if (band === 'strong') {
    return {
      body: `${impactLead}I can feel the steady care showing up. If you protect our ${lowestSystem.label.toLowerCase()} rhythm today, this strong trend can stay with us.`,
      toneLabel: 'Momentum',
      placeholder: true,
    }
  }

  if (band === 'steady') {
    return {
      body: `${impactLead}I am holding steady, and our ${lowestSystem.label.toLowerCase()} trend looks like the next place a small win could matter. Keep it simple and repeatable today.`,
      toneLabel: 'Steady',
      placeholder: true,
    }
  }

  return {
    body: `${impactLead}I am rebuilding with you. A calmer day, a little recovery, and one kind choice for our ${lowestSystem.label.toLowerCase()} system would already move this in the right direction.`,
    toneLabel: 'Recovery',
    placeholder: true,
  }
}
