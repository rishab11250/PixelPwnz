import { useState } from 'react'
import DatasetCard from '../components/ui/DatasetCard.jsx'

const MOCK_DATASETS = [
  {
    id: 'traffic',
    name: 'City Traffic',
    value: 128_420,
    percentageChange: 4.2,
    timestamp: '5 min ago',
  },
  {
    id: 'energy',
    name: 'Energy Grid',
    value: 98_310,
    percentageChange: -1.3,
    timestamp: '12 min ago',
  },
  {
    id: 'weather',
    name: 'Weather Anomalies',
    value: 237,
    percentageChange: 8.6,
    timestamp: '2 min ago',
  },
]

function DashboardPage() {
  const [selectedId, setSelectedId] = useState(MOCK_DATASETS[0].id)

  return (
    <section className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Datasets
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Choose a dataset to explore temporal trends.
          </p>
        </div>

        {/* Dropdown */}
        <div className="flex items-center gap-3">
          <label className="flex flex-col gap-1.5 text-xs">
            <span className="font-medium uppercase tracking-[0.12em] text-slate-500">
              Active Dataset
            </span>
            <div className="relative inline-flex items-center rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-violet-500/40">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-40 cursor-pointer appearance-none bg-transparent pr-6 text-sm outline-none"
              >
                {MOCK_DATASETS.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </label>
        </div>
      </header>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_DATASETS.map((dataset, i) => (
          <div key={dataset.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}>
            <DatasetCard
              name={dataset.name}
              value={dataset.value}
              percentageChange={dataset.percentageChange}
              timestamp={dataset.timestamp}
            />
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Records', value: '227K', icon: '📦' },
          { label: 'Active Sources', value: '3', icon: '🔗' },
          { label: 'Events Today', value: '14', icon: '⚡' },
          { label: 'Uptime', value: '99.9%', icon: '✅' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3"
          >
            <span className="text-lg">{stat.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default DashboardPage
