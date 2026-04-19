import type { CSSProperties } from 'react'

type ProgressBarProps = {
  value: number
  trackClassName?: string
  barClassName?: string
}

const clampPercent = (value: number) => {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value * 100)))
}

export default function ProgressBar({
  value,
  trackClassName,
  barClassName,
}: ProgressBarProps) {
  const percent = clampPercent(value)
  const trackClasses = [
    'h-3 w-full overflow-hidden rounded-full bg-emerald-50',
    trackClassName,
  ]
    .filter(Boolean)
    .join(' ')
  const barClasses = ['h-full rounded-full bg-emerald-500', barClassName]
    .filter(Boolean)
    .join(' ')
  const barStyle: CSSProperties = { width: `${percent}%` }

  return (
    <div className={trackClasses}>
      <div className={barClasses} style={barStyle} />
    </div>
  )
}
