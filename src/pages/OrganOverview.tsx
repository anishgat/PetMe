import OrganCard from '../components/OrganCard'
import PageTitle from '../components/PageTitle'
import { ORGAN_METADATA } from '../data/organs'
import { useHealth } from '../features/health/HealthContext'

export default function OrganOverview() {
  const { organSummaries } = useHealth()
  const organs = Object.keys(ORGAN_METADATA) as Array<keyof typeof ORGAN_METADATA>

  return (
    <div className="space-y-4">
      <PageTitle>Organ overview</PageTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {organs.map((slug) => (
          <OrganCard
            key={slug}
            slug={slug}
            name={organSummaries[slug].name}
            rating={organSummaries[slug].progress}
          />
        ))}
      </div>
    </div>
  )
}
