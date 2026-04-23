import { useEffect, useState } from 'react'
import type { FutureSelfMessage } from '../features/messages/futureSelfMessageService'

type AvatarThoughtBubbleProps = {
  message: FutureSelfMessage | null
  isLoading: boolean
}

export default function AvatarThoughtBubble({
  message,
  isLoading,
}: AvatarThoughtBubbleProps) {
  const [isCompact, setIsCompact] = useState(true)
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 639px)')
    const syncCompactState = () => {
      setIsMobileViewport(mediaQuery.matches)
    }

    syncCompactState()
    mediaQuery.addEventListener('change', syncCompactState)

    return () => {
      mediaQuery.removeEventListener('change', syncCompactState)
    }
  }, [])

  const messageBody = isLoading
    ? 'Thinking through your recent trend...'
    : message?.body ??
      'I am here with a gentle reflection once your health signals arrive.'

  if (isCompact) {
    return (
      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={() => setIsCompact(false)}
          className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-left shadow-[0_14px_30px_-18px_rgba(15,23,42,0.4)] backdrop-blur transition hover:bg-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M7 15.5c-1.7 0-3-1.3-3-3v-2C4 6.4 7.4 3 11.5 3h1C16.6 3 20 6.4 20 10.5v2c0 4.1-3.4 7.5-7.5 7.5h-2L7 21v-5.5Z" />
            </svg>
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            Future self
          </span>
        </button>

        {!isMobileViewport ? (
          <div className="absolute left-6 top-full flex translate-y-1 items-end gap-1">
            <span className="h-3 w-3 rounded-full border border-white/70 bg-white/85 shadow-sm" />
            <span className="mb-[-12px] h-2 w-2 rounded-full border border-white/70 bg-white/80 shadow-sm" />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="pointer-events-auto relative w-[min(18rem,calc(100vw-2rem))] sm:w-[18.5rem]">
      <section className="rounded-[24px] border border-white/82 bg-white/90 p-3.5 shadow-[0_18px_38px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {message?.toneLabel ?? 'Future self'}
            </p>
            <p className="mt-2 max-h-24 overflow-y-auto pr-1 text-sm font-medium leading-5 text-slate-700 sm:max-h-28">
              {messageBody}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCompact(true)}
            aria-label="Collapse future self message"
            className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:bg-slate-50"
          >
            Hide
          </button>
        </div>

        {message?.placeholder ? (
          <p className="mt-3 text-xs text-slate-500">
            Placeholder POV message. This can plug into LLM trend analysis later.
          </p>
        ) : null}
      </section>

      {!isMobileViewport ? (
        <div className="absolute left-8 top-full flex translate-y-1 items-end gap-1">
          <span className="h-3.5 w-3.5 rounded-full border border-white/80 bg-white/90 shadow-sm" />
          <span className="mb-[-14px] h-2 w-2 rounded-full border border-white/75 bg-white/85 shadow-sm" />
        </div>
      ) : null}
    </div>
  )
}
