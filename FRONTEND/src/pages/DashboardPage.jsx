import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import DatasetCard from '../components/ui/DatasetCard.jsx'

/* ── Data ──────────────────────────────────────────── */
const DATASETS = [
  { id: 'bitcoin', name: 'Bitcoin Price',      value: 67842,  unit: 'USD',   percentageChange: 4.2,   timestamp: '5 min ago', accent: '#f59e0b' },
  { id: 'aqi',     name: 'Delhi AQI',          value: 237,    unit: 'PM2.5', percentageChange: -12.3, timestamp: '2 min ago', accent: '#fb7185' },
  { id: 'weather', name: 'Mumbai Temperature', value: 33.6,   unit: '°C',    percentageChange: 1.8,  timestamp: '8 min ago', accent: '#38bdf8' },
]

function buildChart(n = 24) {
  let v = 40
  return Array.from({ length: n }, (_, i) => {
    v += Math.random() * 14 - 6
    v = Math.max(8, Math.min(95, v))
    return { label: `${String(i).padStart(2,'0')}:00`, value: Math.round(v * 10) / 10 }
  })
}

const EVENTS = [
  { id: 1, title: 'AQI spike detected — Delhi NCR',        time: '2m',   sev: 'critical', color: '#fb7185' },
  { id: 2, title: 'BTC crossed $67,000 resistance',         time: '14m',  sev: 'info',     color: '#f59e0b' },
  { id: 3, title: 'Mumbai humidity hit 92%',                 time: '28m',  sev: 'warning',  color: '#38bdf8' },
  { id: 4, title: 'Hourly data sync — all sources OK',      time: '1h',   sev: 'success',  color: '#34d399' },
  { id: 5, title: 'Unusual BTC volume spike',                time: '2h',   sev: 'warning',  color: '#f59e0b' },
]

/* ── Tooltip ──────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs shadow-xl">
      <p className="text-text-muted">{label}</p>
      <p className="font-mono font-bold text-amber">{payload[0].value}</p>
    </div>
  )
}

/* ── Helpers ──────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ── Animations ───────────────────────────────────── */
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const pop = { hidden: { opacity: 0, y: 14, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 22 } } }

/* ──────────────────────────────────────────────────── */
function DashboardPage() {
  const [activeId, setActiveId] = useState(DATASETS[0].id)
  const chartData = useMemo(() => buildChart(), [])
  const active = DATASETS.find(d => d.id === activeId) ?? DATASETS[0]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-0">

      {/* ── Header Bar ───────────────────────────── */}
      <header className="flex items-center justify-between border-b border-edge px-8 py-5">
        <div>
          <h1 className="text-lg font-bold tracking-tight">{getGreeting()}</h1>
          <p className="mt-0.5 text-sm text-text-secondary">Your temporal data overview for today.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg border border-edge bg-bg-raised px-3 py-2 text-sm text-text-muted transition-colors hover:border-bg-hover">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span className="hidden text-xs md:inline">Search…</span>
            <kbd className="ml-3 hidden rounded border border-edge bg-bg-base px-1.5 py-0.5 text-[10px] font-mono text-text-muted md:inline">⌘K</kbd>
          </div>
          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber to-rose text-xs font-bold text-white">R</div>
        </div>
      </header>

      <div className="px-8 py-6 flex flex-col gap-6">

        {/* ── Metric Cards (top row) ───────────── */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {DATASETS.map((ds) => (
            <motion.div
              key={ds.id}
              variants={pop}
              onClick={() => setActiveId(ds.id)}
              className={`cursor-pointer rounded-xl ring-1 transition-all duration-150 ${
                activeId === ds.id ? 'ring-text-muted' : 'ring-transparent'
              }`}
            >
              <DatasetCard {...ds} />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Bento Grid: Chart + Activity + Stats */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* ─ Chart Panel (8 cols) ─────────────── */}
          <motion.div variants={pop} initial="hidden" animate="show" className="card flex flex-col lg:col-span-8">
            <div className="flex items-center justify-between border-b border-edge px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: active.accent }} />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={active.name}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="text-sm font-semibold"
                  >
                    {active.name}
                  </motion.span>
                </AnimatePresence>
                <span className="text-xs text-text-muted">— 24h</span>
              </div>
              <div className="flex gap-1">
                {['1H','6H','24H','7D','30D'].map(r => (
                  <button key={r} className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    r === '24H' ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-secondary'
                  }`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 p-4" style={{ minHeight: 280 }}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={active.accent} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={active.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
                  <Area type="monotone" dataKey="value" stroke={active.accent} strokeWidth={2} fill="url(#mainGrad)" dot={false} activeDot={{ r: 4, fill: active.accent, stroke: '#09090b', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* ─ Activity Feed (4 cols) ──────────── */}
          <motion.div variants={pop} initial="hidden" animate="show" className="card flex flex-col lg:col-span-4">
            <div className="flex items-center justify-between border-b border-edge px-5 py-3.5">
              <span className="text-sm font-semibold">Activity</span>
              <span className="rounded-full bg-rose-soft px-2 py-0.5 text-[10px] font-bold tabular-nums text-rose">{EVENTS.length}</span>
            </div>
            <div className="flex flex-1 flex-col divide-y divide-edge-subtle overflow-y-auto">
              {EVENTS.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-bg-hover/50"
                >
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ev.color, boxShadow: `0 0 6px ${ev.color}50` }} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs text-text-primary">{ev.title}</p>
                    <p className="mt-0.5 text-[10px] text-text-muted">{ev.time} ago</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ─ Bottom Stats Row (full width) ────── */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:col-span-12">
            {[
              { label: 'Records Ingested',  val: '227,431', delta: '+1,247 today',   accent: '#f59e0b', pct: 78 },
              { label: 'Data Sources',      val: '3 / 3',   delta: 'All connected',   accent: '#34d399', pct: 100 },
              { label: 'Anomalies Detected',val: '14',      delta: '3 critical',       accent: '#fb7185', pct: 38 },
              { label: 'Avg Response',       val: '12ms',   delta: '30-day P95',        accent: '#38bdf8', pct: 92 },
            ].map((s) => (
              <motion.div key={s.label} variants={pop} className="card px-4 py-3.5 flex flex-col gap-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{s.label}</span>
                <span className="text-xl font-bold tabular-nums">{s.val}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-bg-hover overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: s.accent }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-text-muted">{s.delta}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default DashboardPage
