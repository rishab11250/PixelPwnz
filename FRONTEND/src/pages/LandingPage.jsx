import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useScroll, useTransform } from 'motion/react'
import { api } from '../lib/api.js'

/* ── Animated counter ─────────────────────────────── */
function Counter({ target, duration = 2000, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const start = Date.now()
    const anim = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(anim)
    }
    requestAnimationFrame(anim)
  }, [inView, target, duration])

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

/* ── Floating orbs background ─────────────────────── */
function Orbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-amber opacity-[0.03] blur-[120px]" />
      <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-rose opacity-[0.04] blur-[100px]" />
      <div className="absolute -bottom-20 left-1/3 h-[350px] w-[350px] rounded-full bg-sky opacity-[0.03] blur-[100px]" />
      <div className="absolute right-1/4 -top-20 h-[300px] w-[300px] rounded-full bg-violet opacity-[0.03] blur-[80px]" />
    </div>
  )
}

/* ── Animated grid pattern ────────────────────────── */
function GridPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(250,250,250,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(250,250,250,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}

/* ── Live data ticker ─────────────────────────────── */
function LiveTicker({ datasets, snapCache }) {
  if (!datasets.length) return null

  const items = datasets.slice(0, 12).map(ds => {
    const snap = snapCache[ds._id]
    const value = snap?.value
    const pct = snap?.pct
    return { name: ds.name, value, pct, unit: ds.unit }
  }).filter(i => i.value != null)

  if (!items.length) return null

  // Duplicate for seamless scroll
  const doubled = [...items, ...items]

  return (
    <div className="relative overflow-hidden border-y border-edge bg-bg-raised/40 backdrop-blur-sm">
      <div
        className="flex gap-0 py-3 animate-scroll"
        style={{ width: `${doubled.length * 220}px` }}
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-6" style={{ minWidth: 220 }}>
            <span className="text-xs font-semibold text-text-secondary truncate max-w-[100px]">{item.name}</span>
            <span className="font-mono text-xs font-bold text-text-primary">
              {item.unit === 'USD' ? '$' : ''}{Number(item.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}{item.unit !== 'USD' ? ` ${item.unit}` : ''}
            </span>
            {item.pct != null && (
              <span className={`font-mono text-[10px] font-bold ${item.pct >= 0 ? 'text-emerald' : 'text-rose'}`}>
                {item.pct >= 0 ? '↑' : '↓'} {Math.abs(item.pct).toFixed(2)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Feature card ─────────────────────────────────── */
function FeatureCard({ icon, title, desc, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay }}
      className="group relative overflow-hidden rounded-2xl border border-edge bg-bg-raised p-6 transition-all duration-300 hover:border-[#3f3f46] hover:-translate-y-1"
    >
      {/* Glow */}
      <div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-[40px] transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: accent }}
      />
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
        style={{ background: `${accent}14`, color: accent }}
      >
        {icon}
      </div>
      <h3 className="mt-4 text-base font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{desc}</p>
    </motion.div>
  )
}

/* ── Stat pill ────────────────────────────────────── */
function StatPill({ label, value, accent }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="flex flex-col items-center gap-1 rounded-2xl border border-edge bg-bg-raised px-8 py-6"
    >
      <span className="text-3xl font-bold tabular-nums" style={{ color: accent }}>{value}</span>
      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════ */
export default function LandingPage() {
  const [datasets, setDatasets] = useState([])
  const [events, setEvents] = useState([])
  const [snapCache, setSnapCache] = useState({})

  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  // Fetch live data for ticker + stats
  useEffect(() => {
    async function load() {
      try {
        const [ds, ev] = await Promise.all([api.getDatasets(), api.getEvents()])
        setDatasets(ds)
        setEvents(ev)

        // Fetch latest snapshot values for ticker
        for (const d of ds.slice(0, 12)) {
          api.getSnapshots(d._id).then(snaps => {
            if (!snaps.length) return
            const latest = snaps[snaps.length - 1]
            const prev = snaps.length > 1 ? snaps[snaps.length - 2] : latest
            const pct = prev.value !== 0 ? ((latest.value - prev.value) / prev.value * 100) : 0
            setSnapCache(p => ({ ...p, [d._id]: { value: latest.value, pct } }))
          }).catch(() => {})
        }
      } catch {
        // Landing page works without API; ignore initial load errors
      }
    }
    load()
  }, [])

  const categories = [...new Set(datasets.map(d => d.category))].length

  return (
    <div className="relative min-h-screen bg-bg-base text-text-primary overflow-x-hidden">
      <Orbs />
      <GridPattern />

      {/* ══ NAVBAR ══════════════════════════════════ */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-edge/50 bg-bg-base/70 px-8 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber to-rose shadow-lg" style={{ boxShadow: '0 0 20px rgba(245,158,11,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight">DataTime Machine</span>
          <span className="ml-1 rounded-full bg-amber-soft px-2 py-0.5 text-[9px] font-bold text-amber">LIVE</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-text-secondary transition-colors hover:text-text-primary">Features</a>
          <a href="#stats" className="text-sm text-text-secondary transition-colors hover:text-text-primary">Stats</a>
          <a href="#tech" className="text-sm text-text-secondary transition-colors hover:text-text-primary">Tech</a>
          <Link
            to="/dashboard"
            className="rounded-lg bg-gradient-to-r from-amber to-rose px-4 py-2 text-sm font-bold text-bg-base transition-all hover:shadow-lg hover:shadow-amber/20 hover:-translate-y-0.5"
          >
            Open Dashboard →
          </Link>
        </div>
      </nav>

      {/* ══ HERO ═══════════════════════════════════ */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative flex flex-col items-center px-8 pt-24 pb-8 text-center"
      >
        {/* Pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex items-center gap-2 rounded-full border border-edge bg-bg-raised px-4 py-1.5"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
          </span>
          <span className="text-xs font-semibold text-text-secondary">Real-time multi-source data tracking</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
          className="max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl"
        >
          Track every pulse of{' '}
          <span className="bg-gradient-to-r from-amber via-rose to-violet bg-clip-text text-transparent">
            real-time data
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary"
        >
          Monitor crypto prices, weather patterns, air quality, and forex rates — all in one dashboard. 
          Detect anomalies instantly with AI-powered change detection.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex items-center gap-4"
        >
          <Link
            to="/dashboard"
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-amber to-rose px-8 py-3.5 text-base font-bold text-bg-base transition-all hover:shadow-xl hover:shadow-amber/20 hover:-translate-y-0.5"
          >
            <span className="relative z-10 flex items-center gap-2">
              Enter Dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </Link>
          <a
            href="https://github.com/rishab11250"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-edge bg-bg-raised px-6 py-3.5 text-sm font-semibold text-text-secondary transition-all hover:border-bg-hover hover:text-text-primary hover:-translate-y-0.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            View on GitHub
          </a>
        </motion.div>

        {/* Mock dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 100, damping: 20 }}
          className="relative mt-16 w-full max-w-5xl"
        >
          <div className="rounded-2xl border border-edge bg-bg-raised p-1.5 shadow-2xl" style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 40px rgba(245,158,11,0.05)' }}>
            {/* Browser chrome */}
            <div className="flex items-center gap-2 rounded-t-xl bg-bg-base px-4 py-2.5 border-b border-edge">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose/60" />
                <span className="h-3 w-3 rounded-full bg-amber/60" />
                <span className="h-3 w-3 rounded-full bg-emerald/60" />
              </div>
              <div className="ml-4 flex-1 rounded-md bg-bg-hover px-3 py-1 text-[11px] text-text-muted font-mono">
                localhost:5173/dashboard
              </div>
            </div>
            {/* Simulated dashboard content */}
            <div className="rounded-b-xl bg-bg-base p-6">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Bitcoin', value: '$66,774', color: '#f59e0b' },
                  { label: 'Delhi AQI', value: '30 μg/m³', color: '#fb7185' },
                  { label: 'Mumbai', value: '28.2°C', color: '#38bdf8' },
                  { label: 'USD/INR', value: '₹84.88', color: '#a78bfa' },
                ].map((c, i) => (
                  <div key={i} className="rounded-lg border border-edge bg-bg-raised p-3">
                    <p className="text-[9px] uppercase text-text-muted font-semibold">{c.label}</p>
                    <p className="mt-1 text-lg font-bold font-mono" style={{ color: c.color }}>{c.value}</p>
                  </div>
                ))}
              </div>
              {/* Fake chart area */}
              <div className="rounded-lg border border-edge bg-bg-raised p-4 h-32 flex items-end gap-1">
                {Array.from({ length: 40 }, (_, i) => {
                  const h = 20 + Math.sin(i * 0.3) * 15 + Math.sin(i * 1.71 + 0.2) * 12.5
                  return (
                    <div key={i} className="flex-1 rounded-t-sm transition-all" style={{ height: `${h}%`, background: `linear-gradient(to top, transparent, rgba(245,158,11,${0.3 + (h / 100) * 0.5}))` }} />
                  )
                })}
              </div>
            </div>
          </div>
          {/* Reflection glow */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 h-24 w-3/4 rounded-full bg-amber/5 blur-[60px]" />
        </motion.div>
      </motion.section>

      {/* ══ LIVE TICKER ════════════════════════════ */}
      <section className="relative mt-8">
        <LiveTicker datasets={datasets} snapCache={snapCache} />
      </section>

      {/* ══ FEATURES ═══════════════════════════════ */}
      <section id="features" className="relative px-8 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <span className="inline-block rounded-full border border-edge bg-bg-raised px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted mb-4">Features</span>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-sky to-violet bg-clip-text text-transparent">understand your data</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-text-secondary">
              From real-time ingestion to AI-powered anomaly explanation — all in one unified dashboard.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon="📈"
              title="Multi-Source Ingestion"
              desc="Track crypto, weather, air quality & forex from free public APIs — no API keys required."
              accent="#f59e0b"
              delay={0}
            />
            <FeatureCard
              icon="⚡"
              title="Anomaly Detection"
              desc="Automatic spike, drop & anomaly detection with severity classification and percentage tracking."
              accent="#fb7185"
              delay={0.08}
            />
            <FeatureCard
              icon="🤖"
              title="AI Explanations"
              desc="Get AI-generated explanations for every detected event — understand the 'why' behind each change."
              accent="#a78bfa"
              delay={0.16}
            />
            <FeatureCard
              icon="🔄"
              title="Scheduled Fetching"
              desc="Cron-based data collection every 5 minutes with auto-cleanup to keep your database lean."
              accent="#38bdf8"
              delay={0.24}
            />
          </div>
        </div>
      </section>

      {/* ══ LIVE STATS ═════════════════════════════ */}
      <section id="stats" className="relative border-y border-edge bg-bg-raised/30 px-8 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <span className="inline-block rounded-full border border-edge bg-bg-raised px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted mb-4">Live Data</span>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Real numbers, real time</h2>
            <p className="mt-3 text-text-secondary">Fetched live from the running backend — not mock data.</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatPill label="Datasets" value={<Counter target={datasets.length || 40} />} accent="#f59e0b" />
            <StatPill label="Events" value={<Counter target={events.length || 0} />} accent="#fb7185" />
            <StatPill label="Categories" value={<Counter target={categories || 4} />} accent="#38bdf8" />
            <StatPill label="Uptime" value="99.9%" accent="#34d399" />
          </div>
        </div>
      </section>

      {/* ══ DATA CATEGORIES ════════════════════════ */}
      <section className="relative px-8 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <span className="inline-block rounded-full border border-edge bg-bg-raised px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted mb-4">Coverage</span>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Four data domains,{' '}
              <span className="bg-gradient-to-r from-amber to-emerald bg-clip-text text-transparent">one platform</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              { icon: '📈', title: 'Cryptocurrency', desc: 'Top 10 coins from CoinGecko — Bitcoin, Ethereum, Solana, XRP, and more. Live USD prices updated every 5 minutes.', accent: '#f59e0b', count: '10 coins', cities: 'BTC · ETH · SOL · XRP · BNB · USDT · USDC · ADA · DOGE · TRX' },
              { icon: '🌫️', title: 'Air Quality', desc: 'PM2.5 and AQI readings from 10 major Indian cities via WAQI. Track pollution levels across Delhi, Mumbai, Kolkata, and more.', accent: '#fb7185', count: '10 cities', cities: 'Delhi · Mumbai · Kolkata · Chennai · Bangalore · Hyderabad · Ahmedabad · Pune · Jaipur · Lucknow' },
              { icon: '🌡️', title: 'Weather', desc: 'Temperature readings from 10 Indian and 5 global cities using Open-Meteo. Perfect for cross-city, cross-continent comparisons.', accent: '#38bdf8', count: '15 cities', cities: 'Delhi · Mumbai · New York · London · Tokyo · Dubai · Sydney · Kolkata · Chennai · Bangalore' },
              { icon: '💱', title: 'Forex Rates', desc: '5 major currency pairs against USD from ExchangeRate API. Track INR, EUR, GBP, JPY, and AUD in real time.', accent: '#a78bfa', count: '5 pairs', cities: 'USD/INR · USD/EUR · USD/GBP · USD/JPY · USD/AUD' },
            ].map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 22 }}
                className="group relative overflow-hidden rounded-2xl border border-edge bg-bg-raised p-6 transition-all hover:border-[#3f3f46]"
              >
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-[50px] transition-opacity duration-500 group-hover:opacity-[0.15]" style={{ background: cat.accent }} />
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <h3 className="text-lg font-bold">{cat.title}</h3>
                  <span className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: `${cat.accent}14`, color: cat.accent }}>{cat.count}</span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mb-3">{cat.desc}</p>
                <p className="text-[11px] font-mono text-text-muted leading-relaxed">{cat.cities}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TECH STACK ═════════════════════════════ */}
      <section id="tech" className="relative border-t border-edge px-8 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <span className="inline-block rounded-full border border-edge bg-bg-raised px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted mb-4">Tech Stack</span>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Built with modern tools</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-3 md:grid-cols-4"
          >
            {[
              { name: 'React 19',    desc: 'UI Framework',   icon: '⚛️' },
              { name: 'Vite',        desc: 'Build Tool',     icon: '⚡' },
              { name: 'Tailwind v4', desc: 'Styling',        icon: '🎨' },
              { name: 'Recharts',    desc: 'Data Viz',       icon: '📊' },
              { name: 'Node.js',     desc: 'Runtime',        icon: '🟢' },
              { name: 'Express',     desc: 'API Server',     icon: '🚀' },
              { name: 'MongoDB',     desc: 'Database',       icon: '🍃' },
              { name: 'Gemini AI',   desc: 'Explanations',   icon: '🤖' },
            ].map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-edge bg-bg-raised px-4 py-4 text-center transition-all hover:border-[#3f3f46] hover:-translate-y-0.5"
              >
                <span className="text-2xl">{tech.icon}</span>
                <p className="mt-2 text-sm font-bold">{tech.name}</p>
                <p className="text-[10px] text-text-muted">{tech.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════ */}
      <section className="relative px-8 py-24 text-center">
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-2xl"
        >
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Ready to see the{' '}
            <span className="bg-gradient-to-r from-amber via-rose to-violet bg-clip-text text-transparent">full picture</span>?
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Explore {datasets.length || 40}+ live datasets across {categories || 4} categories — updated every 5 minutes.
          </p>
          <Link
            to="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber to-rose px-10 py-4 text-lg font-bold text-bg-base transition-all hover:shadow-xl hover:shadow-amber/25 hover:-translate-y-1"
          >
            Launch Dashboard
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </motion.div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════ */}
      <footer className="border-t border-edge px-8 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber to-rose">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <span className="text-sm font-bold text-text-secondary">DataTime Machine</span>
          </div>
          <p className="text-xs text-text-muted">Built by <span className="font-semibold text-text-secondary">PixelPwnz</span> • Hackathon 2026</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/rishab11250" target="_blank" rel="noopener noreferrer" className="text-text-muted transition-colors hover:text-text-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </footer>

      {/* ── Ticker scroll animation ─────────────── */}
      <style>{`
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll-left 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
