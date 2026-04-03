import { useMemo } from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Scatter,
} from 'recharts'

const SEV_COLOR = { high: '#fb7185', medium: '#f59e0b', low: '#38bdf8' }

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="card px-3 py-2 text-xs shadow-xl">
      <p className="text-text-muted">{label ?? p?.payload?.fullLabel}</p>
      <p className="font-mono font-bold text-amber">{p?.value}</p>
    </div>
  )
}

/**
 * Line + area timeline with optional event markers (clickable dots).
 * @param {Array<{ label: string, value: number, fullTs?: string, fullLabel?: string }>} data
 * @param {Array<{ _id: string, timestamp: string, severity: string, type?: string, percentage_change?: number }>} events
 */
export default function TimelineChart({
  data = [],
  accent = '#f59e0b',
  height = 240,
  events = [],
  onEventClick,
  gradientId = 'tlGrad',
}) {
  const scatter = useMemo(() => {
    if (!data.length || !events.length) return []
    return events.map((ev) => {
      const tEv = new Date(ev.timestamp).getTime()
      let best = data[0]
      let bestDiff = Infinity
      for (const d of data) {
        if (!d.fullTs) continue
        const diff = Math.abs(new Date(d.fullTs).getTime() - tEv)
        if (diff < bestDiff) {
          bestDiff = diff
          best = d
        }
      }
      if (!best) return null
      const size = ev.severity === 'high' ? 8 : ev.severity === 'medium' ? 6 : 5
      return {
        label: best.label,
        value: best.value,
        fullTs: best.fullTs,
        z: size,
        fill: SEV_COLOR[ev.severity] || '#a1a1aa',
        ev,
      }
    }).filter(Boolean)
  }, [data, events])

  if (!data.length) return null

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.15} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#52525b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={Math.max(1, Math.floor(data.length / 10))}
        />
        <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="none"
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={accent}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: accent, stroke: '#09090b', strokeWidth: 2 }}
          isAnimationActive={false}
        />
        {scatter.length > 0 && (
          <Scatter
            data={scatter}
            shape={(props) => {
              const { cx, cy, payload } = props
              if (cx == null || cy == null) return null
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={payload.z / 2 + 2}
                  fill={payload.fill}
                  stroke="#09090b"
                  strokeWidth={2}
                  style={{ cursor: onEventClick ? 'pointer' : 'default' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick?.(payload.ev)
                  }}
                />
              )
            }}
            isAnimationActive={false}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
