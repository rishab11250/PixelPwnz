function DatasetCard({ name, value, percentageChange, timestamp }) {
  const isPositive = percentageChange >= 0

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-[0_20px_50px_rgba(15,23,42,0.6),0_0_30px_rgba(139,92,246,0.08)]">
      {/* Glow Effect on Hover */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/5 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            isPositive
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-rose-500/10 text-rose-400'
          }`}>
            {isPositive ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            )}
          </span>
          <h3 className="text-sm font-semibold text-slate-100">{name}</h3>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
            isPositive
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {isPositive ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(1)}%
        </span>
      </div>

      {/* Value */}
      <div className="mt-4 text-3xl font-bold tracking-tight text-white">
        {value.toLocaleString()}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
          Last updated
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          {timestamp}
        </span>
      </div>
    </article>
  )
}

export default DatasetCard
