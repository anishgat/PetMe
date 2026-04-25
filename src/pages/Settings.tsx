import { useMemo, useState, type FormEvent } from 'react'
import PageTitle from '../components/PageTitle'
import SectionLabel from '../components/SectionLabel'
import { getProjectionMinLogEntries } from '../features/health'
import { useHealth } from '../features/health/HealthContext'

type SyncProvider = {
  name: string
  category: string
  summary: string
  status: string
  syncLabel: string
  syncValue: string
  actionLabel: string
  accentClassName: string
  buttonClassName: string
  metrics: string[]
}

const MIN_PROJECTION_LOG_ENTRIES = getProjectionMinLogEntries()

const syncHighlights = [
  {
    label: 'Connected',
    value: '2',
    caption: 'Google Fit and Garmin Connect',
  },
  {
    label: 'Available',
    value: '2',
    caption: 'Strava and Fitbit',
  },
  {
    label: 'Refresh',
    value: 'Hourly',
    caption: 'Activity, workout, and sleep updates',
  },
]

const syncProviders: SyncProvider[] = [
  {
    name: 'Google Fit',
    category: 'Daily activity',
    summary: 'Steps, calorie burn, heart rate trends, and sleep windows.',
    status: 'Connected',
    syncLabel: 'Last sync',
    syncValue: '8 minutes ago',
    actionLabel: 'Manage',
    accentClassName: 'bg-emerald-500',
    buttonClassName:
      'bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900',
    metrics: ['Steps', 'Heart rate', 'Sleep'],
  },
  {
    name: 'Garmin Connect',
    category: 'Recovery and training',
    summary: 'Training load, recovery signals, and longer workout sessions.',
    status: 'Connected',
    syncLabel: 'Auto-refresh',
    syncValue: 'Every hour',
    actionLabel: 'Manage',
    accentClassName: 'bg-sky-500',
    buttonClassName:
      'bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900',
    metrics: ['Recovery', 'Training load', 'Sleep'],
  },
  {
    name: 'Strava',
    category: 'Runs and rides',
    summary: 'Ride and run summaries with distance, duration, and effort.',
    status: 'Available',
    syncLabel: 'Includes',
    syncValue: 'Runs, rides, and workout summaries',
    actionLabel: 'Connect',
    accentClassName: 'bg-orange-500',
    buttonClassName:
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-400',
    metrics: ['Runs', 'Rides', 'Distance'],
  },
  {
    name: 'Fitbit',
    category: 'Sleep and readiness',
    summary: 'Sleep stages, resting heart rate, and readiness signals.',
    status: 'Available',
    syncLabel: 'Includes',
    syncValue: 'Sleep stages, resting HR, and readiness',
    actionLabel: 'Connect',
    accentClassName: 'bg-fuchsia-500',
    buttonClassName:
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-400',
    metrics: ['Sleep', 'Readiness', 'Resting HR'],
  },
]

const syncPreferences = [
  {
    label: 'Daily activity',
    description: 'Steps, distance, active minutes, and calorie burn.',
    enabled: true,
  },
  {
    label: 'Workout summaries',
    description: 'Sessions, duration, and route-based exercise history.',
    enabled: true,
  },
  {
    label: 'Sleep and recovery',
    description: 'Sleep windows, resting heart rate, and readiness signals.',
    enabled: true,
  },
  {
    label: 'Sync notices',
    description: 'Small updates when providers finish refreshing.',
    enabled: false,
  },
]

const syncedSignals = [
  'Daily steps',
  'Distance',
  'Heart rate',
  'Workouts',
  'Sleep',
  'Recovery',
]

function StatusDot({
  accentClassName,
}: Pick<SyncProvider, 'accentClassName'>) {
  return <span className={`h-2.5 w-2.5 rounded-full ${accentClassName}`} />
}

