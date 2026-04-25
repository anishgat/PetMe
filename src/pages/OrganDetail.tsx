import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import OrganTrendSparkline from '../components/OrganTrendSparkline'
import PageTitle from '../components/PageTitle'
import ProgressBar from '../components/ProgressBar'
import SectionLabel from '../components/SectionLabel'
import { ORGAN_METADATA } from '../data/organs'
import { getProjectionMinLogEntries } from '../features/health'
import {
  useHealth,
  type OrganTrendDirection,
  type OrganTrendPoint,
} from '../features/health/HealthContext'
import type { OrganKey } from '../features/health/model/types'

const DETAIL_WINDOWS = [7, 14] as const
const MIN_TREND_POINTS = 3
const MIN_PROJECTION_LOG_ENTRIES = getProjectionMinLogEntries()

type DetailWindow = (typeof DETAIL_WINDOWS)[number]

function getDirectionFromDelta(delta: number): OrganTrendDirection {
  if (delta >= 1.5) {
    return 'improving'
  }

  if (delta <= -1.5) {
    return 'strained'
  }

  return 'flat'
}

function getTrendLabel(direction: OrganTrendDirection) {
  if (direction === 'improving') {
    return 'Improving'
  }

  if (direction === 'strained') {
    return 'Under strain'
  }

  return 'Flat'
}

function getTrendTone(direction: OrganTrendDirection) {
  if (direction === 'improving') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
  }

  if (direction === 'strained') {
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
  }

  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
}

function getProjectionTone(band: string) {
  if (band === 'Strong runway') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
  }

  if (band === 'Capable but watchful') {
    return 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
  }

  if (band === 'Narrowing comfort') {
    return 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
  }

  return 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
}

function formatTrendDelta(delta: number) {
  const rounded = Math.round(delta * 10) / 10
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)} pts`
}

function formatProjectionDelta(from: number, to: number) {
  const delta = Math.round((to - from) * 10) / 10
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)} pts`
}

function formatLeverImpact(delta: number) {
  return `${delta.toFixed(1)} pts`
}

function formatWindowLabel(windowSize: DetailWindow, pointCount: number) {
  const count = Math.min(windowSize, pointCount)
  return `Last ${count} check-in${count === 1 ? '' : 's'}`
}

function buildDriverSummary(direction: OrganTrendDirection, drivers: string[]) {
  if (drivers.length === 0) {
    return 'Trend is still settling. Keep logging to reveal the habits that move this organ.'
  }

  const joinedDrivers = drivers.join(' + ')

  if (direction === 'improving') {
    return `Mostly helped by ${joinedDrivers}.`
  }

  if (direction === 'strained') {
    return `Mostly strained by ${joinedDrivers}.`
  }

  return `Most active drivers: ${joinedDrivers}.`
}

function buildWindowMetrics(points: OrganTrendPoint[]) {
  if (points.length < 2) {
    return {
      delta: 0,
      biggestRise: null,
      biggestDrop: null,
    }
  }

  let biggestRise: { delta: number; point: OrganTrendPoint } | null = null
  let biggestDrop: { delta: number; point: OrganTrendPoint } | null = null

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]
    const previousPoint = points[index - 1]
    const stepDelta = Math.round((point.score - previousPoint.score) * 10) / 10

    if (stepDelta > 0.05 && (!biggestRise || stepDelta > biggestRise.delta)) {
      biggestRise = {
        delta: stepDelta,
        point,
      }
    }

    if (stepDelta < -0.05 && (!biggestDrop || stepDelta < biggestDrop.delta)) {
      biggestDrop = {
        delta: stepDelta,
        point,
      }
    }
  }

  return {
    delta: Math.round((points[points.length - 1].score - points[0].score) * 10) / 10,
    biggestRise,
    biggestDrop,
  }
}

