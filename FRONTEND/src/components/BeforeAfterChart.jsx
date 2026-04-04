import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { api } from '../lib/api.js'

const SEVEN_D_MS = 7 * 24 * 60 * 60 * 1000

function axisTick(iso) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}

function MiniTip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded border border-edge bg-bg-raised px-2 py-1 text-[10px] shadow-lg">
      <p className="font-mono font-bold text-text-primary">{Number(payload[0].value).toLocaleString()}</p>
      <p className="text-text-muted mt-0.5">{payload[0].payload.tick}</p>
    </div>
  )
}

function stripToChart(snaps) {
  return snaps.map((s) => ({
    tick: axisTick(s.timestamp),
    value: s.value,
  }))
}

/** Two panels: 7 calendar days before the event, and 7 days after (PRD / FRONTEND Step 15). */
export default function BeforeAfterChart({ datasetId, eventTime, color = '#f59e0b' }) {
  const [before, setBefore] = useState([])
  const [after, setAfter] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!datasetId || !eventTime) return
      const t0 = new Date(eventTime).getTime()
      const fromBefore = new Date(t0 - SEVEN_D_MS).toISOString()
      const toBefore = new Date(t0).toISOString()
      const fromAfter = toBefore
      const toAfter = new Date(t0 + SEVEN_D_MS).toISOString()
      try {
        const [bSnaps, aSnaps] = await Promise.all([
          api.getSnapshots(datasetId, fromBefore, toBefore),
          api.getSnapshots(datasetId, fromAfter, toAfter),
        ])
        setBefore(stripToChart(bSnaps))
        setAfter(stripToChart(aSnaps))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    setLoading(true)
    load()
  }, [datasetId, eventTime])

  if (loading) {
    return <div className="h-32 flex items-center justify-center text-xs text-text-muted">Loading 7d before / after…</div>
  }

  const gidB = `bac-b-${datasetId}`
  const gidA = `bac-a-${datasetId}`

  return (
    <div className="relative mt-2 group grid grid-cols-1 gap-4 md:grid-cols-2">
      <Link
        to={`/dataset/${datasetId}`}
        className="absolute top-0 right-0 z-10 rounded-md border border-edge bg-bg-raised/80 px-2 py-1 text-[10px] font-bold text-text-muted opacity-0 backdrop-blur transition-opacity hover:border-bg-hover hover:text-text-primary group-hover:opacity-100"
      >
        View Dataset →
      </Link>

      <div className="card-flat px-2 py-2">
        <span className="text-[10px] uppercase text-text-muted font-semibold">7 days before event</span>
        <div className="h-28 w-full mt-1" style={{ minWidth: 0 }}>
          {before.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={before} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gidB} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="tick" tick={{ fill: '#52525b', fontSize: 8 }} interval="preserveStartEnd" />
                <Tooltip content={<MiniTip />} />
                <ReferenceLine x={before[before.length - 1]?.tick} stroke={color} strokeDasharray="4 4" />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${gidB})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-text-muted">No data</div>
          )}
        </div>
      </div>

      <div className="card-flat px-2 py-2">
        <span className="text-[10px] uppercase text-text-muted font-semibold">7 days after event</span>
        <div className="h-28 w-full mt-1" style={{ minWidth: 0 }}>
          {after.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={after} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gidA} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="tick" tick={{ fill: '#52525b', fontSize: 8 }} interval="preserveStartEnd" />
                <Tooltip content={<MiniTip />} />
                <ReferenceLine x={after[0]?.tick} stroke={color} strokeDasharray="4 4" />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${gidA})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-text-muted">No data</div>
          )}
        </div>
      </div>
    </div>
  )
}
