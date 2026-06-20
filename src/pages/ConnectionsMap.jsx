import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const SIZE = 560
const CENTER = SIZE / 2
const RADIUS = SIZE / 2 - 60

export default function ConnectionsMap() {
  const [profiles, setProfiles] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: allProfiles }, { data: allConnections }] = await Promise.all([
      supabase.from('profiles').select('id, name, role'),
      supabase.from('connections').select('*')
    ])
    setProfiles(allProfiles || [])
    setConnections(allConnections || [])
    setLoading(false)
  }

  if (loading) return <div className="panel">Loading connections map…</div>

  const positions = new Map(
    profiles.map((p, i) => {
      const angle = (i / profiles.length) * 2 * Math.PI
      return [p.id, { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) }]
    })
  )

  return (
    <div className="panel">
      <p className="eyebrow">Admin</p>
      <h2>Connections Map</h2>
      <p className="subtitle">A network-wide view of every connection request and acceptance.</p>

      {profiles.length === 0 ? (
        <p className="muted">No profiles to show yet.</p>
      ) : (
        <div className="match-graphic">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}>
            {connections.map((c) => {
              const a = positions.get(c.user_a)
              const b = positions.get(c.user_b)
              if (!a || !b) return null
              return (
                <line
                  key={c.id}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  className={c.status === 'accepted' ? 'edge' : 'edge edge-faint'}
                  strokeDasharray={c.status === 'pending' ? '4 4' : undefined}
                />
              )
            })}

            {profiles.map((p) => {
              const pos = positions.get(p.id)
              return (
                <g key={p.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={7}
                    className={p.role === 'educator' ? 'node node-accent' : p.role === 'admin' ? 'node' : undefined}
                    style={p.role === 'student' ? { fill: 'var(--accent)' } : undefined}
                  >
                    <title>{`${p.name} · ${p.role}`}</title>
                  </circle>
                  <text
                    x={pos.x}
                    y={pos.y + 18}
                    textAnchor="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fill: 'var(--muted)' }}
                  >
                    {p.name}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}
