import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Profile from './Profile'
import Network from './Network'
import EventsTab from './EventsTab'
import ProjectsTab from './ProjectsTab'

const BASE_TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'network', label: 'Network' },
  { id: 'events', label: 'Events' }
]

export default function Home() {
  const { profile, logout } = useAuth()
  // The admin event pages (routes/Admin, routes/AdminEvent) live outside this
  // tab UI; their "back" links land here with state.initialTab so admins
  // return to the Events tab they came from instead of defaulting to Profile.
  const location = useLocation()
  const [tab, setTab] = useState(location.state?.initialTab || 'profile')
  const isWurthEmployee = profile.role === 'wurth_employee'

  const tabs = [
    ...BASE_TABS,
    ...(isWurthEmployee ? [] : [{ id: 'projects', label: 'Projects' }]),
    ...(isWurthEmployee ? [{ id: 'analysis', label: 'Analysis' }] : []),
    { id: 'simulation', label: 'Simulation' }
  ]

  return (
    <div className="shell">
      <header className="topbar">
        <p className="we-wordmark" style={{ margin: 0 }}>
          WE<span>connect</span>
        </p>

        <nav className="topbar-nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`topbar-link ${tab === t.id ? 'topbar-link-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.placeholder && <span className="topbar-tag">soon</span>}
            </button>
          ))}
        </nav>

        <div className="topbar-account">
          <span>
            <strong>{profile.name}</strong> · {profile.role}
          </span>
          <div className="avatar" aria-hidden="true">
            {initials(profile.name)}
          </div>
          <button className="link-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="main">
        {tab === 'profile' && <Profile onNavigate={setTab} />}
        {tab === 'network' && <Network />}
        {tab === 'events' && <EventsTab />}
        {tab === 'projects' && !isWurthEmployee && <ProjectsTab />}
        {tab === 'analysis' && isWurthEmployee && <AnalysisTab />}
        {tab === 'simulation' && <SimulationTab />}
      </main>
    </div>
  )
}

// The Event ROI dashboard is a standalone Next.js app (analysis-dashboard/,
// vendored from origin/analysis) — embedded by URL rather than ported into
// this Vite app, since it depends on Next's App Router/server routes and a
// separate React 19 + Tailwind v4 toolchain.
function AnalysisTab() {
  return (
    <iframe
      src="http://localhost:3000"
      title="WEconnect Event ROI Analysis"
      style={{
        width: '100%',
        height: 'calc(100vh - 160px)',
        border: 'none',
        borderRadius: '12px',
        background: 'white'
      }}
    />
  )
}

// The Innovation Simulator is a standalone Next.js app (simulation/, vendored
// from origin/simulation) — embedded by URL rather than ported into this Vite
// app, since it depends on Next's App Router/server routes (Gemini component
// selection) plus React 19 + Tailwind v4 + react-three-fiber. It runs on port
// 3001 (see simulation/package.json) so it doesn't clash with the Analysis app
// on 3000. Its root redirects to /simulation, so the iframe lands on the full
// simulator.
function SimulationTab() {
  const src = import.meta.env.VITE_SIMULATION_URL || 'http://localhost:3001'
  return (
    <iframe
      src={src}
      title="WEconnect Innovation Simulator"
      style={{
        width: '100%',
        height: 'calc(100vh - 160px)',
        border: 'none',
        borderRadius: '12px',
        background: 'white'
      }}
    />
  )
}

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}
