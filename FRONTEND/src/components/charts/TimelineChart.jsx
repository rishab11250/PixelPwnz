import { useMemo, useState, useCallback } from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Scatter,
} from 'recharts'

const SEV_COLOR = { high: '#fb7185', medium: '#f59e0b', low: '#38bdf8' }

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
  const [mousePos, setMousePos] = useState(null)
  const [hoveredData, setHoveredData] = useState(null)

  const handleMouseMove = useCallback((e) => {
    if (!e) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Find the closest data point
    const chartWidth = rect.width - 64 // Account for margins
    const dataIndex = Math.floor((x / chartWidth) * data.length)
    const closestData = data[Math.min(dataIndex, data.length - 1)]
    
    setMousePos({ x, y })
    setHoveredData(closestData)
  }, [data])

  const handleMouseLeave = useCallback(() => {
    setMousePos(null)
    setHoveredData(null)
  }, [])

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
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
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
            activeDot={false}
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
      
      {/* Custom tooltip overlay */}
      {mousePos && hoveredData && (
        <div
          className="card px-3 py-2 text-xs shadow-xl pointer-events-none"
          style={{
            position: 'absolute',
            left: mousePos.x,
            top: mousePos.y - 50,
            transform: 'translateX(-50%)',
            zIndex: 1000,
          }}
        >
          <p className="text-text-muted">{hoveredData.fullLabel || hoveredData.label}</p>
          <p className="font-mono font-bold text-amber">{hoveredData.value}</p>
        </div>
      )}
      
      {/* Mouse tracking overlay */}
      <div
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  )
}
