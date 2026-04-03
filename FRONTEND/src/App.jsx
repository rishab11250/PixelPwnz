import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage.jsx'
import DatasetPage from './pages/DatasetPage.jsx'
import EventLogPage from './pages/EventLogPage.jsx'
import MapPage from './pages/MapPage.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Navbar from './components/layout/Navbar.jsx'
import './App.css'

function App() {
  return (
    <Router>
      <div className="grid min-h-svh grid-cols-[260px_minmax(0,1fr)] bg-surface text-slate-100">
        <Sidebar />

        <div className="flex min-h-svh flex-col border-l border-slate-800/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950">
          <Navbar />
          <main className="flex-1 overflow-y-auto px-6 pb-8 pt-6 md:px-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dataset/:id" element={<DatasetPage />} />
              <Route path="/events" element={<EventLogPage />} />
              <Route path="/map" element={<MapPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App
