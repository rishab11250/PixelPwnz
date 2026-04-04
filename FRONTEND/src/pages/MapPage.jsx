import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../lib/api.js'
import { useTimeMachine } from '../contexts/TimeMachineContext.jsx'

/* ── Geographic Category config ──────────────────────── */
const CAT = {
  air_quality: { label: 'Air Quality', accent: '#fb7185', bg: 'rgba(251,113,133,0.15)', icon: '🌫️', unit: 'AQI', threshold: { good: 50, moderate: 100, poor: 150, very_poor: 200, severe: 300 } },
  weather:     { label: 'Weather', accent: '#38bdf8', bg: 'rgba(56,189,248,0.15)',  icon: '�️', unit: '°C', threshold: { cold: 10, mild: 20, warm: 30, hot: 40 } },
  pollution:   { label: 'Pollution', accent: '#a78bfa', bg: 'rgba(167,139,250,0.15)', icon: '�', unit: 'μg/m³', threshold: { low: 50, medium: 100, high: 150 } },
  radiation:   { label: 'Radiation', accent: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '☢️', unit: 'nSv/h', threshold: { normal: 100, elevated: 200, high: 500 } },
}

/* ── Indian cities coordinates ─────────────────────── */
const COORDS = {
  'delhi':       { lat: 28.6139, lon: 77.2090, population: '32M', state: 'Delhi' },
  'mumbai':      { lat: 19.0760, lon: 72.8777, population: '20M', state: 'Maharashtra' },
  'kolkata':     { lat: 22.5726, lon: 88.3639, population: '15M', state: 'West Bengal' },
  'chennai':     { lat: 13.0827, lon: 80.2707, population: '11M', state: 'Tamil Nadu' },
  'bangalore':   { lat: 12.9716, lon: 77.5946, population: '13M', state: 'Karnataka' },
  'hyderabad':   { lat: 17.3850, lon: 78.4867, population: '10M', state: 'Telangana' },
  'ahmedabad':   { lat: 23.0225, lon: 72.5714, population: '8M', state: 'Gujarat' },
  'pune':        { lat: 18.5204, lon: 73.8567, population: '7M', state: 'Maharashtra' },
  'jaipur':      { lat: 26.9124, lon: 75.7873, population: '4M', state: 'Rajasthan' },
  'lucknow':     { lat: 26.8467, lon: 80.9462, population: '3M', state: 'Uttar Pradesh' },
  'surat':       { lat: 21.1702, lon: 72.8311, population: '7M', state: 'Gujarat' },
  'kanpur':      { lat: 26.4499, lon: 80.3319, population: '3M', state: 'Uttar Pradesh' },
  'nagpur':      { lat: 21.1458, lon: 79.0882, population: '3M', state: 'Maharashtra' },
  'indore':      { lat: 22.7196, lon: 75.8577, population: '3M', state: 'Madhya Pradesh' },
  'thane':       { lat: 19.2183, lon: 72.9781, population: '2M', state: 'Maharashtra' },
  'bhopal':      { lat: 23.2599, lon: 77.4127, population: '3M', state: 'Madhya Pradesh' },
  'visakhapatnam':{ lat: 17.6868, lon: 83.2185, population: '2M', state: 'Andhra Pradesh' },
  'pimpri':      { lat: 18.6298, lon: 73.8092, population: '2M', state: 'Maharashtra' },
  'patna':       { lat: 25.5941, lon: 85.1376, population: '3M', state: 'Bihar' },
  'vadodara':    { lat: 22.3072, lon: 73.1812, population: '2M', state: 'Gujarat' },
  'ghaziabad':   { lat: 28.6692, lon: 77.4538, population: '3M', state: 'Uttar Pradesh' },
  'ludhiana':    { lat: 30.9010, lon: 75.8573, population: '2M', state: 'Punjab' },
  'agra':        { lat: 27.1767, lon: 78.0081, population: '2M', state: 'Uttar Pradesh' },
  'nashik':      { lat: 19.9975, lon: 73.7898, population: '2M', state: 'Maharashtra' },
  'faridabad':   { lat: 28.4089, lon: 77.3178, population: '2M', state: 'Haryana' },
  'meerut':      { lat: 28.9845, lon: 77.7064, population: '2M', state: 'Uttar Pradesh' },
  'rajkot':      { lat: 22.3039, lon: 70.8022, population: '2M', state: 'Gujarat' },
  'kalyan':      { lat: 19.2403, lon: 73.1305, population: '2M', state: 'Maharashtra' },
  'vasai':       { lat: 19.4912, lon: 72.8397, population: '1M', state: 'Maharashtra' },
  'varanasi':    { lat: 25.3176, lon: 82.9739, population: '4M', state: 'Uttar Pradesh' },
  'srinagar':    { lat: 34.0837, lon: 74.7973, population: '2M', state: 'Jammu & Kashmir' },
  'dhanbad':     { lat: 23.7957, lon: 86.4304, population: '1M', state: 'Jharkhand' },
  'jodhpur':     { lat: 26.2389, lon: 73.0243, population: '2M', state: 'Rajasthan' },
  'kozhikode':   { lat: 11.2588, lon: 75.7804, population: '2M', state: 'Kerala' },
  'india':       { lat: 20.5937, lon: 78.9629, population: '1.4B', state: 'Republic of India' },
}

