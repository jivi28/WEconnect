import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import MultiSelectDropdown from '../components/MultiSelectDropdown'
import {
  ADMIN_OFFERS,
  ADMIN_SOUGHT_EDUCATORS,
  ADMIN_SOUGHT_STUDENTS,
  EDUCATOR_OFFERINGS,
  GENERAL_INTERESTS,
  OPPORTUNITY_TYPES,
  TOPIC_AREAS
} from '../constants/options'

// Union every tag-bearing field a network_profiles row can have, regardless of
// role. Matches fall out naturally wherever vocab overlaps (student<->admin via
// looking_for, educator<->admin via offers/expertise_tags) and naturally don't
// where vocab differs (student<->educator) — no role-branching needed here.
function combinedTags(person) {
  return [
    ...(person.interests || []),
    ...(person.looking_for || []),
    ...(person.offers || []),
    ...(person.expertise_tags || []),
    ...(person.sought_educators || [])
  ].map((t) => t.toLowerCase())
}

export default function Network() {
  const { user, profile } = useAuth()
  const isStudent = profile.role === 'student'
  const isEducator = profile.role === 'educator'
  const isAdmin = profile.role === 'admin'

  const [myNetworkProfile, setMyNetworkProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState([])
  const [lookingFor, setLookingFor] = useState([])
  const [offers, setOffers] = useState([])
  const [expertiseTags, setExpertiseTags] = useState([])
  const [soughtEducators, setSoughtEducators] = useState([])
  const [others, setOthers] = useState([])
  const [connections, setConnections] = useState([])
  const [cachedMatches, setCachedMatches] = useState([])
  const [matchesGeneratedAt, setMatchesGeneratedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

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
    setInterests(mine?.interests || [])
    setLookingFor(mine?.looking_for || [])
    setOffers(mine?.offers || [])
    setExpertiseTags(mine?.expertise_tags || [])
    setSoughtEducators(mine?.sought_educators || [])
    setCachedMatches(mine?.cached_matches || [])
    setMatchesGeneratedAt(mine?.matches_generated_at || null)
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
        interests,
        updated_at: new Date().toISOString(),
        ...(isStudent && { looking_for: lookingFor }),
        ...(isEducator && { expertise_tags: expertiseTags, offers }),
        ...(isAdmin && {
          expertise_tags: expertiseTags,
          looking_for: lookingFor,
          sought_educators: soughtEducators,
          offers
        })
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
    return new Set(combinedTags(myNetworkProfile))
  }, [myNetworkProfile])

  const ranked = useMemo(() => {
    return others
      .map((person) => {
        const theirTags = new Set(combinedTags(person))
        const shared = [...myTags].filter((t) => theirTags.has(t))
        return { ...person, sharedCount: shared.length, sharedTags: shared }
      })
      .sort((a, b) => b.sharedCount - a.sharedCount)
  }, [others, myTags])

  // Show the cached snapshot if we have one; otherwise fall back to a live
  // computation. Connection status always comes from the live `connections`
  // fetch below, never from the cache.
  const displayedMatches = cachedMatches.length > 0 ? cachedMatches : ranked

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

  async function handleRefreshMatches() {
    setRefreshing(true)
    try {
      const trimmed = ranked.map((p) => ({
        user_id: p.user_id,
        name: p.profiles?.name || 'Someone',
        role: p.profiles?.role,
        sharedCount: p.sharedCount,
        sharedTags: p.sharedTags
      }))
      const generatedAt = new Date().toISOString()
      const { error } = await supabase
        .from('network_profiles')
        .upsert({ user_id: user.id, cached_matches: trimmed, matches_generated_at: generatedAt })
      if (error) throw error
      setCachedMatches(trimmed)
      setMatchesGeneratedAt(generatedAt)
    } finally {
      setRefreshing(false)
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

          <MultiSelectDropdown
            label="Interests"
            options={GENERAL_INTERESTS}
            selected={interests}
            onChange={setInterests}
          />

          {isStudent && (
            <MultiSelectDropdown
              label="Looking for"
              options={OPPORTUNITY_TYPES}
              selected={lookingFor}
              onChange={setLookingFor}
            />
          )}

          {isEducator && (
            <>
              <MultiSelectDropdown
                label="Fachgebiet/Expertise"
                options={TOPIC_AREAS}
                selected={expertiseTags}
                onChange={setExpertiseTags}
              />
              <MultiSelectDropdown
                label="What I can offer"
                options={EDUCATOR_OFFERINGS}
                selected={offers}
                onChange={setOffers}
              />
            </>
          )}

          {isAdmin && (
            <>
              <MultiSelectDropdown
                label="Fachgebiet/Expertise"
                options={TOPIC_AREAS}
                selected={expertiseTags}
                onChange={setExpertiseTags}
              />
              <MultiSelectDropdown
                label="Gesuchte Studierende"
                options={ADMIN_SOUGHT_STUDENTS}
                selected={lookingFor}
                onChange={setLookingFor}
              />
              <MultiSelectDropdown
                label="Gesuchte Educators"
                options={ADMIN_SOUGHT_EDUCATORS}
                selected={soughtEducators}
                onChange={setSoughtEducators}
              />
              <MultiSelectDropdown label="Angebot" options={ADMIN_OFFERS} selected={offers} onChange={setOffers} />
            </>
          )}

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
          <p className="muted">
            {matchesGeneratedAt
              ? `Matches last refreshed: ${new Date(matchesGeneratedAt).toLocaleString()}`
              : 'Matches not refreshed yet'}
          </p>
        </div>
        <div className="card-actions">
          <button className="btn-secondary" onClick={handleRefreshMatches} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh my matches'}
          </button>
          <button className="link-btn" onClick={() => setEditing(true)}>
            Edit my tags
          </button>
        </div>
      </div>

      {displayedMatches.length === 0 && <p className="muted">No one else has joined the network yet.</p>}

      <ul className="match-list">
        {displayedMatches.map((person) => {
          const name = person.profiles?.name || person.name || 'Someone'
          const role = person.profiles?.role || person.role
          const conn = connectionWith(person.user_id)
          const hasFullTagData =
            person.interests ||
            person.looking_for ||
            person.offers ||
            person.expertise_tags ||
            person.sought_educators

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
                  {name} <span className="role-tag">{role}</span>
                </p>
                {person.bio && <p className="muted">{person.bio}</p>}
                <div className="tag-row">
                  {hasFullTagData ? (
                    <>
                      {(person.interests || []).map((t) => (
                        <span
                          key={`int-${t}`}
                          className={`tag ${person.sharedTags.includes(t.toLowerCase()) ? 'tag-shared' : ''}`}
                        >
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
                      {(person.offers || []).map((t) => (
                        <span
                          key={`of-${t}`}
                          className={`tag tag-outline ${person.sharedTags.includes(t.toLowerCase()) ? 'tag-shared' : ''}`}
                        >
                          {t}
                        </span>
                      ))}
                      {(person.expertise_tags || []).map((t) => (
                        <span
                          key={`ex-${t}`}
                          className={`tag tag-outline ${person.sharedTags.includes(t.toLowerCase()) ? 'tag-shared' : ''}`}
                        >
                          {t}
                        </span>
                      ))}
                      {(person.sought_educators || []).map((t) => (
                        <span
                          key={`se-${t}`}
                          className={`tag tag-outline ${person.sharedTags.includes(t.toLowerCase()) ? 'tag-shared' : ''}`}
                        >
                          {t}
                        </span>
                      ))}
                    </>
                  ) : (
                    (person.sharedTags || []).map((t) => (
                      <span key={`shared-${t}`} className="tag tag-shared">
                        {t}
                      </span>
                    ))
                  )}
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
