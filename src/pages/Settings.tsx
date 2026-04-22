import PageTitle from '../components/PageTitle'
import { useHealth } from '../features/health/HealthContext'

export default function Settings() {
  const { logEntries, resetHealthState } = useHealth()

  return (
    <div className="space-y-4">
      <PageTitle>Settings</PageTitle>
      <p className="text-sm text-slate-600">
        Integrations are mocked for the prototype.
      </p>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-700">
          Stored check-ins: <span className="font-semibold">{logEntries.length}</span>
        </p>
        <button
          type="button"
          onClick={resetHealthState}
          className="mt-4 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          Reset local health data
        </button>
      </section>
    </div>
  )
}
