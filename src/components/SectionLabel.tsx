import type { ReactNode } from 'react'

type SectionLabelProps = {
  children: ReactNode
  className?: string
}

export default function SectionLabel({ children, className }: SectionLabelProps) {
  const classes = [
    'text-xs font-semibold uppercase tracking-[0.2em] text-slate-500',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}
