import type { ReactNode } from 'react'

type PageTitleProps = {
  children: ReactNode
  className?: string
}

export default function PageTitle({ children, className }: PageTitleProps) {
  const classes = ['text-xl font-semibold text-slate-900', className]
    .filter(Boolean)
    .join(' ')

  return <h2 className={classes}>{children}</h2>
}
