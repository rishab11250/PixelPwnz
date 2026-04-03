import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage.jsx'
import DatasetPage from './pages/DatasetPage.jsx'
import EventLogPage from './pages/EventLogPage.jsx'
import MapPage from './pages/MapPage.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import './App.css'

function App() {
  return (
    <Router>
      <div className="flex min-h-svh bg-bg-base text-text-primary">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dataset/:id" element={<DatasetPage />} />
            <Route path="/events" element={<EventLogPage />} />
            <Route path="/map" element={<MapPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
