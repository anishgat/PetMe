import { useEffect, useState } from 'react'
import type { HomeSystemBar } from './AvatarCanvas'
import InsightCardModal from './InsightCardModal'
import {
  generateInsightCard,
  type InsightCardContent,
} from '../features/insights/insightService'

type AvatarStatsOverlayProps = {
  systemBars: HomeSystemBar[]
}

function getBarTone(progress: number) {
  if (progress >= 0.75) {
    return {
      icon: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      bar: 'bg-emerald-500',
    }
  }

  if (progress >= 0.55) {
    return {
      icon: 'border-amber-200 bg-amber-50 text-amber-700',
      bar: 'bg-amber-500',
    }
  }

  return {
    icon: 'border-rose-200 bg-rose-50 text-rose-700',
    bar: 'bg-rose-500',
  }
}

type SystemIconProps = {
  id: HomeSystemBar['id']
}

const SystemIcon = ({ id }: SystemIconProps) => {
  switch (id) {
    case 'cardio':
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.8-7 10-7 10Z" />
        </svg>
      )
    case 'brain':
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M9.5 5.2a3 3 0 0 0-3 3v.6a2.8 2.8 0 0 0-1.8 2.6 2.8 2.8 0 0 0 1.8 2.6v.8a3 3 0 0 0 3 3h5a3 3 0 0 0 3-3v-.8a2.8 2.8 0 0 0 1.8-2.6 2.8 2.8 0 0 0-1.8-2.6v-.6a3 3 0 0 0-3-3h-5Z" />
          <path d="M12 6.4v11.2M9.3 9.6h2.7M12 13.2h2.7" />
        </svg>
      )
    case 'digestive':
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M10 4.5v5.2a2.8 2.8 0 0 0 2.8 2.8h.8a2.9 2.9 0 0 1 2.9 2.9v.7a3.4 3.4 0 0 1-3.4 3.4h-1.3a3.8 3.8 0 0 1-3.8-3.8V4.5" />
        </svg>
      )
    case 'renal':
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M9.5 5.5c-2.2 0-4 1.9-4 4.2V12a4.5 4.5 0 0 0 4.5 4.5h.6V9.8A4.3 4.3 0 0 0 9.5 5.5Z" />
          <path d="M14.5 5.5c2.2 0 4 1.9 4 4.2V12a4.5 4.5 0 0 1-4.5 4.5h-.6V9.8a4.3 4.3 0 0 1 1.1-4.3Z" />
        </svg>
      )
    case 'mobility':
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M7.5 9.2a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4ZM16.5 19.2a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4Z" />
          <path d="m9 8.5 6 7m-3.5-10 3 2.2m-5.5 8.3-2.5 2" />
        </svg>
      )
    default:
      return null
  }
}

export const AvatarStatsOverlay = ({ systemBars }: AvatarStatsOverlayProps) => {
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [activeSystem, setActiveSystem] = useState<HomeSystemBar | null>(null)
  const [insight, setInsight] = useState<InsightCardContent | null>(null)
  const [isLoadingInsight, setIsLoadingInsight] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 639px)')
    const syncViewportState = () => {
      setIsMobileViewport(mediaQuery.matches)
      setIsCompact(mediaQuery.matches)
    }

    syncViewportState()
    mediaQuery.addEventListener('change', syncViewportState)

    return () => {
      mediaQuery.removeEventListener('change', syncViewportState)
    }
  }, [])

  const handleOpenSystemInsight = async (system: HomeSystemBar) => {
    setActiveSystem(system)
    setInsight(null)
    setIsLoadingInsight(true)

    const generated = await generateInsightCard({
      kind: 'system',
      key: system.id,
      name: system.label,
      score: Math.round(system.progress * 100),
    })

    setInsight(generated)
    setIsLoadingInsight(false)
  }

  return (
    <>
      <section
        className={`pointer-events-auto w-full rounded-[26px] border border-white/70 bg-white/72 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.55)] backdrop-blur-xl ${
          isCompact ? 'max-w-[21rem] p-2.5' : 'max-w-sm p-3'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-[0.63rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {isCompact ? 'Systems' : 'Body systems'}
          </p>
          {isMobileViewport && (
            <button
              type="button"
              onClick={() => setIsCompact((current) => !current)}
              className="rounded-full border border-white/70 bg-white/85 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:bg-white"
            >
              {isCompact ? 'Expand' : 'Mini'}
            </button>
          )}
        </div>

        {isCompact ? (
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {systemBars.map((system) => {
              const tone = getBarTone(system.progress)
              const percent = Math.round(system.progress * 100)

              return (
                <button
                  type="button"
                  key={system.id}
                  onClick={() => void handleOpenSystemInsight(system)}
                  className="rounded-xl border border-white/65 bg-white/80 px-1.5 py-1.5 transition hover:bg-white"
                >
                  <div
                    className={`mx-auto grid h-7 w-7 place-items-center rounded-lg border ${tone.icon}`}
                  >
                    <SystemIcon id={system.id} />
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200/80">
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="sr-only">
                    {system.label} {percent}%
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {systemBars.map((system) => {
              const tone = getBarTone(system.progress)
              const percent = Math.round(system.progress * 100)

              return (
                <button
                  type="button"
                  key={system.id}
                  onClick={() => void handleOpenSystemInsight(system)}
                  className="w-full rounded-2xl border border-white/65 bg-white/80 px-3 py-2 text-left transition hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-8 w-8 place-items-center rounded-xl border ${tone.icon}`}
                    >
                      <SystemIcon id={system.id} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {system.label}
                      </p>
                    </div>
                    <span className="ml-auto text-xs font-semibold text-slate-500">
                      {percent}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/75">
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <InsightCardModal
        isOpen={activeSystem != null}
        heading={activeSystem?.label ?? 'System'}
        content={insight}
        isLoading={isLoadingInsight}
        onClose={() => {
          setActiveSystem(null)
          setInsight(null)
          setIsLoadingInsight(false)
        }}
      />
    </>
  )
}
