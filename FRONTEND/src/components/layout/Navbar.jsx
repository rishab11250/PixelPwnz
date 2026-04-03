import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', desc: 'Temporal insights at a glance' },
  '/events': { title: 'Event Log', desc: 'Track anomalies and changes' },
  '/map': { title: 'Map View', desc: 'Geographic data visualization' },
}

function Navbar() {
  const { pathname } = useLocation()
  const page = PAGE_TITLES[pathname] ?? { title: 'DataTime Machine', desc: '' }

  return (
    <header className="flex items-center justify-between border-b border-slate-800/60 bg-slate-950/60 px-8 py-4 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            {page.title}
          </h1>
          {page.desc && (
            <p className="mt-0.5 text-xs text-slate-400">{page.desc}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-2 text-sm text-slate-400 transition-colors hover:border-slate-700">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="hidden text-xs md:inline">Search datasets…</span>
          <kbd className="ml-4 hidden rounded-md border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-500 md:inline">
            ⌘K
          </kbd>
        </div>

        {/* Live Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Live
        </div>

        {/* User Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]">
          R
        </div>
      </div>
    </header>
  )
}

export default Navbar
