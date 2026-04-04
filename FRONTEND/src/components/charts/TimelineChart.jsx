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
  ReferenceLine,
} from 'recharts'

const SEV_COLOR = { high: '#fb7185', medium: '#f59e0b', low: '#38bdf8' }

/**
 * Professional trading-style timeline chart with enhanced crypto visualization
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

  // Calculate min/max for better Y-axis scaling
  const { min, max, avg } = useMemo(() => {
    if (!data.length) return { min: 0, max: 100, avg: 50 }
    const values = data.map(d => d.value)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const avgVal = values.reduce((a, b) => a + b, 0) / values.length
    const range = maxVal - minVal
    return {
      min: minVal - range * 0.1,
      max: maxVal + range * 0.1,
      avg: avgVal
    }
  }, [data])

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
    <div className="relative w-full" style={{ height: height || 240, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 12, left: 8, bottom: 12 }}>
          <defs>
            {/* Enhanced gradient with more professional look */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
              <stop offset="50%" stopColor={accent} stopOpacity={0.1} />
              <stop offset="100%" stopColor={accent} stopOpacity={0.01} />
            </linearGradient>
            {/* Glow effect gradient */}
            <radialGradient id={`${gradientId}Glow`}>
              <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </radialGradient>
          </defs>
          
          {/* Enhanced grid for trading chart look */}
          <CartesianGrid 
            stroke="rgba(255,255,255,0.02)" 
            strokeDasharray="2 4" 
            vertical={true}
            horizontal={true}
          />
          
          {/* Enhanced X-axis */}
          <XAxis
            dataKey="label"
            tick={{ fill: '#71717a', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
            axisLine={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }}
            tickLine={false}
            interval={Math.max(1, Math.floor(data.length / 8))}
          />
          
          {/* Enhanced Y-axis */}
          <YAxis 
            domain={[min, max]}
            tick={{ fill: '#71717a', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
            axisLine={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }}
            tickLine={false}
            tickFormatter={(value) => {
              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
              return value.toFixed(0)
            }}
          />
          
          {/* Enhanced area with better gradient */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
          
          {/* Enhanced main line with glow effect */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={accent}
            strokeWidth={2.5}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            strokeDasharray="0"
          />
          
          {/* Average line for trading chart feel */}
          <ReferenceLine 
            y={avg} 
            stroke="rgba(255,255,255,0.1)" 
            strokeDasharray="4 4" 
            strokeWidth={1}
          />
          
          {/* Event markers */}
          {scatter.length > 0 && (
            <Scatter
              data={scatter}
              shape={(props) => {
                const { cx, cy, payload } = props
                if (cx == null || cy == null) return null
                return (
                  <g>
                    {/* Outer glow */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={payload.z / 2 + 4}
                      fill={payload.fill}
                      fillOpacity={0.2}
                      style={{ cursor: onEventClick ? 'pointer' : 'default' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick?.(payload.ev)
                      }}
                    />
                    {/* Inner circle */}
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
                  </g>
                )
              }}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Enhanced custom tooltip */}
      {mousePos && hoveredData && (
        <div
          className="card px-3 py-2 text-xs shadow-xl pointer-events-none backdrop-blur-sm"
          style={{
            position: 'absolute',
            left: mousePos.x,
            top: mousePos.y - 60,
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(24,24,27,0.95)',
            border: `1px solid ${accent}40`,
            boxShadow: `0 4px 20px ${accent}20`
          }}
        >
          <div className="text-text-muted mb-1" style={{ fontSize: '10px' }}>
            {hoveredData.fullLabel || hoveredData.label}
          </div>
          <div className="font-mono font-bold" style={{ color: accent, fontSize: '12px' }}>
            {typeof hoveredData.value === 'number' 
              ? hoveredData.value >= 1000 
                ? `$${(hoveredData.value / 1000).toFixed(2)}k`
                : hoveredData.value.toFixed(2)
              : hoveredData.value
            }
          </div>
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
