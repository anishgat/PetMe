import { useState } from 'react'
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
      dot: 'bg-emerald-500',
      text: 'text-emerald-700',
    }
  }

  if (progress >= 0.55) {
    return {
      icon: 'border-amber-200 bg-amber-50 text-amber-700',
      bar: 'bg-amber-500',
      dot: 'bg-amber-500',
      text: 'text-amber-700',
    }
  }

  return {
    icon: 'border-rose-200 bg-rose-50 text-rose-700',
    bar: 'bg-rose-500',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
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
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeSystem, setActiveSystem] = useState<HomeSystemBar | null>(null)
  const [insight, setInsight] = useState<InsightCardContent | null>(null)
  const [isLoadingInsight, setIsLoadingInsight] = useState(false)

  const averageScore = systemBars.length
    ? Math.round(
        (systemBars.reduce((sum, system) => sum + system.progress, 0) /
          systemBars.length) *
          100,
      )
    : 0
  const lowestSystem = systemBars.reduce<HomeSystemBar | null>(
    (lowest, system) =>
      lowest == null || system.progress < lowest.progress ? system : lowest,
    null,
  )

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
      <div className="pointer-events-auto w-full max-w-[min(100%,38rem)]">
        <div
          className={`grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out ${
            isExpanded ? 'mb-2 grid-rows-[1fr] opacity-100' : 'mb-0 grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <section
              id="body-systems-panel"
              aria-label="Body systems"
              className="rounded-[24px] border border-white/80 bg-white/82 p-2.5 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.44)] backdrop-blur-xl"
            >
              <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible">
                {systemBars.map((system) => {
                  const tone = getBarTone(system.progress)
                  const percent = Math.round(system.progress * 100)

                  return (
                    <button
                      type="button"
                      key={system.id}
                      onClick={() => void handleOpenSystemInsight(system)}
                      className="min-w-[7rem] shrink-0 rounded-[18px] border border-slate-200/75 bg-white/78 px-3 py-2 text-left transition hover:bg-white sm:min-w-0 sm:flex-1"
                      aria-label={`${system.label} ${percent}%`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${tone.icon}`}
                        >
                          <SystemIcon id={system.id} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-700">
                            {system.label}
                          </p>
                          <p className={`text-[0.7rem] font-medium ${tone.text}`}>
                            {percent}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200/85">
                        <div
                          className={`h-full rounded-full ${tone.bar}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          </div>
        </div>

        <section className="rounded-full border border-white/80 bg-white/76 px-3 py-2 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.44)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            aria-controls="body-systems-panel"
            className="flex w-full items-center gap-3 text-left"
          >
            <div className="min-w-0">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Body systems
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {averageScore}% overall
                </span>
                <span className="hidden truncate text-xs text-slate-500 sm:inline">
                  {lowestSystem == null
                    ? `${systemBars.length} tracked`
                    : `${lowestSystem.label} lowest`}
                </span>
              </div>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-1">
                {systemBars.map((system) => {
                  const tone = getBarTone(system.progress)

                  return (
                    <span
                      key={system.id}
                      className={`h-2 w-2 rounded-full ${tone.dot}`}
                    />
                  )
                })}
              </div>

              <span className="grid h-8 w-8 place-items-center rounded-full border border-slate-200/80 bg-white/92 text-slate-500">
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </div>
          </button>
        </section>
      </div>

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
