import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/events', label: 'Event Log', icon: EventIcon },
  { to: '/map', label: 'Map', icon: MapIcon },
]

function Sidebar() {
  return (
    <aside className="flex flex-col gap-8 bg-slate-950/95 px-5 py-6 backdrop-blur-sm">
      {/* ── Brand ──────────────────────────────── */}
      <div className="flex items-center gap-3 px-1">
        <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-fuchsia-500 via-violet-500 to-sky-400 shadow-[0_0_20px_rgba(139,92,246,0.5)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white">DataTime</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-violet-400">Machine</span>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-1">
        <span className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Main Menu
        </span>

        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-violet-500/15 text-white shadow-[inset_0_0_0_1px_rgba(139,92,246,0.3)]'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -left-5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
                )}
                <Icon active={isActive} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Status Badge ───────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-400">System Online</span>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-500">All services operational</p>
      </div>
    </aside>
  )
}

/* ── SVG Icons ────────────────────────────────────── */
function DashboardIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#a78bfa' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-colors">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

function EventIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#a78bfa' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-colors">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}

function MapIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#a78bfa' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-colors">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}

export default Sidebar
