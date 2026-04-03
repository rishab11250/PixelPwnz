export default function Loader({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-text-muted py-20 ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-muted border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
