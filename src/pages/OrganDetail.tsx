import { useParams } from 'react-router-dom'
import PageTitle from '../components/PageTitle'
import ProgressBar from '../components/ProgressBar'
import SectionLabel from '../components/SectionLabel'
import { ORGAN_DATA, type OrganKey } from '../data/organs'

export default function OrganDetail() {
  const { organId } = useParams()
  const organ =
    (organId && organId in ORGAN_DATA
      ? ORGAN_DATA[organId as OrganKey]
      : undefined) ?? ORGAN_DATA.heart

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <PageTitle>{organ.name}</PageTitle>
          </div>
          <span className="text-lg font-semibold text-emerald-700">
            {Math.round(organ.rating * 100)}%
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar
            value={organ.rating}
            trackClassName="bg-emerald-50 shadow-inner"
            barClassName="bg-gradient-to-r from-emerald-400 to-emerald-600"
          />
        </div>
        <p className="mt-3 text-sm text-slate-600">{organ.note}</p>
      </section>

      <section className="space-y-3">
        <SectionLabel>Historical inputs</SectionLabel>
        <div className="space-y-3">
          {organ.history.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                {item.label}
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
            </div>
          ))}
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
