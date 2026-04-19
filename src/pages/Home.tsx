import { Link } from 'react-router-dom'
import AvatarCanvas from '../components/AvatarCanvas'
import ProgressBar from '../components/ProgressBar'

const METRICS = [
  { label: 'Sleep', value: 0.72, tone: 'from-emerald-400 to-emerald-600' },
  { label: 'Movement', value: 0.58, tone: 'from-sky-400 to-sky-600' },
  { label: 'Stress', value: 0.34, tone: 'from-amber-400 to-amber-600' },
]

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-start gap-6 text-center">
      <AvatarCanvas className="h-[75svh] w-full max-w-4xl" />
      <div className="w-full max-w-2xl space-y-4">
        {METRICS.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
              <span>{metric.label}</span>
              <span>{Math.round(metric.value * 100)}%</span>
            </div>
            <ProgressBar
              value={metric.value}
              trackClassName="bg-emerald-50 shadow-inner"
              barClassName={`bg-gradient-to-r ${metric.tone}`}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/log"
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm"
        >
          Log an action
        </Link>
        <Link
          to="/organs"
          className="rounded-full border border-emerald-200 px-5 py-2 text-sm font-medium text-emerald-700"
        >
          Explore organs
        </Link>
      </div>
    </div>
  )
}
