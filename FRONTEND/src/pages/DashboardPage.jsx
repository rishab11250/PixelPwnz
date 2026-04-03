import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '../lib/api.js'

import { useTimeMachine } from '../contexts/TimeMachineContext.jsx'
import TimelineChart from '../components/charts/TimelineChart.jsx'
import Loader from '../components/ui/Loader.jsx'
import DatasetCard from '../components/ui/DatasetCard.jsx'
import { formatValueDisplay, timeAgoFromNow } from '../utils/format.js'

const SEVEN_D_MS = 7 * 24 * 60 * 60 * 1000

/* ── Category config ──────────────────────────────── */
const CAT = {
  crypto:      { label: 'Crypto',      accent: '#f59e0b', icon: '📈' },
  air_quality: { label: 'Air Quality', accent: '#fb7185', icon: '🌫️' },
  weather:     { label: 'Weather',     accent: '#38bdf8', icon: '🌡️' },
  forex:       { label: 'Forex',       accent: '#a78bfa', icon: '💱' },
}

const SEV_COLOR = { high: '#fb7185', medium: '#f59e0b', low: '#38bdf8' }

/* ── Helpers ──────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ── Animation ────────────────────────────────────── */
const pop = { hidden: { opacity: 0, y: 12, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 22 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }

/* ══════════════════════════════════════════════════ */
function DashboardPage() {
  const navigate = useNavigate()
  const { minTime, simulatedTime } = useTimeMachine()
  const [datasets, setDatasets] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [allSnaps, setAllSnaps] = useState({}) // id → snapshots up to simulatedTime
  const [activeCat, setActiveCat] = useState('all')
  const [activeDs, setActiveDs]   = useState(null) // selected dataset for chart
  const [chartSnaps, setChartSnaps] = useState([])
  const [loading, setLoading] = useState(true)

  const chartWindowStart = useMemo(
    () => Math.max(minTime, simulatedTime - SEVEN_D_MS),
    [minTime, simulatedTime],
  )

  // Fetch datasets + events on mount
  useEffect(() => {
    async function load() {
      try {
        const [ds, ev] = await Promise.all([api.getDatasets(), api.getEvents()])
        setDatasets(ds)
        setAllEvents(ev)
        if (ds.length) setActiveDs(ds[0])
        setLoading(false)
      } catch (err) {
        console.error('Dashboard load failed:', err)
        setLoading(false)
      }
    }
    load()
  }, [])

  // Snapshots up to scrubber time (server-side `to`) — debounced
  useEffect(() => {
    if (!datasets.length) return
    let cancelled = false
    const t = setTimeout(async () => {
      const toIso = new Date(simulatedTime).toISOString()
      try {
        const entries = await Promise.all(
          datasets.map(async (d) => {
            try {
              const snaps = await api.getSnapshots(d._id, undefined, toIso)
              return [d._id, snaps]
            } catch {
              return [d._id, []]
            }
          }),
        )
        if (!cancelled) setAllSnaps(Object.fromEntries(entries))
      } catch {
        if (!cancelled) setAllSnaps({})
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [datasets, simulatedTime])

  // Derived current metrics based on simulatedTime
  const snapCache = useMemo(() => {
    const cache = {}
    for (const [id, snaps] of Object.entries(allSnaps)) {
      const valid = snaps.filter(s => new Date(s.timestamp).getTime() <= simulatedTime)
      if (!valid.length) {
        cache[id] = { value: '—', pct: 0, ts: null, count: 0 }
        continue
      }
      const latest = valid[valid.length - 1]
      const prev = valid.length > 1 ? valid[valid.length - 2] : latest
      const pct = prev.value !== 0 ? ((latest.value - prev.value) / prev.value * 100) : 0
      cache[id] = { value: latest.value, pct, ts: latest.timestamp, count: valid.length }
    }
    return cache
  }, [allSnaps, simulatedTime])

  // Chart: windowed fetch [chartWindowStart, simulatedTime]
  useEffect(() => {
    if (!activeDs?._id) return
    let cancelled = false
    const fromIso = new Date(chartWindowStart).toISOString()
    const toIso = new Date(simulatedTime).toISOString()
    api
      .getSnapshots(activeDs._id, fromIso, toIso)
      .then((snaps) => {
        if (!cancelled) setChartSnaps(snaps)
      })
      .catch(console.error)
    return () => {
      cancelled = true
    }
  }, [activeDs?._id, chartWindowStart, simulatedTime])

  const chartData = useMemo(() => {
    return chartSnaps
      .filter((s) => new Date(s.timestamp).getTime() <= simulatedTime)
      .map((s) => ({
        label: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullLabel: new Date(s.timestamp).toLocaleString(),
        value: s.value,
        fullTs: s.timestamp,
      }))
  }, [chartSnaps, simulatedTime])

  const chartEvents = useMemo(() => {
    if (!activeDs?._id) return []
    return allEvents.filter(
      (e) =>
        (e.dataset_id === activeDs._id || String(e.dataset_id) === String(activeDs._id)) &&
        new Date(e.timestamp).getTime() <= simulatedTime,
    )
  }, [allEvents, activeDs, simulatedTime])

  const events = useMemo(() => {
    return allEvents.filter(e => new Date(e.timestamp).getTime() <= simulatedTime)
  }, [allEvents, simulatedTime])

  // Grouped/filtered datasets
  const categories = useMemo(() => {
    const cats = {}
    datasets.forEach(d => {
      if (!cats[d.category]) cats[d.category] = []
      cats[d.category].push(d)
    })
    return cats
  }, [datasets])

  const filteredDatasets = useMemo(() => {
    if (activeCat === 'all') return datasets
    return datasets.filter(d => d.category === activeCat)
  }, [datasets, activeCat])

  // Summary stats
  const stats = useMemo(() => ({
    datasets: datasets.length,
    events: events.length,
    categories: Object.keys(categories).length,
    critical: events.filter(e => e.severity === 'high').length,
  }), [datasets, events, categories])

  const activeAccent = activeDs ? (CAT[activeDs.category]?.accent || '#a78bfa') : '#f59e0b'

  if (loading) return <Loader label="Loading dashboard…" className="py-40" />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-0">

      {/* ── Page intro (app title lives in Navbar) ───────────── */}
      <header className="border-b border-edge px-8 py-5">
        <h1 className="text-lg font-bold tracking-tight">{getGreeting()}</h1>
        <p className="mt-0.5 text-sm text-text-secondary">
          Tracking <span className="font-mono text-text-primary">{stats.datasets}</span> datasets across {stats.categories} categories
        </p>
      </header>

      <div className="px-8 py-6 flex flex-col gap-6">

        {/* ── Summary Stats ────────────────────── */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Total Datasets', val: stats.datasets, accent: '#f59e0b', icon: '📊' },
            { label: 'Events Detected', val: stats.events, accent: '#fb7185', icon: '⚡' },
            { label: 'Critical Alerts', val: stats.critical, accent: stats.critical > 0 ? '#fb7185' : '#34d399', icon: '🔴' },
            { label: 'System Status',   val: 'Live', accent: '#34d399', icon: '🟢' },
          ].map(s => (
            <motion.div key={s.label} variants={pop} className="card px-4 py-3 flex items-center gap-3">
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-xl font-bold tabular-nums" style={{ color: s.accent }}>{s.val}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Category Filter ──────────────────── */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCat('all')}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              borderColor: activeCat === 'all' ? '#a1a1aa' : '#27272a',
              background: activeCat === 'all' ? 'rgba(161,161,170,0.08)' : 'transparent',
              color: activeCat === 'all' ? '#fafafa' : '#71717a',
            }}
          >
            All <span className="ml-1 font-mono opacity-60">{datasets.length}</span>
          </button>
          {Object.entries(CAT).map(([key, cfg]) => {
            const count = categories[key]?.length || 0
            if (!count) return null
            const active = activeCat === key
            return (
              <button
                key={key}
                onClick={() => setActiveCat(key)}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  borderColor: active ? cfg.accent : '#27272a',
                  background: active ? `${cfg.accent}12` : 'transparent',
                  color: active ? cfg.accent : '#71717a',
                }}
              >
                {cfg.icon} {cfg.label} <span className="ml-1 font-mono opacity-60">{count}</span>
              </button>
            )
          })}
        </div>

        {/* ── Dataset cards (real sparklines when data loaded) ── */}
        {filteredDatasets.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDatasets.slice(0, 6).map((ds) => {
              const cat = CAT[ds.category] || { accent: '#a78bfa' }
              const snap = snapCache[ds._id]
              const snaps = allSnaps[ds._id] || []
              const spark = snaps.length > 2 ? snaps.slice(-20).map((s) => s.value) : undefined
              return (
                <div key={ds._id} onClick={() => setActiveDs(ds)} className="cursor-pointer" role="presentation">
                  <DatasetCard
                    name={ds.name}
                    value={snap?.value != null ? formatValueDisplay(snap.value, ds.unit) : '—'}
                    unit=""
                    percentageChange={snap?.pct ?? 0}
                    timestamp={snap?.ts ? timeAgoFromNow(snap.ts) : '—'}
                    accent={cat.accent}
                    sparklineValues={spark}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* ── Bento: Dataset Grid + Chart + Activity */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* ─ Dataset Table (8 cols) ──────────── */}
          <motion.div variants={pop} initial="hidden" animate="show" className="card flex flex-col lg:col-span-8 max-h-[440px]">
            <div className="flex items-center justify-between border-b border-edge px-5 py-3">
              <span className="text-sm font-semibold">Datasets</span>
              <span className="text-xs text-text-muted">{filteredDatasets.length} tracked</span>
            </div>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 border-b border-edge-subtle px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              <span className="col-span-4">Name</span>
              <span className="col-span-2">Category</span>
              <span className="col-span-2 text-right">Value</span>
              <span className="col-span-2 text-right">Change</span>
              <span className="col-span-2 text-right">Updated</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-edge-subtle">
              {filteredDatasets.map(ds => {
                const cat = CAT[ds.category] || { label: ds.category, accent: '#a78bfa', icon: '•' }
                const snap = snapCache[ds._id]
                const isActive = activeDs?._id === ds._id
                return (
                  <div
                    key={ds._id}
                    onClick={() => setActiveDs(ds)}
                    className={`grid grid-cols-12 gap-2 px-5 py-2.5 cursor-pointer items-center text-sm transition-colors ${isActive ? 'bg-bg-hover/60' : 'hover:bg-bg-hover/30'}`}
                  >
                    <Link to={`/dataset/${ds._id}`} className="col-span-4 flex items-center gap-2 min-w-0" onClick={e => e.stopPropagation()}>
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cat.accent }} />
                      <span className="truncate text-xs font-semibold text-text-primary hover:underline">{ds.name}</span>
                    </Link>
                    <span className="col-span-2">
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: `${cat.accent}12`, color: cat.accent }}>
                        {cat.label}
                      </span>
                    </span>
                    <span className="col-span-2 text-right font-mono text-xs text-text-secondary">
                      {snap ? formatValueDisplay(snap.value, ds.unit) : '—'}
                    </span>
                    <span className="col-span-2 text-right font-mono text-xs font-bold" style={{ color: snap ? (snap.pct >= 0 ? '#34d399' : '#fb7185') : '#52525b' }}>
                      {snap ? `${snap.pct >= 0 ? '+' : ''}${snap.pct.toFixed(2)}%` : '—'}
                    </span>
                    <span className="col-span-2 text-right text-[10px] text-text-muted">
                      {snap?.ts ? timeAgoFromNow(snap.ts) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* ─ Activity Feed (4 cols) ──────────── */}
          <motion.div variants={pop} initial="hidden" animate="show" className="card flex flex-col lg:col-span-4 max-h-[440px]">
            <div className="flex items-center justify-between border-b border-edge px-5 py-3">
              <span className="text-sm font-semibold">Activity</span>
              <Link to="/events" className="rounded-full bg-rose-soft px-2 py-0.5 text-[10px] font-bold tabular-nums text-rose">{events.length}</Link>
            </div>
            <div className="flex-1 flex flex-col divide-y divide-edge-subtle overflow-y-auto">
              {events.length === 0 && (
                <div className="flex flex-1 items-center justify-center py-8 text-sm text-text-muted">No events yet</div>
              )}
              {events.map((ev, i) => (
                <motion.div
                  key={ev._id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-bg-hover/50"
                >
                  <span
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: SEV_COLOR[ev.severity] || '#52525b', boxShadow: `0 0 6px ${SEV_COLOR[ev.severity] || '#52525b'}50` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs text-text-primary">{ev.message}</p>
                    <p className="mt-0.5 text-[10px] text-text-muted">{timeAgoFromNow(ev.timestamp)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ─ Chart Panel (full width) ─────────── */}
          <motion.div variants={pop} initial="hidden" animate="show" className="card flex flex-col lg:col-span-12">
            <div className="flex items-center justify-between border-b border-edge px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: activeAccent }} />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeDs?.name}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="text-sm font-semibold"
                  >
                    {activeDs?.name ?? 'Select a dataset'}
                  </motion.span>
                </AnimatePresence>
                <span className="text-xs text-text-muted">
                  — {chartData.length} pts · markers = events (click → log)
                </span>
              </div>
              {activeDs && (
                <Link to={`/dataset/${activeDs._id}`} className="text-xs font-semibold transition-colors hover:underline" style={{ color: activeAccent }}>
                  View details →
                </Link>
              )}
            </div>
            <div className="flex-1 p-4" style={{ minHeight: 240 }}>
              {chartData.length > 0 ? (
                <TimelineChart
                  data={chartData}
                  accent={activeAccent}
                  height={240}
                  events={chartEvents}
                  gradientId="dashMainGrad"
                  onEventClick={() => navigate('/events')}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-text-muted">No snapshot data in this range</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default DashboardPage
