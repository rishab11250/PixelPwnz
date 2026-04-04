/** @param {string|number|Date} iso */
export function timeAgoFromNow(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/** @param {number} simulatedMs "now" for relative times */
export function timeAgoRelative(iso, simulatedMs) {
  const diff = simulatedMs - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function formatValueDisplay(v, unit, metadata = null) {
  if (v == null || v === '—') return '—'
  if (unit === 'USD') {
    // For crypto, show INR by default since user wants INR values
    if (metadata?.category === 'crypto' && metadata?.inr) {
      return `₹${Number(metadata.inr).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    }
    return `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  }
  if (unit === 'INR') return `₹${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (['EUR', 'GBP', 'JPY', 'AUD', 'USDC'].includes(unit))
    return `${Number(v).toFixed(4)} ${unit}`
  return `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`
}

export function formatShortDateTime(iso) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
