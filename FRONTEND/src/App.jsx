import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import DatasetPage from './pages/DatasetPage.jsx'
import EventLogPage from './pages/EventLogPage.jsx'
import MapPage from './pages/MapPage.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Navbar from './components/layout/Navbar.jsx'
import './App.css'

import { TimeMachineProvider } from './contexts/TimeMachineContext.jsx'
import TimelineSlider from './components/layout/TimelineSlider.jsx'

/* Layout wrapper that includes the sidebar */
function AppShell({ children }) {
  return (
    <TimeMachineProvider>
      <div className="flex min-h-svh bg-bg-base text-text-primary pb-20">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        <TimelineSlider />
      </div>
    </TimeMachineProvider>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page — full-width, no sidebar */}
        <Route path="/" element={<LandingPage />} />

        {/* App pages — wrapped with sidebar */}
        <Route path="/dashboard" element={<AppShell><DashboardPage /></AppShell>} />
        <Route path="/dataset/:id" element={<AppShell><DatasetPage /></AppShell>} />
        <Route path="/events" element={<AppShell><EventLogPage /></AppShell>} />
        <Route path="/map" element={<AppShell><MapPage /></AppShell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
