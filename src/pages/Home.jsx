import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Profile from './Profile'
import Network from './Network'
import ConnectionsMap from './ConnectionsMap'

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'network', label: 'Network' },
  { id: 'analysis', label: 'Analysis', placeholder: true },
  { id: 'simulation', label: 'Simulation', placeholder: true }
]

export default function Home() {
  const { profile, logout } = useAuth()
  const [tab, setTab] = useState('profile')
  const tabs =
    profile.role === 'admin' ? [...TABS, { id: 'connections-map', label: 'Connections Map' }] : TABS

  return (
    <div className="shell">
      <aside className="rail">
        <div className="node-mark node-mark-small" aria-hidden="true">
          <svg viewBox="0 0 120 60" width="48" height="24">
            <line x1="20" y1="40" x2="60" y2="14" className="edge" />
            <line x1="60" y1="14" x2="100" y2="36" className="edge" />
            <circle cx="20" cy="40" r="5" className="node" />
            <circle cx="60" cy="14" r="6" className="node node-accent" />
            <circle cx="100" cy="36" r="5" className="node" />
          </svg>
        </div>

        <nav className="rail-nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`rail-link ${tab === t.id ? 'rail-link-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.placeholder && <span className="rail-tag">soon</span>}
            </button>
          ))}
        </nav>

        <div className="rail-foot">
          <p className="rail-name">{profile.name}</p>
          <p className="rail-role">{profile.role}</p>
          <button className="link-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main">
        {tab === 'profile' && <Profile />}
        {tab === 'network' && <Network />}
        {tab === 'connections-map' && <ConnectionsMap />}
        {tab === 'analysis' && <Placeholder name="Analysis" />}
        {tab === 'simulation' && <Placeholder name="Simulation" />}
      </main>
    </div>
  )
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
