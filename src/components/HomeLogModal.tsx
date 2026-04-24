import { useEffect, useMemo, useState } from 'react'
import {
  applyActivityEvents,
  buildImpactNarrative,
  summarizeContributionsByOrgan,
} from '../features/health'
import { useHealth } from '../features/health/HealthContext'
import {
  buildEventsForDomain,
  DIET_OPTIONS,
  INITIAL_LOG_VALUES,
  type LogDomain,
  type WizardState,
} from '../features/health/logging'

type HomeLogModalProps = {
  domain: LogDomain
  onClose: () => void
}

const DOMAIN_COPY: Record<
  LogDomain,
  {
    eyebrow: string
    title: string
    description: string
    saveLabel: string
  }
> = {
  sleep: {
    eyebrow: 'Night reset',
    title: 'Log sleep',
    description: 'Capture how long you slept, how restorative it felt, and how you woke up.',
    saveLabel: 'Save sleep check-in',
  },
  mood: {
    eyebrow: 'Inner weather',
    title: 'Log mood and stress',
    description: 'Keep it simple. Higher strain pushes recovery down, lower strain gives your system room to rebound.',
    saveLabel: 'Save mood check-in',
  },
  movement: {
    eyebrow: 'Body motion',
    title: 'Log movement',
    description: 'Add the steps and exercise that should shift your future-self model right now.',
    saveLabel: 'Save movement check-in',
  },
  social: {
    eyebrow: 'Connection',
    title: 'Log social energy',
    description: 'Meaningful moments count, even if today only had one.',
    saveLabel: 'Save social check-in',
  },
  diet: {
    eyebrow: 'Fuel',
    title: 'Log diet quality',
    description: 'Choose the option that best matches how you fueled yourself today.',
    saveLabel: 'Save diet check-in',
  },
  substances: {
    eyebrow: 'Optional',
    title: 'Log substances',
    description: 'Leave values at zero if nothing belongs here today.',
    saveLabel: 'Save substance check-in',
  },
}

function clampNumber(value: string, minimum = 0) {
  return Math.max(minimum, Number(value) || 0)
}

export function HomeLogModal({ domain, onClose }: HomeLogModalProps) {
  const { logActivities, organStates, streaks } = useHealth()
  const [values, setValues] = useState<WizardState>(() => INITIAL_LOG_VALUES)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [domain])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [domain, onClose])

  const draftEvents = useMemo(
    () => buildEventsForDomain(values, domain),
    [domain, values],
  )

  const projectedImpacts = useMemo(() => {
    if (draftEvents.length === 0) {
      return []
    }

    const result = applyActivityEvents(organStates, draftEvents, streaks)
    return summarizeContributionsByOrgan(result.contributions, 3)
  }, [draftEvents, organStates, streaks])

  const projectedNarrative = useMemo(
    () => buildImpactNarrative(projectedImpacts),
    [projectedImpacts],
  )

  const copy = DOMAIN_COPY[domain]

  const handleSave = () => {
    if (draftEvents.length === 0) {
      setSaveError('Add at least one signal before saving this check-in.')
      return
    }

    setSaveError(null)
    logActivities(draftEvents)
    onClose()
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close logging modal"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-log-modal-title"
        className="relative flex max-h-[calc(100svh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(244,247,245,0.94))] p-5 shadow-[0_40px_100px_-38px_rgba(15,23,42,0.88)] backdrop-blur-xl sm:max-h-[min(42rem,calc(100svh-3rem))] sm:p-6"
      >
        <div className="shrink-0 flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              {copy.eyebrow}
            </p>
            <h2 id="home-log-modal-title" className="mt-2 text-2xl font-semibold text-slate-900">
              {copy.title}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              {copy.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          <div className="space-y-4 pb-1">
            {domain === 'sleep' ? (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Duration (hours)</span>
                  <input
                    type="number"
                    min="0"
                    max="14"
                    step="0.5"
                    value={values.sleepDuration}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        sleepDuration: clampNumber(event.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Quality (1-5)</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={values.sleepQuality}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        sleepQuality: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full accent-emerald-600"
                  />
                  <p className="mt-1 text-xs text-slate-500">Current: {values.sleepQuality}/5</p>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Feeling when awake (1-5)
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={values.wakeFeeling}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        wakeFeeling: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full accent-emerald-600"
                  />
                  <p className="mt-1 text-xs text-slate-500">Current: {values.wakeFeeling}/5</p>
                </label>
              </>
            ) : null}

            {domain === 'mood' ? (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Stress load today</span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={values.stressLevel}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      stressLevel: Number(event.target.value),
                    }))
                  }
                  className="mt-2 w-full accent-emerald-600"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Calm</span>
                  <span className="font-semibold text-slate-700">{values.stressLevel}/10</span>
                  <span>Overloaded</span>
                </div>
              </label>
            ) : null}

            {domain === 'movement' ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Walking steps</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={values.walkingSteps}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        walkingSteps: clampNumber(event.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Cardio minutes</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={values.cardioMinutes}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        cardioMinutes: clampNumber(event.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Strength minutes</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={values.strengthMinutes}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        strengthMinutes: clampNumber(event.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400"
                  />
                </label>
              </div>
            ) : null}

            {domain === 'social' ? (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Meaningful interactions</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={values.socialMoments}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      socialMoments: clampNumber(event.target.value),
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400"
                />
              </label>
            ) : null}

            {domain === 'diet' ? (
              <div className="space-y-2">
                {DIET_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() =>
                      setValues((current) => ({
                        ...current,
                        mealType: option.value,
                      }))
                    }
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      values.mealType === option.value
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-emerald-200'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800">{option.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{option.hint}</p>
                  </button>
                ))}
              </div>
            ) : null}

            {domain === 'substances' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Alcohol drinks</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={values.alcoholDrinks}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        alcoholDrinks: clampNumber(event.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Smoking cigarettes</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={values.smokingCigarettes}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        smokingCigarettes: clampNumber(event.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400"
                  />
                </label>
              </div>
            ) : null}

            <div className="rounded-[1.6rem] border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Projected impact
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {projectedNarrative ?? 'This domain update is ready to feed into the organ model.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-right">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Signals
                  </p>
                  <p className="text-lg font-semibold text-emerald-900">{draftEvents.length}</p>
                </div>
              </div>

              {projectedImpacts.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {projectedImpacts.map((impact) => {
                    const tone =
                      impact.direction === 'up'
                        ? 'bg-emerald-50 text-emerald-700'
                        : impact.direction === 'down'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-500'
                    const deltaText =
                      impact.direction === 'flat'
                        ? 'Stable'
                        : `${impact.scoreDelta > 0 ? '+' : ''}${impact.scoreDelta.toFixed(1)}`

                    return (
                      <div
                        key={impact.organ}
                        className="rounded-2xl border border-white/90 bg-white/92 px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">{impact.label}</p>
                          <span
                            className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${tone}`}
                          >
                            {deltaText}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {impact.drivers.slice(0, 2).join(', ')}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>

            {saveError ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {saveError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="ml-auto rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            {copy.saveLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