/* ── Geographic-specific helpers ───────────────────────── */
function formatValue(v, unit, category) {
  if (v == null) return '—'
  
  // Geographic data formatting
  if (category === 'air_quality') {
    const aqi = Number(v)
    if (aqi <= 50) return `${aqi} AQI (Good)`
    if (aqi <= 100) return `${aqi} AQI (Moderate)`
    if (aqi <= 150) return `${aqi} AQI (Poor)`
    if (aqi <= 200) return `${aqi} AQI (Very Poor)`
    return `${aqi} AQI (Severe)`
  }
  
  if (category === 'weather') {
    return `${Number(v)}°C`
  }
  
  if (category === 'pollution') {
    return `${Number(v)} μg/m³`
  }
  
  if (category === 'radiation') {
    return `${Number(v)} nSv/h`
  }
  
  return `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`
}

function getSeverityColor(value, category) {
  const cat = CAT[category]
  if (!cat || !cat.threshold) return cat.accent
  
  const thresholds = cat.threshold
  const keys = Object.keys(thresholds)
  
  for (let i = keys.length - 1; i >= 0; i--) {
    if (value >= thresholds[keys[i]]) {
      if (category === 'air_quality') {
        if (i >= 3) return '#dc2626' // Severe - red
        if (i >= 2) return '#f97316' // Very Poor - orange
        if (i >= 1) return '#f59e0b' // Poor - amber
        return '#84cc16' // Good/Moderate - lime
      }
      if (category === 'weather') {
        if (value >= 40) return '#dc2626' // Hot - red
        if (value >= 30) return '#f97316' // Warm - orange
        if (value >= 20) return '#38bdf8' // Mild - blue
        return '#06b6d4' // Cold - cyan
      }
      return cat.accent
    }
  }
  
  return cat.accent
}

function getCityInfo(location) {
  const cityKey = location?.toLowerCase().replace(/, india$/i, '').trim()
  return COORDS[cityKey] || null
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/* ── Map bounds restrictor ─────────────────────────── */
function MapBounds() {
  const map = useMap()
  useEffect(() => {
    const indiaBounds = L.latLngBounds([[6, 68], [38, 97]])
    map.setMaxBounds(indiaBounds)
    map.setMinZoom(4)
    map.setMaxZoom(10)
    map.fitBounds(indiaBounds)
  }, [map])
  return null
}

/* ── Map zoom/fly component ──────────────────────── */
function FlyToMarker({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, 7, { duration: 1.2 })
  }, [center, map])
  return null
}

