import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

function parseTags(text) {
  return text
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export default function Network() {
  const { user } = useAuth()
  const [myNetworkProfile, setMyNetworkProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [interestsText, setInterestsText] = useState('')
  const [lookingForText, setLookingForText] = useState('')
  const [others, setOthers] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadEverything()
  }, [])

  async function loadEverything() {
    setLoading(true)
    const [{ data: mine }, { data: everyone }, { data: myConnections }] = await Promise.all([
      supabase.from('network_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('network_profiles')
        .select('*, profiles(name, role)')
        .neq('user_id', user.id),
      supabase.from('connections').select('*').or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    ])

    setMyNetworkProfile(mine || null)
    setBio(mine?.bio || '')
    setInterestsText((mine?.interests || []).join(', '))
    setLookingForText((mine?.looking_for || []).join(', '))
    setOthers(everyone || [])
    setConnections(myConnections || [])
    setLoading(false)
    if (!mine) setEditing(true) // first time here — go straight to the form
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const row = {
        user_id: user.id,
        bio,
        interests: parseTags(interestsText),
        looking_for: parseTags(lookingForText),
        updated_at: new Date().toISOString()
      }
      const { error } = await supabase.from('network_profiles').upsert(row)
      if (error) throw error
      setMyNetworkProfile(row)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const myTags = useMemo(() => {
    if (!myNetworkProfile) return new Set()
    return new Set(
      [...(myNetworkProfile.interests || []), ...(myNetworkProfile.looking_for || [])].map((t) =>
        t.toLowerCase()
      )
    )
  }, [myNetworkProfile])

  const ranked = useMemo(() => {
    return others
      .map((person) => {
        const theirTags = new Set(
          [...(person.interests || []), ...(person.looking_for || [])].map((t) => t.toLowerCase())
        )
        const shared = [...myTags].filter((t) => theirTags.has(t))
        return { ...person, sharedCount: shared.length, sharedTags: shared }
      })
      .sort((a, b) => b.sharedCount - a.sharedCount)
  }, [others, myTags])

  function connectionWith(otherUserId) {
    return connections.find((c) => c.user_a === otherUserId || c.user_b === otherUserId)
  }

  async function handleConnect(otherUserId) {
    const optimistic = {
      user_a: user.id,
      user_b: otherUserId,
      initiated_by: user.id,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    setConnections((prev) => [...prev, optimistic])
    const { error } = await supabase.from('connections').insert(optimistic)
    if (error) {
      // roll back on failure
      setConnections((prev) => prev.filter((c) => c !== optimistic))
    }
  }

  if (loading) return <div className="panel">Loading your network…</div>

  if (editing) {
    return (
      <div className="panel">
        <p className="eyebrow">Network</p>
        <h2>{myNetworkProfile ? 'Update what you’re looking for' : 'Build your network'}</h2>
        <p className="subtitle">
          Add tags for your interests and what you want help with — internships, mentorship,
          research partners, whatever applies. We use these to suggest connections.
        </p>

        <form onSubmit={handleSave} className="form">
          <label className="field">
            <span>Short bio</span>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A sentence or two about you"
            />
          </label>
          <label className="field">
            <span>Interests (comma separated)</span>
            <input
              type="text"
              value={interestsText}
              onChange={(e) => setInterestsText(e.target.value)}
              placeholder="e.g. machine learning, climate policy, web design"
            />
          </label>
          <label className="field">
            <span>Looking for (comma separated)</span>
            <input
              type="text"
              value={lookingForText}
              onChange={(e) => setLookingForText(e.target.value)}
              placeholder="e.g. internships, mentorship, research partners"
            />
          </label>

          <div className="card-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            {myNetworkProfile && (
              <button type="button" className="link-btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="card-header">
        <div>
          <p className="eyebrow">Network</p>
          <h2>Suggested connections</h2>
        </div>
        <button className="link-btn" onClick={() => setEditing(true)}>
          Edit my tags
        </button>
      </div>

      {ranked.length === 0 && <p className="muted">No one else has joined the network yet.</p>}

      <ul className="match-list">
        {ranked.map((person) => {
          const conn = connectionWith(person.user_id)
          return (
            <li key={person.user_id} className="match-card">
              <div className="match-graphic" aria-hidden="true">
                <svg viewBox="0 0 60 30" width="60" height="30">
                  <line x1="8" y1="22" x2="52" y2="8" className={person.sharedCount ? 'edge' : 'edge edge-faint'} />
                  <circle cx="8" cy="22" r="4" className="node" />
                  <circle cx="52" cy="8" r="4" className={person.sharedCount ? 'node node-accent' : 'node'} />
                </svg>
              </div>
              <div className="match-body">
                <p className="match-name">
                  {person.profiles?.name || 'Someone'}{' '}
                  <span className="role-tag">{person.profiles?.role}</span>
                </p>
                {person.bio && <p className="muted">{person.bio}</p>}
                <div className="tag-row">
                  {(person.interests || []).map((t) => (
                    <span key={t} className={`tag ${person.sharedTags.includes(t.toLowerCase()) ? 'tag-shared' : ''}`}>
                      {t}
                    </span>
                  ))}
                  {(person.looking_for || []).map((t) => (
                    <span
                      key={`lf-${t}`}
                      className={`tag tag-outline ${person.sharedTags.includes(t.toLowerCase()) ? 'tag-shared' : ''}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="match-action">
                {!conn && (
                  <button className="btn-secondary" onClick={() => handleConnect(person.user_id)}>
                    Connect
                  </button>
                )}
                {conn && conn.status === 'pending' && <span className="muted">Pending</span>}
                {conn && conn.status === 'accepted' && <span className="muted">Connected</span>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
