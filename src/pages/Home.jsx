import { useState } from 'react'
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
  const [tab, setTab] = useState('profile')
  const isWurthEmployee = profile.role === 'wurth_employee'

  const tabs = [
    ...BASE_TABS,
    ...(isWurthEmployee ? [] : [{ id: 'projects', label: 'Projects' }]),
    ...(isWurthEmployee ? [{ id: 'analysis', label: 'Analysis', placeholder: true }] : [])
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
        {tab === 'analysis' && <Placeholder name="Analysis" />}
      </main>
    </div>
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

function Placeholder({ name }) {
  return (
    <div className="placeholder">
      <p className="eyebrow">{name} module</p>
      <h2>This part is being built by a teammate.</h2>
      <p className="subtitle">
        Once their branch merges, swap this component out in <code>Home.jsx</code> for theirs.
      </p>
    </div>
  )
}
