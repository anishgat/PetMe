import ProgressBar from './ProgressBar'

type OrganCardProps = {
  name: string
  rating: number
  latestDelta: number
  onPress: () => void
}

function formatDelta(delta: number) {
  if (Math.abs(delta) < 0.05) return 'No recent shift'
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`
}

export default function OrganCard({
  name,
  rating,
  latestDelta,
  onPress,
}: OrganCardProps) {
  const deltaTone =
    latestDelta > 0.05
      ? 'bg-emerald-50 text-emerald-700'
      : latestDelta < -0.05
        ? 'bg-rose-50 text-rose-700'
        : 'bg-slate-100 text-slate-500'

  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full rounded-2xl border border-emerald-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{name}</span>
        <span className="font-semibold text-emerald-700">
          {Math.round(rating * 100)}%
        </span>
      </div>
      <div className="mt-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${deltaTone}`}
        >
          {formatDelta(latestDelta)}
        </span>
      </div>
      <div className="mt-3">
        <ProgressBar
          value={rating}
          trackClassName="h-2 bg-emerald-50"
          barClassName="bg-emerald-500"
        />
      </div>
    </button>
  )
}
