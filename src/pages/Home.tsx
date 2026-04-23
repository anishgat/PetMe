import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AvatarCanvas, type HomeSystemBar } from '../components/AvatarCanvas'
import { AvatarStatsOverlay } from '../components/AvatarStatsOverlay'
import AvatarThoughtBubble from '../components/AvatarThoughtBubble'
import { useHealth } from '../features/health/HealthContext'
import type { OrganKey } from '../features/health/model/types'
import {
  generateFutureSelfMessage,
  type FutureSelfMessage,
} from '../features/messages/futureSelfMessageService'

const SYSTEM_GROUPS: Array<{
  id: HomeSystemBar['id']
  label: string
  organs: OrganKey[]
}> = [
  { id: 'cardio', label: 'Cardio', organs: ['heart', 'lungs'] },
  { id: 'brain', label: 'Cognitive', organs: ['brain'] },
  {
    id: 'digestive',
    label: 'Digestive',
    organs: ['liver', 'stomach', 'intestines'],
  },
  { id: 'renal', label: 'Renal', organs: ['kidneys'] },
  { id: 'mobility', label: 'Mobility', organs: ['bones'] },
]

export default function Home() {
  const { latestImpactNarrative, logEntries, organSummaries, overallScore } =
    useHealth()
  const [thoughtBubbleMessage, setThoughtBubbleMessage] =
    useState<FutureSelfMessage | null>(null)
  const [isLoadingMessage, setIsLoadingMessage] = useState(false)

  const systemBars = useMemo<HomeSystemBar[]>(
    () =>
      SYSTEM_GROUPS.map((group) => {
        const total = group.organs.reduce(
          (sum, organ) => sum + organSummaries[organ].progress,
          0,
        )

        return {
          id: group.id,
          label: group.label,
          progress: total / group.organs.length,
        }
      }),
    [organSummaries],
  )

  useEffect(() => {
    let isCancelled = false

    const loadMessage = async () => {
      setIsLoadingMessage(true)

      const message = await generateFutureSelfMessage({
        overallScore,
        latestImpactNarrative,
        recentCheckInCount: logEntries.length,
        latestCheckInAt: logEntries[0]?.timestamp,
        systems: systemBars.map((system) => ({
          id: system.id,
          label: system.label,
          score: Math.round(system.progress * 100),
        })),
      })

      if (isCancelled) {
        return
      }

      setThoughtBubbleMessage(message)
      setIsLoadingMessage(false)
    }

    void loadMessage()

    return () => {
      isCancelled = true
    }
  }, [latestImpactNarrative, logEntries, overallScore, systemBars])

  return (
    <div className="relative h-svh w-full overflow-hidden">
      <Canvas
        className="h-svh w-full pointer-events-none"
        shadows
        camera={{ position: [0, 2, 5], fov: 30 }}
      >
        <color attach="background" args={['#ececec']} />
        <AvatarCanvas />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-4 pt-20 sm:px-8 sm:pt-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 sm:relative sm:min-h-[12rem]">
          <div className="flex w-full justify-center sm:justify-end">
            <AvatarStatsOverlay systemBars={systemBars} />
          </div>

          <div className="flex w-full justify-center sm:absolute sm:left-1/2 sm:top-14 sm:w-auto sm:-translate-x-[14rem] sm:justify-start">
            <AvatarThoughtBubble
              message={thoughtBubbleMessage}
              isLoading={isLoadingMessage}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
