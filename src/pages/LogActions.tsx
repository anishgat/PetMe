import PageTitle from '../components/PageTitle'

const ACTIONS = ['Slept 8 hours', 'Strength training', 'Ate processed food']

export default function LogActions() {
  return (
    <div className="space-y-4">
      <PageTitle>Log an action</PageTitle>
      <div className="space-y-3">
        {ACTIONS.map((label) => (
          <label
            key={label}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-sm text-slate-700">{label}</span>
            <input type="checkbox" className="h-4 w-4 accent-emerald-600" />
          </label>
        ))}
      </div>
    </div>
  )
}
