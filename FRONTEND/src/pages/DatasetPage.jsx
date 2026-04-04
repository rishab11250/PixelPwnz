import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../lib/api.js'
import { useTimeMachine } from '../contexts/TimeMachineContext.jsx'
import TimelineChart from '../components/charts/TimelineChart.jsx'
import Loader from '../components/ui/Loader.jsx'

const TEN_D_MS = 10 * 24 * 60 * 60 * 1000

/* ── Accent map by category ───────────────────────── */
const ACCENT = {
  crypto:      '#f59e0b',
  air_quality: '#fb7185',
  weather:     '#38bdf8',
  forex:       '#a78bfa',
}

const SEV_COLOR = {
  high:   '#fb7185',
  medium: '#f59e0b',
  low:    '#38bdf8',
}

const TYPE_ICON = {
  spike:   '↑',
  drop:    '↓',
  anomaly: '⚡',
}

/* ── Helpers ──────────────────────────────────────── */
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/* ── Animation ────────────────────────────────────── */
const pop = { hidden: { opacity: 0, y: 12, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }

/* ── Custom chart tooltip ─────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs shadow-xl">
      <p className="text-text-muted">{label}</p>
      <p className="font-mono font-bold text-amber">{payload[0].value}</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════ */
function DatasetPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { minTime, simulatedTime } = useTimeMachine()
  const [dataset, setDataset] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchingNow, setFetchingNow] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const fromMs = Math.max(minTime, simulatedTime - TEN_D_MS)
        const fromIso = new Date(fromMs).toISOString()
        const toIso = new Date(simulatedTime).toISOString()
        const [allDs, snaps, evs] = await Promise.all([
          api.getDatasets(),
          api.getSnapshots(id, fromIso, toIso),
          api.getDatasetEvents(id),
        ])
        const ds = allDs.find(d => d._id === id)
        setDataset(ds || null)
        setSnapshots(snaps)
        setEvents(evs)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load dataset:', err)
        setLoading(false)
      }
    }
    load()
  }, [id, minTime, simulatedTime])

  // Handle manual fetch
  async function handleFetchNow() {
    setFetchingNow(true)
    try {
      await api.fetchNow(id)
      const fromMs = Math.max(minTime, simulatedTime - TEN_D_MS)
      const fromIso = new Date(fromMs).toISOString()
      const toIso = new Date(simulatedTime).toISOString()
      const [snaps, evs] = await Promise.all([
        api.getSnapshots(id, fromIso, toIso),
        api.getDatasetEvents(id),
      ])
      setSnapshots(snaps)
      setEvents(evs)
    } catch (err) {
      console.error('Manual fetch failed:', err)
    }
    setFetchingNow(false)
  }

  // Sliced data based on time machine
  const slicedSnapshots = useMemo(() => {
    return snapshots.filter(s => new Date(s.timestamp).getTime() <= simulatedTime)
  }, [snapshots, simulatedTime])

  // Chart data
  const timelineData = useMemo(() => {
    return slicedSnapshots.map((s) => ({
      label: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullLabel: new Date(s.timestamp).toLocaleString(),
      value: s.value,
      fullTs: s.timestamp,
    }))
  }, [slicedSnapshots])

  const timelineEvents = useMemo(() => {
    return events.filter(
      (e) =>
        ['high', 'medium', 'low'].includes(e.severity) &&
        new Date(e.timestamp).getTime() <= simulatedTime,
    )
  }, [events, simulatedTime])

  // Distribution data (histogram of values)
  const distData = useMemo(() => {
    if (slicedSnapshots.length < 2) return []
    const values = slicedSnapshots.map(s => s.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const bucketCount = Math.min(12, Math.max(4, Math.floor(slicedSnapshots.length / 5)))
    const step = (max - min) / bucketCount || 1
    const buckets = Array(bucketCount).fill(0)
    values.forEach(v => {
      const idx = Math.min(Math.floor((v - min) / step), bucketCount - 1)
      buckets[idx]++
    })
    return buckets.map((count, i) => ({
      range: `${(min + i * step).toFixed(0)}`,
      count
    }))
  }, [slicedSnapshots])

  // Stats computed from sliced snapshots
  const stats = useMemo(() => {
    if (slicedSnapshots.length === 0) return { current: '—', change: 0, total: 0, anomalies: 0 }
    const latest = slicedSnapshots[slicedSnapshots.length - 1]
    const prev = slicedSnapshots.length > 1 ? slicedSnapshots[slicedSnapshots.length - 2] : latest
    const pct = prev.value !== 0 ? ((latest.value - prev.value) / prev.value) * 100 : 0

    const cutoffDate = new Date(latest.timestamp)

    const anomalies = events.filter(ev => ev.severity === 'high' && new Date(ev.timestamp) <= cutoffDate).length

    return { current: latest.value, change: pct, total: slicedSnapshots.length, anomalies }
  }, [slicedSnapshots, events])

  const accent = dataset ? (ACCENT[dataset.category] || '#a78bfa') : '#a78bfa'

  if (loading) return <Loader label="Loading dataset…" className="py-40" />

  if (!dataset) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-40 gap-4">
        <p className="text-text-muted text-sm">Dataset not found</p>
        <Link to="/dashboard" className="rounded-lg border border-edge bg-bg-raised px-3 py-1.5 text-xs text-text-muted hover:border-bg-hover">← Back to Dashboard</Link>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-0">

      {/* ── Header ────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-edge px-8 py-5">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="rounded-lg border border-edge bg-bg-raised px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-bg-hover">←</Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}40` }} />
              <h1 className="text-lg font-bold tracking-tight">{dataset.name}</h1>
            </div>
            <p className="mt-0.5 text-sm text-text-secondary">{dataset.source_api} • {dataset.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFetchNow}
            disabled={fetchingNow}
            className="rounded-lg border border-edge bg-bg-raised px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:border-bg-hover disabled:opacity-40"
          >
            {fetchingNow ? 'Fetching…' : '⟳ Fetch Now'}
          </button>
          <a
            href={api.exportCSV(id)}
            className="rounded-lg border border-edge bg-bg-raised px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:border-bg-hover"
          >
            ↓ Export CSV
          </a>
        </div>
      </header>

      <div className="px-8 py-6 flex flex-col gap-6">

        {/* ── Stat Cards ──────────────────────── */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Current Value', val: typeof stats.current === 'number' ? stats.current.toLocaleString() : stats.current, unit: dataset.unit, accent },
            { label: '24h Change',    val: `${stats.change >= 0 ? '+' : ''}${stats.change}%`, unit: '', accent: stats.change >= 0 ? '#34d399' : '#fb7185' },
            { label: 'Total Snapshots', val: String(stats.total), unit: 'records', accent: '#38bdf8' },
            { label: 'Critical Events', val: String(stats.anomalies), unit: 'detected', accent: '#fb7185' },
          ].map(s => (
            <motion.div key={s.label} variants={pop} className="card px-4 py-3.5 flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{s.label}</span>
              <span className="text-xl font-bold tabular-nums" style={{ color: s.accent }}>{s.val}</span>
              <span className="text-[10px] text-text-muted">{s.unit}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Bento Grid: Timeline + Distribution */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Timeline chart */}
          <motion.div variants={pop} initial="hidden" animate="show" className="card flex flex-col lg:col-span-8">
            <div className="flex items-center justify-between border-b border-edge px-5 py-3.5">
              <span className="text-sm font-semibold">Timeline</span>
              <span className="text-xs text-text-muted">{snapshots.length} data points</span>
            </div>
            <div className="flex-1 p-4" style={{ minHeight: 280 }}>
              {timelineData.length > 0 ? (
                <TimelineChart
                  data={timelineData}
                  accent={accent}
                  height={280}
                  events={timelineEvents}
                  gradientId="dsTimelineGrad"
                  onEventClick={() => navigate('/events')}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-text-muted">No snapshot data in range — use Fetch Now</div>
              )}
            </div>
          </motion.div>

          {/* Distribution histogram */}
          <motion.div variants={pop} initial="hidden" animate="show" className="card flex flex-col lg:col-span-4">
            <div className="flex items-center justify-between border-b border-edge px-5 py-3.5">
              <span className="text-sm font-semibold">Distribution</span>
            </div>
            <div className="flex-1 p-4" style={{ minHeight: 280, minWidth: 0 }}>
              {distData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="range" tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="count" fill={accent} radius={[4, 4, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-text-muted">Not enough data</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Recent Events ───────────────────── */}
        <motion.div variants={pop} initial="hidden" animate="show" className="card">
          <div className="flex items-center justify-between border-b border-edge px-5 py-3.5">
            <span className="text-sm font-semibold">Recent Events</span>
            <Link to="/events" className="text-xs font-semibold" style={{ color: accent }}>View all →</Link>
          </div>
          <div className="divide-y divide-edge-subtle">
            {events.length === 0 && (
              <div className="flex items-center justify-center py-12 text-sm text-text-muted">No events detected yet</div>
            )}
            {events.map(ev => {
              const sev = SEV_COLOR[ev.severity] || '#52525b'
              return (
                <div key={ev._id} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-bg-hover/40">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: sev, boxShadow: `0 0 6px ${sev}40` }} />
                  <span className="text-sm">{TYPE_ICON[ev.type] || '•'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs text-text-primary">{ev.message}</p>
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color: ev.percentage_change >= 0 ? '#34d399' : '#fb7185' }}>
                    {ev.percentage_change >= 0 ? '+' : ''}{ev.percentage_change}%
                  </span>
                  <span className="text-[10px] text-text-muted whitespace-nowrap">{timeAgo(ev.timestamp)}</span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Dataset metadata ─────────────────── */}
        <motion.div variants={pop} initial="hidden" animate="show" className="card px-5 py-4 flex flex-wrap gap-6">
          {[
            { label: 'Category', value: dataset.category },
            { label: 'Source', value: dataset.source_api },
            { label: 'Location', value: dataset.location },
            { label: 'Unit', value: dataset.unit },
            { label: 'Fetch Interval', value: `${dataset.fetch_interval_minutes}m` },
            { label: 'Created', value: new Date(dataset.createdAt).toLocaleDateString() },
          ].map(m => (
            <div key={m.label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{m.label}</span>
              <span className="text-xs text-text-secondary font-mono">{m.value}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default DatasetPage
