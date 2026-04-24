import { Link } from 'react-router-dom'
import PageTitle from '../components/PageTitle'
import ProgressBar from '../components/ProgressBar'
import { useHealth } from '../features/health/HealthContext'
import type { BodySystemKey } from '../features/insights/insightService'
import { FUTURE_SELF_SYSTEM_GROUPS } from '../features/messages/futureSelfMessageService'

type SystemPresentation = {
  eyebrow: string
  summary: string
  accent: string
  track: string
  bar: string
  badge: string
}

const SYSTEM_PRESENTATION: Record<BodySystemKey, SystemPresentation> = {
  cardio: {
    eyebrow: 'Heart and lungs',
    summary: 'Circulation, oxygen flow, and recovery capacity.',
    accent: 'text-rose-700',
    track: 'bg-rose-100',
    bar: 'bg-gradient-to-r from-rose-500 to-orange-400',
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
  },
  brain: {
    eyebrow: 'Brain and focus',
    summary: 'Mental clarity, stress load, and cognitive recovery.',
    accent: 'text-sky-700',
    track: 'bg-sky-100',
    bar: 'bg-gradient-to-r from-sky-500 to-cyan-400',
    badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
  },
  digestive: {
    eyebrow: 'Liver, stomach, intestines',
    summary: 'Digestion, blood sugar steadiness, and nutrient handling.',
    accent: 'text-amber-700',
    track: 'bg-amber-100',
    bar: 'bg-gradient-to-r from-amber-500 to-orange-400',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  },
  renal: {
    eyebrow: 'Kidney support',
    summary: 'Hydration balance and waste filtering support.',
    accent: 'text-teal-700',
    track: 'bg-teal-100',
    bar: 'bg-gradient-to-r from-teal-500 to-emerald-400',
    badge: 'bg-teal-50 text-teal-700 ring-1 ring-teal-100',
  },
  mobility: {
    eyebrow: 'Bones and structure',
    summary: 'Strength reserve, load tolerance, and daily movement ease.',
    accent: 'text-violet-700',
    track: 'bg-violet-100',
    bar: 'bg-gradient-to-r from-violet-500 to-fuchsia-400',
    badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  },
}

function getDeltaLabel(delta: number) {
  if (Math.abs(delta) < 0.05) {
    return 'Stable'
  }

  return delta > 0 ? `Up ${delta.toFixed(1)}` : `Down ${Math.abs(delta).toFixed(1)}`
}

function getDeltaTone(delta: number) {
  if (delta > 0.05) {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
  }

  if (delta < -0.05) {
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
  }

  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
}

function getSystemIcon(systemId: BodySystemKey) {
  switch (systemId) {
    case 'cardio':
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.8-7 10-7 10Z" />
        </svg>
      )
    case 'brain':
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M9.5 5.2a3 3 0 0 0-3 3v.6a2.8 2.8 0 0 0-1.8 2.6 2.8 2.8 0 0 0 1.8 2.6v.8a3 3 0 0 0 3 3h5a3 3 0 0 0 3-3v-.8a2.8 2.8 0 0 0 1.8-2.6 2.8 2.8 0 0 0-1.8-2.6v-.6a3 3 0 0 0-3-3h-5Z" />
          <path d="M12 6.4v11.2M9.3 9.6h2.7M12 13.2h2.7" />
        </svg>
      )
    case 'digestive':
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M10 4.5v5.2a2.8 2.8 0 0 0 2.8 2.8h.8a2.9 2.9 0 0 1 2.9 2.9v.7a3.4 3.4 0 0 1-3.4 3.4h-1.3a3.8 3.8 0 0 1-3.8-3.8V4.5" />
        </svg>
      )
    case 'renal':
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M9.5 5.5c-2.2 0-4 1.9-4 4.2V12a4.5 4.5 0 0 0 4.5 4.5h.6V9.8A4.3 4.3 0 0 0 9.5 5.5Z" />
          <path d="M14.5 5.5c2.2 0 4 1.9 4 4.2V12a4.5 4.5 0 0 1-4.5 4.5h-.6V9.8a4.3 4.3 0 0 1 1.1-4.3Z" />
        </svg>
      )
    case 'mobility':
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M7.5 9.2a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4ZM16.5 19.2a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4Z" />
          <path d="m9 8.5 6 7m-3.5-10 3 2.2m-5.5 8.3-2.5 2" />
        </svg>
      )
  }
}

