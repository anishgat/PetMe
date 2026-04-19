import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar'

type OrganCardProps = {
  slug: string
  name: string
  rating: number
}

export default function OrganCard({ slug, name, rating }: OrganCardProps) {
  return (
    <Link
      to={`/organs/${slug}`}
      className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{name}</span>
        <span className="font-semibold text-emerald-700">
          {Math.round(rating * 100)}%
        </span>
      </div>
      <div className="mt-3">
        <ProgressBar
          value={rating}
          trackClassName="h-2 bg-emerald-50"
          barClassName="bg-emerald-500"
        />
      </div>
    </Link>
  )
}
