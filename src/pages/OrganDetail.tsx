import { useParams } from 'react-router-dom'
import PageTitle from '../components/PageTitle'
import ProgressBar from '../components/ProgressBar'
import SectionLabel from '../components/SectionLabel'
import { ORGAN_METADATA } from '../data/organs'
import { useHealth } from '../features/health/HealthContext'
import type { OrganKey } from '../features/health/model/types'

export default function OrganDetail() {
  const { organSummaries } = useHealth()
  const { organId } = useParams()
  const organKey =
    (organId && organId in ORGAN_METADATA ? (organId as OrganKey) : undefined) ?? 'heart'
  const organ = organSummaries[organKey]
  const latestDeltaText =
    Math.abs(organ.latestDelta) < 0.05
      ? 'No major change from the last check-in.'
      : `Last check-in ${
          organ.latestDelta > 0 ? 'supported' : 'strained'
        } this organ by about ${Math.abs(organ.latestDelta).toFixed(1)} points.`

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <PageTitle>{organ.name}</PageTitle>
          </div>
          <span className="text-lg font-semibold text-emerald-700">
            {Math.round(organ.score)}%
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar
            value={organ.progress}
            trackClassName="bg-emerald-50 shadow-inner"
            barClassName="bg-gradient-to-r from-emerald-400 to-emerald-600"
          />
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {latestDeltaText}
        </p>
        <p className="mt-3 text-sm text-slate-600">{organ.explanation}</p>
      </section>

      <section className="space-y-3">
        <SectionLabel>Recent drivers</SectionLabel>
        <div className="space-y-3">
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
      </section>

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
