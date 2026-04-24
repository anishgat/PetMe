import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import PageTitle from '../components/PageTitle'
import {
  applyActivityEvents,
  buildImpactNarrative,
  summarizeContributionsByOrgan,
} from '../features/health'
import {
  buildEvents,
  DIET_OPTIONS,
  INITIAL_LOG_VALUES,
  LOG_DOMAIN_LABELS,
  LOG_DOMAIN_ORDER,
} from '../features/health/logging'
import { useHealth } from '../features/health/HealthContext'

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return 'No check-ins yet.'
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

type StepCardProps = {
  children: ReactNode
}

function StepCard({ children }: StepCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      {children}
    </section>
  )
}

export default function LogActions() {
  const { logActivities, logEntries, organStates, overallScore, streaks } = useHealth()
  const [stepIndex, setStepIndex] = useState(0)
  const [values, setValues] = useState(INITIAL_LOG_VALUES)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [savedEventCount, setSavedEventCount] = useState(0)

  const latestEntry = logEntries[0]
  const currentStep = LOG_DOMAIN_ORDER[stepIndex]
  const totalSteps = LOG_DOMAIN_ORDER.length
  const isLastStep = stepIndex === totalSteps - 1
  const progressPercent = clampPercent(((stepIndex + 1) / totalSteps) * 100)
  const draftEvents = useMemo(() => buildEvents(values), [values])
  const projectedImpacts = useMemo(() => {
    if (draftEvents.length === 0) {
      return []
    }

    const result = applyActivityEvents(organStates, draftEvents, streaks)
    return summarizeContributionsByOrgan(result.contributions, 4)
  }, [draftEvents, organStates, streaks])
  const projectedImpactNarrative = useMemo(
    () => buildImpactNarrative(projectedImpacts),
    [projectedImpacts],
  )

  const handleSave = () => {
    const events = draftEvents

    if (events.length === 0) {
      setSaveMessage('Add at least one signal before saving this check-in.')
      return
    }

    logActivities(events)
    setSavedEventCount(events.length)
    setSaveMessage(
      projectedImpactNarrative != null
        ? `Check-in saved. ${projectedImpactNarrative}`
        : 'Check-in saved. Your organ model has been updated.',
    )
    setStepIndex(0)
    setValues(INITIAL_LOG_VALUES)
  }

  const summary = useMemo(
    () => ({
      sleep: `${values.sleepDuration.toFixed(1)}h, quality ${values.sleepQuality}/5, wake ${values.wakeFeeling}/5`,
      stress: `${values.stressLevel}/10`,
      movement: `${values.walkingSteps.toLocaleString()} steps, ${values.cardioMinutes} cardio min, ${values.strengthMinutes} strength min`,
      social: `${values.socialMoments} meaningful interactions`,
      diet:
        DIET_OPTIONS.find((option) => option.value === values.mealType)?.label ??
        'No tag',
      substances:
        values.alcoholDrinks === 0 && values.smokingCigarettes === 0
          ? 'None logged'
          : `${values.alcoholDrinks} drinks, ${values.smokingCigarettes} cigarettes`,
    }),
    [values],
  )

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 pb-8">
      <section className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageTitle>Daily check-in</PageTitle>
            <p className="mt-1 text-sm text-slate-600">
              A quick guided log for your future-self model.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-right">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Overall
            </p>
            <p className="text-xl font-semibold text-emerald-900">
              {overallScore.toFixed(1)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-slate-500">
          Last check-in: {formatTimestamp(latestEntry?.timestamp)}
        </p>
      </section>

      {saveMessage ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900">
          <p className="font-semibold">{saveMessage}</p>
          {savedEventCount > 0 ? <p className="mt-1">Saved {savedEventCount} signals.</p> : null}
          <Link
            to="/"
            className="mt-3 inline-flex rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700"
          >
            Back to avatar
          </Link>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Step {stepIndex + 1} of {totalSteps}
          </p>
          <p className="text-sm font-semibold text-slate-700">
            {LOG_DOMAIN_LABELS[currentStep]}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {currentStep === 'sleep' ? (
        <StepCard>
          <h2 className="text-base font-semibold text-slate-900">Sleep</h2>
          <p className="mt-1 text-sm text-slate-600">
            How was your sleep and how did you feel when you woke up?
          </p>
          <div className="mt-4 space-y-4">
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
                    sleepDuration: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
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
          </div>
        </StepCard>
      ) : null}

      {currentStep === 'mood' ? (
        <StepCard>
          <h2 className="text-base font-semibold text-slate-900">Stress and mood</h2>
          <p className="mt-1 text-sm text-slate-600">
            Log your stress level for today on a 0 to 10 scale.
          </p>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">Mood pressure level</span>
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
            <p className="mt-1 text-xs text-slate-500">Current: {values.stressLevel}/10</p>
          </label>
        </StepCard>
      ) : null}

      {currentStep === 'movement' ? (
        <StepCard>
          <h2 className="text-base font-semibold text-slate-900">Movement and exercise</h2>
          <p className="mt-1 text-sm text-slate-600">
            Capture your daily movement and training minutes.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
                    walkingSteps: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
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
                    cardioMinutes: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
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
                    strengthMinutes: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
              />
            </label>
          </div>
        </StepCard>
      ) : null}

      {currentStep === 'social' ? (
        <StepCard>
          <h2 className="text-base font-semibold text-slate-900">Social interaction</h2>
          <p className="mt-1 text-sm text-slate-600">
            How many meaningful interactions did you have today?
          </p>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">Meaningful moments</span>
            <input
              type="number"
              min="0"
              step="1"
              value={values.socialMoments}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  socialMoments: Math.max(0, Number(event.target.value) || 0),
                }))
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
            />
          </label>
        </StepCard>
      ) : null}

      {currentStep === 'diet' ? (
        <StepCard>
          <h2 className="text-base font-semibold text-slate-900">Quality of diet</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pick the option that best matches your day.
          </p>
          <div className="mt-4 space-y-2">
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
                className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                  values.mealType === option.value
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-emerald-200'
                }`}
              >
                <p className="text-sm font-semibold text-slate-800">{option.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{option.hint}</p>
              </button>
            ))}
          </div>
        </StepCard>
      ) : null}

      {currentStep === 'substances' ? (
        <StepCard>
          <h2 className="text-base font-semibold text-slate-900">Substances (optional)</h2>
          <p className="mt-1 text-sm text-slate-600">
            Leave these at zero if none today.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                    alcoholDrinks: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Smoking cigarettes
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={values.smokingCigarettes}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    smokingCigarettes: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
              />
            </label>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Review
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Sleep: {summary.sleep}</li>
              <li>Stress: {summary.stress}</li>
              <li>Movement: {summary.movement}</li>
              <li>Social: {summary.social}</li>
              <li>Diet: {summary.diet}</li>
              <li>Substances: {summary.substances}</li>
            </ul>
          </div>
        </StepCard>
      ) : null}

      {projectedImpacts.length > 0 ? (
        <section className="rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Projected organ impact
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {projectedImpactNarrative ??
                  'This check-in is ready to update the organ model.'}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Signals
              </p>
              <p className="text-lg font-semibold text-emerald-900">
                {draftEvents.length}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {projectedImpacts.map((impact) => {
              const deltaTone =
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
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">{impact.label}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${deltaTone}`}
                    >
                      {deltaText}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Driven by {impact.drivers.slice(0, 2).join(', ')}.
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          disabled={stepIndex === 0}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSave}
            className="ml-auto rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Save check-in
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStepIndex((current) => Math.min(totalSteps - 1, current + 1))}
            className="ml-auto rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Next
          </button>
        )}
      </section>
    </div>
  )
}