export default function OrganDetail() {
  const { organSummaries, profile, logEntries } = useHealth()
  const { organId } = useParams()
  const [selectedWindow, setSelectedWindow] = useState<DetailWindow>(7)
  const organKey =
    (organId && organId in ORGAN_METADATA ? (organId as OrganKey) : undefined) ?? 'heart'
  const organ = organSummaries[organKey]
  const futureProjection = organ.futureProjection
  const visibleTrendPoints = useMemo(
    () => organ.trend.points.slice(-selectedWindow),
    [organ.trend.points, selectedWindow],
  )
  const hasTrend = visibleTrendPoints.length >= MIN_TREND_POINTS
  const windowMetrics = useMemo(
    () => buildWindowMetrics(visibleTrendPoints),
    [visibleTrendPoints],
  )
  const activeTrendDirection = hasTrend
    ? getDirectionFromDelta(windowMetrics.delta)
    : organ.trend.direction
  const latestDeltaText =
    Math.abs(organ.latestDelta) < 0.05
      ? 'No major change from the last check-in.'
      : `Last check-in ${
          organ.latestDelta > 0 ? 'supported' : 'strained'
        } this organ by about ${Math.abs(organ.latestDelta).toFixed(1)} points.`
  const currentAge = profile.currentAge
  const remainingProjectionCheckIns = Math.max(
    0,
    MIN_PROJECTION_LOG_ENTRIES - logEntries.length,
  )
  const projectionDirection =
    futureProjection.available && futureProjection.points.length > 1
      ? getDirectionFromDelta(
          futureProjection.points[futureProjection.points.length - 1].score -
            futureProjection.points[0].score,
        )
      : 'flat'

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.28)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <PageTitle className="text-3xl">{organ.name}</PageTitle>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              {organ.explanation}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-[1.35rem] bg-slate-950 px-5 py-4 text-white shadow-[0_22px_36px_-28px_rgba(15,23,42,0.55)]">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-slate-300">
                Current score
              </p>
              <p className="mt-1 text-4xl font-semibold leading-none">
                {Math.round(organ.score)}%
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getTrendTone(
                activeTrendDirection,
              )}`}
            >
              {getTrendLabel(activeTrendDirection)}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <ProgressBar
            value={organ.progress}
            trackClassName="bg-emerald-50 shadow-inner"
            barClassName="bg-gradient-to-r from-emerald-400 to-emerald-600"
          />
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {latestDeltaText}
        </p>

        <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(155deg,rgba(248,250,252,0.98),rgba(236,253,245,0.92))] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Long-term projection
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                At 70 if this keeps up
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This section projects the future path of this organ if your recent
                lifestyle pattern keeps repeating from now until age 70.
              </p>
            </div>

            {futureProjection.available ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-[1.3rem] bg-slate-950 px-5 py-4 text-white shadow-[0_20px_36px_-26px_rgba(15,23,42,0.55)]">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-slate-300">
                    Age-70 score
                  </p>
                  <p className="mt-1 text-4xl font-semibold leading-none">
                    {Math.round(futureProjection.projectedScore)}%
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getProjectionTone(
                    futureProjection.band,
                  )}`}
                >
                  {futureProjection.band}
                </span>
              </div>
            ) : null}
          </div>

          {futureProjection.available ? (
            <>
              <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <article className="rounded-[1.35rem] border border-white/80 bg-white/92 p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Age path
                      </p>
                      <p className="mt-2 text-3xl font-semibold leading-none text-slate-900">
                        {formatProjectionDelta(
                          organ.score,
                          futureProjection.projectedScore,
                        )}
                      </p>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                        Today&apos;s score is {Math.round(organ.score)}%. If this pattern
                        keeps repeating, the age-70 outlook lands at{' '}
                        {Math.round(futureProjection.projectedScore)}%.
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${getTrendTone(
                        projectionDirection,
                      )}`}
                    >
                      {getTrendLabel(projectionDirection)}
                    </span>
                  </div>

                  <OrganTrendSparkline
                    points={futureProjection.points}
                    direction={projectionDirection}
                    className="mt-6 h-52 w-full"
                    height={196}
                    showArea
                  />
                  <div className="mt-3 flex items-center justify-between text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <span>Age {currentAge}</span>
                    <span>Age 70</span>
                  </div>
                </article>

                <article className="rounded-[1.35rem] border border-emerald-100 bg-white/94 p-4 shadow-sm">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Life at 70
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    {futureProjection.scenarioTitle}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {futureProjection.scenarioBody}
                  </p>

                  <div className="mt-4 space-y-2">
                    {futureProjection.abilityBullets.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <article className="rounded-[1.35rem] border border-rose-100 bg-white/92 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-rose-700">
                        Why this future
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        Top drags
                      </h3>
                    </div>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-rose-700">
                      Removal helps
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {futureProjection.topDrags.length > 0 ? (
                      futureProjection.topDrags.map((lever) => (
                        <div
                          key={lever.activityType}
                          className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">
                              {lever.label}
                            </p>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-rose-700">
                              +{formatLeverImpact(lever.impactAt70)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Removing this drag would improve this organ&apos;s age-70 score.
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-rose-200 bg-white/80 px-4 py-6 text-sm leading-6 text-slate-500">
                        No strong drag is standing out from your recent pattern yet.
                      </div>
                    )}
                  </div>
                </article>

                <article className="rounded-[1.35rem] border border-emerald-100 bg-white/92 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        Why this future
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        Top supports
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Loss hurts
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {futureProjection.topSupports.length > 0 ? (
                      futureProjection.topSupports.map((lever) => (
                        <div
                          key={lever.activityType}
                          className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">
                              {lever.label}
                            </p>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                              -{formatLeverImpact(lever.impactAt70)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Losing this support would pull the age-70 score lower.
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/80 px-4 py-6 text-sm leading-6 text-slate-500">
                        No clear long-term support habit is separating itself yet.
                      </div>
                    )}
                  </div>
                </article>
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {futureProjection.basisLabel} Directional only, not medical advice.
              </p>
            </>
          ) : currentAge == null ? (
            <div className="mt-5 rounded-[1.35rem] border border-amber-200 bg-amber-50/80 p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-700">
                Projection locked
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Add your current age to unlock the age-70 view
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                The app needs your current age before it can translate today&apos;s
                lifestyle into a future organ outlook.
              </p>
              <Link
                to="/settings"
                className="mt-4 inline-flex rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
              >
                Add age in settings
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.35rem] border border-dashed border-slate-200 bg-white/85 px-5 py-8 text-sm leading-6 text-slate-500">
              Need {remainingProjectionCheckIns} more check-in
              {remainingProjectionCheckIns === 1 ? '' : 's'} before this organ gets a
              readable age-70 outlook.
            </div>
          )}
        </section>

        <div className="mt-8">
          <SectionLabel>Recent evidence</SectionLabel>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This is the short-term proof under the projection: the actual check-ins
            that have been nudging this organ lately.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {DETAIL_WINDOWS.map((windowSize) => {
            const isActive = selectedWindow === windowSize

            return (
              <button
                key={windowSize}
                type="button"
                onClick={() => setSelectedWindow(windowSize)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-[0_14px_28px_-20px_rgba(15,23,42,0.9)]'
                    : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                }`}
              >
                {windowSize} check-ins
              </button>
            )
          })}
        </div>

        <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
          {hasTrend ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Recent check-ins
                  </p>
                  <p className="mt-2 text-3xl font-semibold leading-none text-slate-900">
                    {formatTrendDelta(windowMetrics.delta)}
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    {buildDriverSummary(
                      activeTrendDirection,
                      organ.trend.primaryDrivers,
                    )}
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {formatWindowLabel(selectedWindow, visibleTrendPoints.length)}
                </span>
              </div>

              <OrganTrendSparkline
                points={visibleTrendPoints}
                direction={activeTrendDirection}
                className="mt-6 h-48 w-full"
                height={184}
                showArea
              />
              <div className="mt-3 flex items-center justify-between text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span>Earlier</span>
                <span>Now</span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <article className="rounded-[1.2rem] border border-white bg-white p-4 shadow-sm">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Biggest lift
                  </p>
                  {windowMetrics.biggestRise ? (
                    <>
                      <p className="mt-2 text-2xl font-semibold text-emerald-700">
                        {formatTrendDelta(windowMetrics.biggestRise.delta)}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {windowMetrics.biggestRise.point.label}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      No meaningful upward jump inside this visible window.
                    </p>
                  )}
                </article>

                <article className="rounded-[1.2rem] border border-white bg-white p-4 shadow-sm">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Sharpest dip
                  </p>
                  {windowMetrics.biggestDrop ? (
                    <>
                      <p className="mt-2 text-2xl font-semibold text-rose-700">
                        {formatTrendDelta(windowMetrics.biggestDrop.delta)}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {windowMetrics.biggestDrop.point.label}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      No meaningful downward jump inside this visible window.
                    </p>
                  )}
                </article>
              </div>
            </>
          ) : (
            <div className="rounded-[1.3rem] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm leading-6 text-slate-500">
              Need 3 check-ins before this organ gets a readable trend. Keep logging and
              this panel will draw the line for you.
            </div>
          )}
        </div>
      </section>

      <details className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.28)] backdrop-blur">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <div>
            <SectionLabel>Recent drivers</SectionLabel>
            <p className="mt-2 text-sm text-slate-600">
              Raw log evidence behind the line. Open this when you want the exact
              check-in entries.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {organ.history.length} entries
          </span>
        </summary>

        <div className="mt-4 space-y-3">
          {organ.history.length > 0 ? (
            organ.history.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                    {item.label}
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {item.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
              Log an activity to see what is helping or straining this organ.
            </div>
          )}
        </div>
      </details>

      <section className="space-y-3">
        <SectionLabel>What helps</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {organ.helps.map((item) => (
            <span
              key={item}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-700"
            >
              {item}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