export default function Settings() {
  const {
    logEntries,
    profile,
    loadHealthyDemoYear,
    loadModerateDemoYear,
    loadUnhealthyDemoYear,
    resetHealthState,
    setCurrentAge,
  } = useHealth()
  const [ageInput, setAgeInput] = useState(
    profile.currentAge != null ? String(profile.currentAge) : '',
  )
  const [ageMessage, setAgeMessage] = useState<string | null>(null)

  const remainingCheckIns = Math.max(
    0,
    MIN_PROJECTION_LOG_ENTRIES - logEntries.length,
  )
  const projectionState = useMemo(() => {
    if (profile.currentAge == null) {
      return {
        label: 'Projection locked',
        tone:
          'border-amber-200 bg-amber-50/80 text-amber-950 shadow-[0_18px_42px_-32px_rgba(217,119,6,0.55)]',
        summary: 'Add your current age to unlock the age-70 outlook.',
      }
    }

    if (remainingCheckIns > 0) {
      return {
        label: 'Collecting baseline',
        tone:
          'border-sky-200 bg-sky-50/80 text-sky-950 shadow-[0_18px_42px_-32px_rgba(14,165,233,0.48)]',
        summary: `${remainingCheckIns} more check-in${
          remainingCheckIns === 1 ? '' : 's'
        } needed before the age-70 forecast appears on organ pages.`,
      }
    }

    return {
      label: 'Projection ready',
      tone:
        'border-emerald-200 bg-emerald-50/80 text-emerald-950 shadow-[0_18px_42px_-32px_rgba(16,185,129,0.45)]',
      summary:
        'Your age-70 outlook is now available inside organ detail and overview.',
    }
  }, [profile.currentAge, remainingCheckIns])

  const handleAgeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (ageInput.trim() === '') {
      setCurrentAge(undefined)
      setAgeMessage('Current age cleared. Age-70 projection is locked until you add it again.')
      return
    }

    const parsedAge = Number(ageInput)
    if (!Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 69) {
      setAgeMessage('Use a whole number from 13 to 69.')
      return
    }

    setCurrentAge(parsedAge)
    setAgeMessage('Current age saved. The app will now use it for age-70 projection.')
  }

  return (
    <div className="space-y-5 pb-8 pt-2">
      <section className="rounded-[1.85rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <SectionLabel>Settings</SectionLabel>
            <PageTitle className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Future projection profile
            </PageTitle>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Tell the app how old you are now so it can turn today&apos;s habits into a
              visible age-70 outlook.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[34rem]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Current age
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {profile.currentAge ?? 'Missing'}
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Required before any age-70 projection appears.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Check-ins
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {logEntries.length}
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {remainingCheckIns > 0
                  ? `${remainingCheckIns} more needed for projection`
                  : 'Enough recent data to simulate forward'}
              </p>
            </div>

            <div className={`rounded-2xl border px-4 py-4 ${projectionState.tone}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
                Status
              </p>
              <p className="mt-2 text-xl font-semibold">{projectionState.label}</p>
              <p className="mt-1 text-sm leading-5 opacity-80">
                {projectionState.summary}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[1.7rem] border border-emerald-100 bg-[linear-gradient(145deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))] p-5 shadow-sm sm:p-6">
          <SectionLabel>Profile</SectionLabel>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Unlock the age-70 view
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            The projection stays deterministic. It simply repeats your recent logged
            lifestyle pattern forward from your current age to 70 and translates that
            into future organ outlooks.
          </p>

          <form onSubmit={handleAgeSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Current age</span>
              <input
                type="number"
                min="13"
                max="69"
                step="1"
                inputMode="numeric"
                value={ageInput}
                onChange={(event) => setAgeInput(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                placeholder="Enter your age"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Save age
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgeInput('')
                  setCurrentAge(undefined)
                  setAgeMessage(
                    'Current age cleared. Age-70 projection is locked until you add it again.',
                  )
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </button>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                Ages 13-69 supported in this version
              </p>
            </div>
          </form>

          {ageMessage ? (
            <p className="mt-4 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm leading-6 text-slate-700">
              {ageMessage}
            </p>
          ) : null}
        </article>

        <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionLabel>How it works</SectionLabel>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            What the app uses
          </h3>
          <div className="mt-4 space-y-3">
            {[
              'Your saved current age',
              `At least ${MIN_PROJECTION_LOG_ENTRIES} recent check-ins`,
              'The same organ scoring model already used for daily updates',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            This is a directional product feature, not medical advice. The app is
            showing where your current pattern points if it keeps repeating.
          </p>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <SectionLabel>Wearable sync</SectionLabel>
            <PageTitle className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Wearable sync hub
            </PageTitle>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Connect activity, workouts, sleep, and recovery data in one clean
              place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[34rem]">
            {syncHighlights.map((highlight) => (
              <div
                key={highlight.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {highlight.label}
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {highlight.value}
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {highlight.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <SectionLabel>Providers</SectionLabel>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Connected services
          </h3>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {syncProviders.map((provider) => (
            <article
              key={provider.name}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <StatusDot accentClassName={provider.accentClassName} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {provider.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {provider.category}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <StatusDot accentClassName={provider.accentClassName} />
                  {provider.status}
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {provider.summary}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {provider.metrics.map((metric) => (
                  <span
                    key={metric}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {metric}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {provider.syncLabel}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {provider.syncValue}
                  </p>
                </div>
                <button
                  type="button"
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${provider.buttonClassName}`}
                >
                  {provider.actionLabel}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <SectionLabel>Preferences</SectionLabel>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Synced data
          </h3>

          <div className="mt-5 space-y-3">
            {syncPreferences.map((preference) => (
              <div
                key={preference.label}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {preference.label}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {preference.description}
                  </p>
                </div>
                <div
                  aria-hidden="true"
                  className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 ${
                    preference.enabled
                      ? 'justify-end bg-slate-900'
                      : 'justify-start bg-slate-300'
                  }`}
                >
                  <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <SectionLabel>Signals</SectionLabel>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              Included data
            </h3>

            <div className="mt-4 flex flex-wrap gap-2">
              {syncedSignals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {signal}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <SectionLabel>Local Data</SectionLabel>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Check-ins on this device
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your logged entries stay available alongside synced health
                  signals.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 px-4 py-3 text-right text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Entries
                </p>
                <p className="mt-1 text-2xl font-semibold">{logEntries.length}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                loadHealthyDemoYear()
                setAgeInput(String(31))
                setAgeMessage(
                  'Loaded 365 days of healthy demo check-ins with strong sleep, exercise, and diet habits.',
                )
              }}
              className="mt-3 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Load healthy 1-year demo data
            </button>

            <button
              type="button"
              onClick={() => {
                loadModerateDemoYear()
                setAgeInput(String(33))
                setAgeMessage(
                  'Loaded 365 days of moderate demo check-ins with mixed diet quality, decent but inconsistent sleep, some weekly exercise, and occasional smoking and drinking.',
                )
              }}
              className="mt-3 rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
            >
              Load moderate 1-year demo data
            </button>

            <button
              type="button"
              onClick={() => {
                loadUnhealthyDemoYear()
                setAgeInput(String(34))
                setAgeMessage(
                  'Loaded 365 days of lower-health demo check-ins with weekly smoking and drinking, mostly sedentary days, frequent fast food, and limited exercise.',
                )
              }}
              className="mt-3 rounded-xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
            >
              Load lower-health 1-year demo data
            </button>

            <button
              type="button"
              onClick={resetHealthState}
              className="mt-3 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Reset local health data
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