/* ══════════════════════════════════════════════════ */
function MapPage() {
  const { simulatedTime } = useTimeMachine()
  const [datasets, setDatasets] = useState([])
  const [allSnaps, setAllSnaps] = useState({})
  const [activeCat, setActiveCat] = useState('all')
  const [selectedDs, setSelectedDs] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sideSearch, setSideSearch] = useState('')
  const [mapEvents, setMapEvents] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const [ds, evs] = await Promise.all([api.getDatasets(), api.getEvents()])
        // Filter only geographic datasets
        const geographicCategories = ['air_quality', 'weather', 'pollution', 'radiation']
        const filteredDs = ds.filter(d => geographicCategories.includes(d.category))
        setDatasets(filteredDs)
        setMapEvents(evs.filter(e => geographicCategories.includes(e.dataset_id?.category)))
        setLoading(false)
      } catch (err) {
        console.error('Map load failed:', err)
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!datasets.length) return
    let cancelled = false
    const t = setTimeout(async () => {
      const toIso = new Date(simulatedTime).toISOString()
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
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [datasets, simulatedTime])

  const geoEvents = useMemo(() => {
    return mapEvents
      .filter((e) => new Date(e.timestamp).getTime() <= simulatedTime)
      .map((ev) => {
        const ds = datasets.find(
          (d) => d._id === ev.dataset_id || String(d._id) === String(ev.dataset_id),
        )
        if (!ds) return null
        const loc = ds.location?.toLowerCase().replace(/, india$/i, '').trim()
        const coords = COORDS[loc]
        if (!coords) return null
        return { ev, ds, coords }
      })
      .filter(Boolean)
  }, [mapEvents, datasets, simulatedTime])

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

  // Datasets that have geo coordinates
  const geoDatasets = useMemo(() => {
    return datasets.filter(ds => {
      const loc = ds.location?.toLowerCase().replace(/, india$/i, '').trim()
      return loc && COORDS[loc]
    }).map(ds => {
      const loc = ds.location?.toLowerCase().replace(/, india$/i, '').trim()
      const coords = COORDS[loc]
      return { ...ds, coords }
    })
  }, [datasets])

  // Category counts
  const categories = useMemo(() => {
    const cats = {}
    datasets.forEach(d => {
      if (!cats[d.category]) cats[d.category] = []
      cats[d.category].push(d)
    })
    return cats
  }, [datasets])

  // Filtered geo datasets for map
  const filteredGeo = useMemo(() => {
    if (activeCat === 'all') return geoDatasets
    return geoDatasets.filter(d => d.category === activeCat)
  }, [geoDatasets, activeCat])

  // Filtered datasets for sidebar
  const sidebarDatasets = useMemo(() => {
    let list = activeCat === 'all' ? datasets : datasets.filter(d => d.category === activeCat)
    if (sideSearch.trim()) {
      const q = sideSearch.toLowerCase()
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.location?.toLowerCase().includes(q))
    }
    return list
  }, [datasets, activeCat, sideSearch])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-40">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-muted border-t-transparent" />
          <span className="text-sm">Loading map data…</span>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">

      {/* ── Toolbar (primary title in Navbar) ───────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-edge px-8 py-4">
        <p className="text-sm text-text-secondary">
          <span className="font-mono text-text-primary">{filteredGeo.length}</span> markers on map ·{' '}
          <span className="font-mono text-text-primary">{datasets.length}</span> datasets total
        </p>
        <Link to="/dashboard" className="rounded-lg border border-edge bg-bg-raised px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-bg-hover hover:text-text-primary">
          ← Dashboard
        </Link>
      </header>

      {/* ── Category Filter Bar ──────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-edge px-8 py-3 shrink-0">
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
                background: active ? cfg.bg : 'transparent',
                color: active ? cfg.accent : '#71717a',
              }}
            >
              {cfg.icon} {cfg.label} <span className="ml-1 font-mono opacity-60">{count}</span>
            </button>
          )
        })}

        <div className="ml-auto flex items-center gap-2 text-[10px] text-text-muted">
          {Object.entries(CAT).map(([k, cfg]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: cfg.accent }} />
                {cfg.label}
              </span>
            ))}
        </div>
      </div>

      {/* ── Main content: Map + Sidebar ───────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Leaflet Map ─────────────────────── */}
        <div className="flex-1 relative">
          <MapContainer
            center={[22, 78]}
            zoom={5}
            minZoom={4}
            maxZoom={10}
            zoomControl={false}
            className="h-full w-full"
            style={{ background: '#09090b' }}
            bounds={[[6, 68], [38, 97]]}
            maxBounds={[[6, 68], [38, 97]]}
            maxBoundsViscosity={1.0}
          >
            {/* Map bounds restrictor */}
            <MapBounds />
            {/* CartoDB Dark Matter tiles */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              subdomains="abcd"
            />

            {flyTarget && <FlyToMarker center={flyTarget} />}

            {/* Data markers */}
            {filteredGeo.map(ds => {
              const cat = CAT[ds.category] || { accent: '#a78bfa' }
              const snap = snapCache[ds._id]
              const isSelected = selectedDs === ds._id
              const cityInfo = getCityInfo(ds.location)
              const severityColor = snap ? getSeverityColor(snap.value, ds.category) : cat.accent
              
              return (
                <CircleMarker
                  key={ds._id}
                  center={[ds.coords.lat, ds.coords.lon]}
                  radius={isSelected ? 10 : 7}
                  pathOptions={{
                    color: severityColor,
                    fillColor: severityColor,
                    fillOpacity: isSelected ? 0.9 : 0.6,
                    weight: isSelected ? 3 : 2,
                    opacity: 0.8,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedDs(ds._id)
                      setFlyTarget([ds.coords.lat, ds.coords.lon])
                    },
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", minWidth: 280 }}>
                      <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: severityColor, display: 'inline-block' }} />
                        <strong style={{ fontSize: 14, color: '#fafafa' }}>{ds.name}</strong>
                      </div>
                      <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 6 }}>
                        {ds.source_api} • {ds.location}
                      </div>
                      {cityInfo && (
                        <div style={{ fontSize: 10, color: '#52525b', marginBottom: 8 }}>
                          📍 {cityInfo.state} • Pop: {cityInfo.population}
                        </div>
                      )}
                      
                      {/* Environmental Data Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        {(() => {
                          const locationData = datasets.filter(d => {
                            const loc = d.location?.toLowerCase().replace(/, india$/i, '').trim()
                            return loc === ds.location?.toLowerCase().replace(/, india$/i, '').trim()
                          })
                          
                          return locationData.map(dataset => {
                            const snap = snapCache[dataset._id]
                            const cat = CAT[dataset.category]
                            const value = snap ? getSeverityColor(snap.value, dataset.category) : cat.accent
                            
                            return (
                              <div key={dataset._id} style={{ 
                                background: 'rgba(255,255,255,0.02)', 
                                padding: 6, 
                                borderRadius: 6,
                                border: `1px solid ${value}20`
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                  <span style={{ fontSize: 12 }}>{cat.icon}</span>
                                  <span style={{ fontSize: 10, color: '#a1a1aa', fontWeight: 600 }}>
                                    {cat.label}
                                  </span>
                                </div>
                                <div style={{ 
                                  fontFamily: "'JetBrains Mono', monospace", 
                                  fontSize: 12, 
                                  fontWeight: 700, 
                                  color: value 
                                }}>
                                  {snap ? formatValue(snap.value, dataset.unit, dataset.category) : '—'}
                                </div>
                                {snap?.pct != null && (
                                  <div style={{ 
                                    fontFamily: "'JetBrains Mono', monospace", 
                                    fontSize: 9, 
                                    fontWeight: 600,
                                    color: snap.pct >= 0 ? '#34d399' : '#fb7185',
                                  }}>
                                    {snap.pct >= 0 ? '+' : ''}{snap.pct}%
                                  </div>
                                )}
                              </div>
                            )
                          })
                        })()}
                      </div>
                      
                      {/* Additional Environmental Info */}
                      {(() => {
                        const locationData = datasets.filter(d => {
                          const loc = d.location?.toLowerCase().replace(/, india$/i, '').trim()
                          return loc === ds.location?.toLowerCase().replace(/, india$/i, '').trim()
                        })
                        
                        const hasWeather = locationData.some(d => d.category === 'weather')
                        const hasAQI = locationData.some(d => d.category === 'air_quality')
                        
                        if (hasWeather || hasAQI) {
                          return (
                            <div style={{ 
                              background: 'rgba(255,255,255,0.03)', 
                              padding: 8, 
                              borderRadius: 6,
                              marginTop: 6 
                            }}>
                              <div style={{ fontSize: 10, color: '#52525b', marginBottom: 4, fontWeight: 600 }}>
                                🌍 Environmental Summary
                              </div>
                              <div style={{ fontSize: 9, color: '#71717a', lineHeight: 1.4 }}>
                                {hasWeather && (() => {
                                  const weatherData = locationData.find(d => d.category === 'weather')
                                  const snap = snapCache[weatherData?._id]
                                  return snap ? `Temperature: ${snap.value}°C` : ''
                                })()}
                                {hasWeather && hasAQI && ' • '}
                                {hasAQI && (() => {
                                  const aqiData = locationData.find(d => d.category === 'air_quality')
                                  const snap = snapCache[aqiData?._id]
                                  if (snap) {
                                    const aqi = snap.value
                                    let status = 'Good'
                                    if (aqi > 300) status = 'Severe'
                                    else if (aqi > 200) status = 'Very Poor'
                                    else if (aqi > 150) status = 'Poor'
                                    else if (aqi > 100) status = 'Moderate'
                                    return `Air Quality: ${status}`
                                  }
                                  return ''
                                })()}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}
                      
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #27272a' }}>
                        <Link
                          to={`/dataset/${ds._id}`}
                          style={{ 
                            display:'inline-block', 
                            fontSize: 11, 
                            color: severityColor, 
                            textDecoration: 'none', 
                            fontWeight: 600,
                            background: `${severityColor}10`,
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: `1px solid ${severityColor}30`
                          }}
                        >
                          View Full Details →
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}

            {/* Event markers (same cities — anomaly popups) */}
            {geoEvents.map(({ ev, ds, coords }) => (
              <CircleMarker
                key={`evt-${ev._id}`}
                center={[coords.lat, coords.lon]}
                radius={5}
                pathOptions={{
                  color: '#fb7185',
                  fillColor: '#fb7185',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", minWidth: 160 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#fb7185', marginBottom: 4 }}>⚡ Event</div>
                    <div style={{ fontSize: 12, color: '#fafafa', marginBottom: 4 }}>{ds.name}</div>
                    <div style={{ fontSize: 11, color: '#a1a1aa' }}>{ev.message}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, marginTop: 6, color: '#f59e0b' }}>
                      {ev.percentage_change >= 0 ? '+' : ''}{ev.percentage_change}%
                    </div>
                    <div style={{ fontSize: 10, color: '#52525b', marginTop: 4 }}>
                      {new Date(ev.timestamp).toLocaleString()}
                    </div>
                    <Link
                      to="/events"
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        fontSize: 11,
                        color: '#38bdf8',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Event log →
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Floating info overlay */}
          <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
            <span className="pointer-events-auto rounded-lg bg-bg-base/90 backdrop-blur-sm border border-edge px-3 py-2 text-xs font-semibold text-text-secondary shadow-lg">
              🗺️ {filteredGeo.length} datasets · {geoEvents.length} events
            </span>
          </div>
        </div>

        {/* ── Side Panel ──────────────────────── */}
        <div className="w-80 shrink-0 border-l border-edge flex flex-col bg-bg-raised/50">
          {/* Search */}
          <div className="border-b border-edge px-4 py-3">
            <div className="flex items-center gap-2 rounded-lg border border-edge bg-bg-base px-3 py-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                value={sideSearch}
                onChange={e => setSideSearch(e.target.value)}
                placeholder="Filter datasets…"
                className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none"
              />
              {sideSearch && (
                <button onClick={() => setSideSearch('')} className="text-text-muted hover:text-text-primary text-xs">✕</button>
              )}
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-edge-subtle px-4 py-2.5">
            <span className="text-xs font-semibold text-text-secondary">Datasets</span>
            <span className="rounded-full bg-bg-hover px-2 py-0.5 text-[10px] font-mono text-text-muted">{sidebarDatasets.length}</span>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {sidebarDatasets.map(ds => {
              const cat = CAT[ds.category] || { label: ds.category, accent: '#a78bfa', icon: '•' }
              const snap = snapCache[ds._id]
              const isSelected = selectedDs === ds._id
              const locKey = ds.location?.toLowerCase().replace(/, india$/i, '').trim()
              const hasCoords = Boolean(locKey && COORDS[locKey])

              return (
                <div
                  key={ds._id}
                  className={`flex items-center gap-3 px-4 py-2.5 border-b border-edge-subtle cursor-pointer transition-colors text-sm ${
                    isSelected ? 'bg-bg-hover/80' : 'hover:bg-bg-hover/40'
                  }`}
                  onClick={() => {
                    setSelectedDs(ds._id)
                    const loc = ds.location?.toLowerCase().replace(/, india$/i, '').trim()
                    if (loc && COORDS[loc]) {
                      setFlyTarget([COORDS[loc].lat, COORDS[loc].lon])
                    }
                  }}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: cat.accent, boxShadow: isSelected ? `0 0 6px ${cat.accent}60` : 'none' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-semibold text-text-primary">{ds.name}</p>
                    <p className="text-[10px] text-text-muted flex items-center gap-1">
                      {hasCoords && <span title="Has map marker">📍</span>}
                      {ds.location || 'Global'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs text-text-secondary">
                      {snap ? formatValue(snap.value, ds.unit) : '—'}
                    </p>
                    {snap?.pct != null && (
                      <p className={`font-mono text-[10px] font-bold ${snap.pct >= 0 ? 'text-emerald' : 'text-rose'}`}>
                        {snap.pct >= 0 ? '+' : ''}{snap.pct}%
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Selected Dataset Detail Bar ───────── */}
      <AnimatePresence>
        {selectedDs && (() => {
          const ds = datasets.find(d => d._id === selectedDs)
          if (!ds) return null
          const cat = CAT[ds.category] || { label: ds.category, accent: '#a78bfa' }
          const snap = snapCache[ds._id]
          return (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-edge shrink-0"
            >
              <div className="flex items-center justify-between px-8 py-3.5" style={{ background: `${cat.accent}08` }}>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: cat.accent, boxShadow: `0 0 10px ${cat.accent}40` }} />
                  <div>
                    <p className="text-sm font-bold">{ds.name}</p>
                    <p className="text-[11px] text-text-muted">{ds.source_api} • {ds.location || 'Global'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-text-muted font-semibold tracking-wider">Current</p>
                    <p className="font-mono text-lg font-bold" style={{ color: cat.accent }}>
                      {snap ? formatValue(snap.value, ds.unit) : '—'}
                    </p>
                  </div>
                  {snap?.pct != null && (
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-text-muted font-semibold tracking-wider">Change</p>
                      <p className={`font-mono text-lg font-bold ${snap.pct >= 0 ? 'text-emerald' : 'text-rose'}`}>
                        {snap.pct >= 0 ? '+' : ''}{snap.pct}%
                      </p>
                    </div>
                  )}
                  {snap?.ts && (
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-text-muted font-semibold tracking-wider">Updated</p>
                      <p className="text-sm font-semibold text-text-secondary">{timeAgo(snap.ts)}</p>
                    </div>
                  )}
                  <Link
                    to={`/dataset/${ds._id}`}
                    className="rounded-lg border border-edge bg-bg-raised px-4 py-2 text-xs font-semibold transition-all hover:border-bg-hover"
                    style={{ color: cat.accent }}
                  >
                    View Details →
                  </Link>
                  <button
                    onClick={() => setSelectedDs(null)}
                    className="rounded-lg border border-edge bg-bg-raised px-2.5 py-2 text-xs text-text-muted transition-colors hover:border-bg-hover hover:text-text-primary"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </motion.div>
  )
}

export default MapPage
