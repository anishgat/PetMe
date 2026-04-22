import { useState } from 'react'
import { Link } from 'react-router-dom'
import OrganCard from '../components/OrganCard'
import InsightCardModal from '../components/InsightCardModal'
import PageTitle from '../components/PageTitle'
import { ORGAN_METADATA } from '../data/organs'
import {
  generateInsightCard,
  type InsightCardContent,
} from '../features/insights/insightService'
import { useHealth } from '../features/health/HealthContext'
import type { OrganKey } from '../features/health/model/types'

export default function OrganOverview() {
  const { organSummaries } = useHealth()
  const organs = Object.keys(ORGAN_METADATA) as Array<keyof typeof ORGAN_METADATA>
  const [activeOrgan, setActiveOrgan] = useState<OrganKey | null>(null)
  const [insight, setInsight] = useState<InsightCardContent | null>(null)
  const [isLoadingInsight, setIsLoadingInsight] = useState(false)

  const handleOpenOrganInsight = async (organ: OrganKey) => {
    setActiveOrgan(organ)
    setInsight(null)
    setIsLoadingInsight(true)
    const summary = organSummaries[organ]
    const generated = await generateInsightCard({
      kind: 'organ',
      key: organ,
      name: summary.name,
      score: Math.round(summary.score),
    })
    setInsight(generated)
    setIsLoadingInsight(false)
  }

  return (
    <div className="space-y-4">
      <PageTitle>Organ overview</PageTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {organs.map((slug) => (
          <OrganCard
            key={slug}
            name={organSummaries[slug].name}
            rating={organSummaries[slug].progress}
            latestDelta={organSummaries[slug].latestDelta}
            onPress={() => void handleOpenOrganInsight(slug)}
          />
        ))}
      </div>

      <InsightCardModal
        isOpen={activeOrgan != null}
        heading={activeOrgan ? organSummaries[activeOrgan].name : 'Organ'}
        content={insight}
        isLoading={isLoadingInsight}
        onClose={() => {
          setActiveOrgan(null)
          setInsight(null)
          setIsLoadingInsight(false)
        }}
        footerAction={
          activeOrgan ? (
            <Link
              to={`/organs/${activeOrgan}`}
              className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Open organ details
            </Link>
          ) : null
        }
      />
    </div>
  )
}