export default function OrganOverview() {
  const { organSummaries, overallScore } = useHealth()

  const systemCards = FUTURE_SELF_SYSTEM_GROUPS.map((system) => {
    const organs = system.organs.map((organ) => ({
      key: organ,
      ...organSummaries[organ],
    }))
    const score =
      organs.reduce((sum, organ) => sum + organ.score, 0) / Math.max(organs.length, 1)
    const latestDelta = organs.reduce((sum, organ) => sum + organ.latestDelta, 0)

    return {
      ...system,
      organs,
      score,
      progress: score / 100,
      latestDelta,
      strongestOrgan: [...organs].sort((left, right) => right.score - left.score)[0] ?? null,
    }
  })

  const strongestSystem = [...systemCards].sort((left, right) => right.score - left.score)[0]
  const focusSystem = [...systemCards].sort((left, right) => left.score - right.score)[0]

  return (
    <div className="space-y-6 pt-3">
      <section className="rounded-[2rem] border border-emerald-100/80 bg-white/90 p-6 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Full page stats
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <PageTitle className="text-3xl">Body systems overview</PageTitle>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A clean readout of every tracked system. Each section shows the current
              score, the organs inside it, and a few simple actions that help.
            </p>
          </div>
          <div className="inline-flex w-fit flex-col rounded-[1.5rem] bg-emerald-950 px-5 py-4 text-white shadow-[0_24px_40px_-28px_rgba(4,120,87,0.95)]">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-200">
              Overall score
            </span>
            <span className="mt-1 text-4xl font-semibold leading-none">
              {Math.round(overallScore)}%
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Strongest system
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {strongestSystem?.label ?? 'No data yet'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {strongestSystem
                ? `${Math.round(strongestSystem.score)}% with ${strongestSystem.strongestOrgan?.name ?? 'its top organ'} leading this group.`
                : 'Log a check-in to start seeing patterns.'}
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Focus next
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {focusSystem?.label ?? 'No data yet'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {focusSystem
                ? `${Math.round(focusSystem.score)}% right now. Small repeatable habits matter more than intensity here.`
                : 'The app will highlight the lowest system after your first log.'}
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Quick navigation
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">Organ deep dives</p>
            <p className="mt-1 text-sm text-slate-600">
              Tap any organ row below to open a more detailed explanation and recent
              drivers.
            </p>
          </article>
        </div>
      </section>

      <div className="space-y-4">
        {systemCards.map((system) => {
          const presentation = SYSTEM_PRESENTATION[system.id]

          return (
            <section
              key={system.id}
              className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.3)] backdrop-blur sm:p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${presentation.badge}`}
                  >
                    {getSystemIcon(system.id)}
                  </span>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${presentation.accent}`}>
                      {presentation.eyebrow}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      {system.label}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      {presentation.summary}
                    </p>
                  </div>
                </div>

                <div className="flex w-full shrink-0 gap-3 md:w-auto md:flex-col md:items-end">
                  <div className="rounded-[1.35rem] bg-slate-950 px-4 py-3 text-white">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-slate-300">
                      System score
                    </p>
                    <p className="mt-1 text-3xl font-semibold leading-none">
                      {Math.round(system.score)}%
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getDeltaTone(
                      system.latestDelta,
                    )}`}
                  >
                    {getDeltaLabel(system.latestDelta)}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <ProgressBar
                  value={system.progress}
                  trackClassName={`h-2.5 ${presentation.track}`}
                  barClassName={presentation.bar}
                />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Tracked organs
                  </p>
                  <div className="mt-3 space-y-3">
                    {system.organs.map((organ) => (
                      <Link
                        key={organ.key}
                        to={`/organs/${organ.key}`}
                        className="block rounded-[1.25rem] border border-white bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {organ.name}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {organ.explanation}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {Math.round(organ.score)}%
                            </p>
                            <span
                              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${getDeltaTone(
                                organ.latestDelta,
                              )}`}
                            >
                              {getDeltaLabel(organ.latestDelta)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <ProgressBar
                            value={organ.progress}
                            trackClassName="h-2 bg-slate-100"
                            barClassName={presentation.bar}
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Helpful actions
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    These habits tend to support the organs in this system. Start with
                    the easiest one you can repeat.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {system.helps.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
