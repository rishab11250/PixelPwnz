import { motion } from 'motion/react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { useMemo, useId } from 'react'

/** @param {number[]} values recent snapshot values (oldest → newest) */
function mapSparkline(values) {
  const ys = values.map(Number).filter((n) => !Number.isNaN(n))
  if (ys.length < 2) return null
  const lo = Math.min(...ys)
  const hi = Math.max(...ys)
  const span = hi - lo || 1
  return ys.map((y, x) => ({
    x,
    y: 8 + ((y - lo) / span) * 84,
  }))
}

function sparkDeterministic(trend = 'up', n = 14) {
  let v = 50
  return Array.from({ length: n }, (_, i) => {
    v += trend === 'up' ? Math.sin(i * 0.7) * 4 + 2 : Math.sin(i * 0.7) * 4 - 2
    v = Math.max(8, Math.min(92, v))
    return { x: i, y: Math.round(v * 10) / 10 }
  })
}

/** @param {number[]=} sparklineValues recent values (oldest → newest) for a real sparkline */
function DatasetCard({ name, value, unit, percentageChange = 0, timestamp, accent = '#f59e0b', sparklineValues }) {
  const isPositive = percentageChange >= 0
  const gid = useId().replace(/:/g, '')
  const data = useMemo(() => {
    const fromApi = Array.isArray(sparklineValues) ? mapSparkline(sparklineValues) : null
    if (fromApi?.length) return fromApi
    return sparkDeterministic(isPositive ? 'up' : 'down')
  }, [isPositive, sparklineValues])

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="card group relative flex flex-col overflow-hidden"
    >
      {/* Accent top strip */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent 10%, ${accent}50 50%, transparent 90%)` }} />

      <div className="flex flex-1 items-start justify-between p-4 pb-0">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-secondary">{name}</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</span>
            {unit && <span className="text-xs font-medium text-text-muted">{unit}</span>}
          </div>
        </div>
        <span
          className="mt-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums"
          style={{ background: isPositive ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)', color: isPositive ? '#34d399' : '#fb7185' }}
        >
          {isPositive ? '+' : ''}{percentageChange.toFixed(1)}%
        </span>
      </div>

      {/* Sparkline */}
      <div className="h-14 w-full px-1 opacity-50 transition-opacity group-hover:opacity-90" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.25} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="y" stroke={accent} strokeWidth={1.5} fill={`url(#${gid})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-edge px-4 py-2.5">
        <span className="text-[10px] text-text-muted">{timestamp}</span>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
          LIVE
        </div>
      </div>
    </motion.article>
  )
}

export default DatasetCard
