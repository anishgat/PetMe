import { useState } from 'react'
import PageTitle from '../components/PageTitle'
import SectionLabel from '../components/SectionLabel'
import { useHealth } from '../features/health/HealthContext'
import { parseActivitiesFromText } from '../features/health/llm/parser'
import {
  DEFAULT_MODEL,
  createOpenAIResponsesClient,
} from '../features/health/llm/openaiClient'
import type { ActivityEvent, ActivityType } from '../features/health/model/types'

type MealType =
  | 'none'
  | 'healthy_meal'
  | 'balanced_meal'
  | 'processed_food'
  | 'high_sugar_meal'
  | 'high_sat_fat_meal'
  | 'protein_rich_meal'
  | 'fiber_rich_meal'

type LogFormState = {
  sleepHours: number
  cardioMinutes: number
  strengthMinutes: number
  walkingSteps: number
  stressLevel: number
  hydrationServings: number
  alcoholDrinks: number
  smokingCigarettes: number
  socialMoments: number
  sedentaryDay: boolean
  mealType: MealType
}

const INITIAL_FORM_STATE: LogFormState = {
  sleepHours: 0,
  cardioMinutes: 0,
  strengthMinutes: 0,
  walkingSteps: 0,
  stressLevel: 0,
  hydrationServings: 0,
  alcoholDrinks: 0,
  smokingCigarettes: 0,
  socialMoments: 0,
  sedentaryDay: false,
  mealType: 'none',
}

const MEAL_OPTIONS: Array<{ value: MealType; label: string }> = [
  { value: 'none', label: 'No meal tag' },
  { value: 'healthy_meal', label: 'Healthy meal' },
  { value: 'balanced_meal', label: 'Balanced meal' },
  { value: 'processed_food', label: 'Processed food' },
  { value: 'high_sugar_meal', label: 'High sugar meal' },
  { value: 'high_sat_fat_meal', label: 'High saturated fat meal' },
  { value: 'protein_rich_meal', label: 'Protein-rich meal' },
  { value: 'fiber_rich_meal', label: 'Fiber-rich meal' },
]

const FIELD_CONFIG: Array<{
  key: keyof Omit<LogFormState, 'sedentaryDay' | 'mealType'>
  label: string
  hint: string
  step: number
}> = [
  { key: 'sleepHours', label: 'Sleep', hint: 'hours last night', step: 0.5 },
  { key: 'cardioMinutes', label: 'Cardio', hint: 'minutes today', step: 5 },
  { key: 'strengthMinutes', label: 'Strength', hint: 'minutes today', step: 5 },
  { key: 'walkingSteps', label: 'Walking', hint: 'steps today', step: 500 },
  { key: 'stressLevel', label: 'Stress', hint: 'level from 0 to 10', step: 1 },
  { key: 'hydrationServings', label: 'Hydration', hint: 'glasses or bottles', step: 1 },
  { key: 'alcoholDrinks', label: 'Alcohol', hint: 'drinks', step: 1 },
  { key: 'smokingCigarettes', label: 'Smoking', hint: 'cigarettes', step: 1 },
  { key: 'socialMoments', label: 'Social connection', hint: 'meaningful check-ins', step: 1 },
]

