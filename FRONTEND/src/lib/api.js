const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(path) {
  const res = await fetch(`${API}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  /** Earliest / latest snapshot time across all datasets (for time scrubber range). */
  getTimeBounds: () => request('/meta/time-bounds'),

  // Datasets
  getDatasets: () => request('/datasets'),
  
  // Snapshots
  getSnapshots: (datasetId, from, to) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const qs = params.toString()
    return request(`/datasets/${datasetId}/snapshots${qs ? '?' + qs : ''}`)
  },

  // Events
  getEvents: () => request('/events'),
  getDatasetEvents: (datasetId) => request(`/datasets/${datasetId}/events`),
  explainEvent: (eventId) => request(`/events/${eventId}/explain`),

  // Manual fetch
  fetchNow: (datasetId) =>
    fetch(`${API}/fetch-now/${datasetId}`, { method: 'POST' }).then(r => r.json()),

  // Export
  exportCSV: (datasetId) => `${API}/datasets/${datasetId}/export`,
}
