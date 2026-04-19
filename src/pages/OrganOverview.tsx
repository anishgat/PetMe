import OrganCard from '../components/OrganCard'
import PageTitle from '../components/PageTitle'
import { ORGAN_DATA } from '../data/organs'

export default function OrganOverview() {
  const organs = Object.entries(ORGAN_DATA)

  return (
    <div className="space-y-4">
      <PageTitle>Organ overview</PageTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {organs.map(([slug, organ]) => (
          <OrganCard
            key={slug}
            slug={slug}
            name={organ.name}
            rating={organ.rating}
          />
        ))}
      </div>
    </div>
  )
}
