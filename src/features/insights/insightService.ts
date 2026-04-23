import type { OrganKey } from '../health/model/types'

export type BodySystemKey = 'cardio' | 'brain' | 'digestive' | 'renal' | 'mobility'

export type InsightTarget =
  | {
      kind: 'organ'
      key: OrganKey
      name: string
      score: number
    }
  | {
      kind: 'system'
      key: BodySystemKey
      name: string
      score: number
    }

export type InsightCardContent = {
  title: string
  insight: string
  personalizedAdvice: string[]
  researchBackedInfo: string[]
  placeholder: true
}

function scoreBand(score: number) {
  if (score >= 80) return 'strong'
  if (score >= 60) return 'stable'
  return 'rebuilding'
}

function buildAdvice(target: InsightTarget, band: ReturnType<typeof scoreBand>) {
  const subject = target.kind === 'organ' ? `${target.name} organ` : `${target.name} system`

  if (band === 'strong') {
    return [
      `Keep current routines steady to preserve ${subject} resilience.`,
      'Focus on consistency over intensity in the next 3-5 days.',
      'Log one supportive action daily so momentum remains visible.',
    ]
  }

  if (band === 'stable') {
    return [
      `Add one recovery-focused habit to lift ${subject} from stable to strong.`,
      'Prefer small repeatable actions (sleep rhythm, movement, hydration).',
      'Review your check-ins after two days and keep what is easiest to sustain.',
    ]
  }

  return [
    `Start with one low-friction habit that supports ${subject} today.`,
    'Prioritize sleep, hydration, and light movement before high-intensity changes.',
    'Use short daily check-ins to track recovery trends and avoid all-or-nothing swings.',
  ]
}

function buildResearchNotes(target: InsightTarget) {
  const subject = target.kind === 'organ' ? target.name.toLowerCase() : target.name.toLowerCase()
  return [
    `Placeholder: summarize peer-reviewed findings on lifestyle factors that influence ${subject} outcomes.`,
    'Placeholder: provide effect-size context (direction, strength, and confidence) in simple language.',
    'Placeholder: include references with publication year and link when LLM integration is added.',
  ]
}

export async function generateInsightCard(
  target: InsightTarget,
): Promise<InsightCardContent> {
  const band = scoreBand(target.score)
  const label = target.kind === 'organ' ? `${target.name} insight` : `${target.name} system insight`
  const insight =
    band === 'strong'
      ? `${target.name} is in a strong zone right now. The main opportunity is maintaining consistency so gains remain durable over time.`
      : band === 'stable'
        ? `${target.name} is in a stable zone with room for improvement. Small, repeatable habits are likely to move this upward.`
        : `${target.name} is in a rebuilding zone. Recovery-first routines can improve this without drastic changes.`

  return {
    title: label,
    insight,
    personalizedAdvice: buildAdvice(target, band),
    researchBackedInfo: buildResearchNotes(target),
    placeholder: true,
  }
}