function formatLastLogged(timestamp?: string) {
  if (!timestamp) return 'No activity logged yet.'

  return `Last update ${new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

function buildEvents(formState: LogFormState): ActivityEvent[] {
  const events: ActivityEvent[] = []

  const pushNumericEvent = (
    amount: number,
    type: ActivityType,
    unit: ActivityEvent['unit'],
  ) => {
    if (amount <= 0) return
    events.push({
      type,
      amount,
      unit,
      confidence: 1,
      source: 'manual',
    })
  }

  pushNumericEvent(formState.sleepHours, 'sleep', 'hour')
  pushNumericEvent(formState.cardioMinutes, 'cardio', 'minute')
  pushNumericEvent(formState.strengthMinutes, 'strength', 'minute')
  pushNumericEvent(formState.walkingSteps, 'walking', 'steps')
  pushNumericEvent(formState.stressLevel, 'stress', 'level_10')
  pushNumericEvent(formState.hydrationServings, 'hydration', 'serving')
  pushNumericEvent(formState.alcoholDrinks, 'alcohol', 'drink')
  pushNumericEvent(formState.smokingCigarettes, 'smoking', 'cigarette')
  pushNumericEvent(formState.socialMoments, 'social_connection', 'count')

  if (formState.mealType !== 'none') {
    events.push({
      type: formState.mealType,
      amount: 1,
      unit: 'meal',
      confidence: 1,
      source: 'manual',
    })
  }

  if (formState.sedentaryDay) {
    events.push({
      type: 'sedentary_day',
      amount: 1,
      unit: 'count',
      confidence: 1,
      source: 'manual',
    })
  }

  return events
}

export default function LogActions() {
  const { logActivities, logEntries, overallScore } = useHealth()
  const [formState, setFormState] = useState(INITIAL_FORM_STATE)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [parserApiKey, setParserApiKey] = useState('')
  const [parserModel, setParserModel] = useState(DEFAULT_MODEL)
  const [parserInput, setParserInput] = useState('')
  const [parsedEvents, setParsedEvents] = useState<ActivityEvent[]>([])
  const [parserMessage, setParserMessage] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)

  const latestEntry = logEntries[0]

  const handleNumberChange = (
    key: keyof Omit<LogFormState, 'sedentaryDay' | 'mealType'>,
    rawValue: string,
  ) => {
    const nextValue = Number(rawValue)

    setFormState((current) => ({
      ...current,
      [key]: Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0,
    }))
  }

  const handleParseFromText = async () => {
    const trimmedInput = parserInput.trim()
    const trimmedApiKey = parserApiKey.trim()

    if (!trimmedInput) {
      setParserMessage('Describe the day first, then run the parser.')
      return
    }

    if (!trimmedApiKey) {
      setParserMessage('Add an API key for the parser test. It is only kept in memory.')
      return
    }

    setIsParsing(true)
    setParserMessage(null)

    try {
      const client = createOpenAIResponsesClient({
        apiKey: trimmedApiKey,
        model: parserModel.trim() || DEFAULT_MODEL,
      })
      const result = await parseActivitiesFromText(client, trimmedInput)

      setParsedEvents(
        result.activities.map((activity) => ({
          ...activity,
          source: 'llm',
        })),
      )
      setParserMessage(`Parsed ${result.activities.length} activities from your note.`)
    } catch (error) {
      setParsedEvents([])
      setParserMessage(
        error instanceof Error ? error.message : 'The parser request failed.',
      )
    } finally {
      setIsParsing(false)
    }
  }

  const handleSubmit = () => {
    const events = [...parsedEvents, ...buildEvents(formState)]

    if (events.length === 0) {
      setFeedback('Add at least one signal before saving this check-in.')
      return
    }

    logActivities(events)
    setFormState(INITIAL_FORM_STATE)
    setParsedEvents([])
    setParserInput('')
    setFeedback(`Saved ${events.length} signals. The organ model has been updated.`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <PageTitle>Log an action</PageTitle>
          <p className="text-sm text-slate-600">
            Add a few real signals and the organ model updates immediately.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Overall
          </p>
          <p className="text-2xl font-semibold text-emerald-900">{overallScore.toFixed(1)}</p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <SectionLabel>Latest check-in</SectionLabel>
            <p className="mt-2 text-sm text-slate-600">{formatLastLogged(latestEntry?.timestamp)}</p>
          </div>
          {feedback ? (
            <p className="max-w-xs text-right text-sm font-medium text-emerald-700">
              {feedback}
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <SectionLabel>AI parser</SectionLabel>
          <p className="text-sm text-slate-600">
            Describe the day in plain language, parse it into activity events, then save the
            parsed signals with or without the manual inputs below.
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Narrative log</span>
          <textarea
            value={parserInput}
            onChange={(event) => setParserInput(event.target.value)}
            rows={5}
            placeholder="Example: I slept 6 hours, walked 8,000 steps, ate processed food, and felt pretty stressed."
            className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr_auto]">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">OpenAI API key</span>
            <input
              type="password"
              autoComplete="off"
              value={parserApiKey}
              onChange={(event) => setParserApiKey(event.target.value)}
              placeholder="sk-..."
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Model</span>
            <input
              type="text"
              value={parserModel}
              onChange={(event) => setParserModel(event.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-400"
            />
          </label>

          <button
            type="button"
            onClick={() => void handleParseFromText()}
            disabled={isParsing}
            className="self-end rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isParsing ? 'Parsing...' : 'Parse text'}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          This test path sends the note and API key directly from the browser. Keep it for local
          hackathon testing only, not production.
        </p>

        {parserMessage ? (
          <p className="text-sm font-medium text-slate-600">{parserMessage}</p>
        ) : null}

        {parsedEvents.length > 0 ? (
          <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-900">Parsed signals ready</p>
                <p className="text-xs text-emerald-700">
                  These will be included when you save the check-in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setParsedEvents([])
                  setParserMessage('Cleared parsed signals.')
                }}
                className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700"
              >
                Clear
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {parsedEvents.map((event, index) => (
                <div
                  key={`${event.type}-${index}`}
                  className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-800">
                      {event.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      {typeof event.confidence === 'number'
                        ? `${Math.round(event.confidence * 100)}%`
                        : 'no score'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.amount} {event.unit ?? 'units'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {FIELD_CONFIG.map((field) => (
          <label
            key={field.key}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-800">{field.label}</span>
              <span className="text-xs text-slate-400">{field.hint}</span>
            </div>
            <input
              type="number"
              min="0"
              step={field.step}
              value={formState[field.key]}
              onChange={(event) => handleNumberChange(field.key, event.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-emerald-400"
            />
          </label>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Meal quality</span>
            <select
              value={formState.mealType}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  mealType: event.target.value as MealType,
                }))
              }
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-400"
            >
              {MEAL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-800">Sedentary day</p>
            <p className="mt-1 text-xs text-slate-500">
              Log this when most of the day was seated and inactive.
            </p>
          </div>
          <input
            type="checkbox"
            checked={formState.sedentaryDay}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                sedentaryDay: event.target.checked,
              }))
            }
            className="h-4 w-4 accent-emerald-600"
          />
        </label>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Save check-in
      </button>
    </div>
  )
}
