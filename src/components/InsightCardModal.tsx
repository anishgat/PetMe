import type { ReactNode } from 'react'
import type { InsightCardContent } from '../features/insights/insightService'

type InsightCardModalProps = {
  isOpen: boolean
  heading: string
  content: InsightCardContent | null
  isLoading: boolean
  onClose: () => void
  footerAction?: ReactNode
}

export default function InsightCardModal({
  isOpen,
  heading,
  content,
  isLoading,
  onClose,
  footerAction,
}: InsightCardModalProps) {
  if (!isOpen) return null

  return (
    <div className="pointer-events-auto fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/35 p-3 sm:items-center sm:p-6">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Insight card
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{heading}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close insight card"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Preparing insights...</p>
        ) : (
          <>
            <p className="mt-4 text-sm text-slate-700">
              {content?.insight ?? 'No insight available.'}
            </p>

            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
                Personalized advice
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {(content?.personalizedAdvice ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                Research-backed notes
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {(content?.researchBackedInfo ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            {content?.placeholder ? (
              <p className="mt-3 text-xs text-slate-500">
                Placeholder content. LLM generation hooks can replace this module later.
              </p>
            ) : null}
          </>
        )}

        {footerAction ? <div className="mt-4">{footerAction}</div> : null}
      </section>
    </div>
  )
}
