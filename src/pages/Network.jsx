import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import MultiSelectDropdown from '../components/MultiSelectDropdown'
import {
  WURTH_OFFERS,
  WURTH_SOUGHT_EDUCATORS,
  WURTH_SOUGHT_STUDENTS,
  EDUCATOR_OFFERINGS,
  GENERAL_INTERESTS,
  OPPORTUNITY_TYPES,
  TOPIC_AREAS
} from '../constants/options'

export default function Network() {
  const { user, profile } = useAuth()
  const isStudent = profile.role === 'student'
  const isEducator = profile.role === 'educator'
  const isWurthEmployee = profile.role === 'wurth_employee'

  const [myNetworkProfile, setMyNetworkProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState([])
  const [lookingFor, setLookingFor] = useState([])
  const [offers, setOffers] = useState([])
  const [expertiseTags, setExpertiseTags] = useState([])
  const [soughtEducators, setSoughtEducators] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mapActive, setMapActive] = useState(false)
  const mapWrapperRef = useRef(null)

  useEffect(() => {
    loadPreferences()
  }, [])

  useEffect(() => {
    if (!mapActive) return
    function handleClickOutside(event) {
      if (mapWrapperRef.current && !mapWrapperRef.current.contains(event.target)) {
        setMapActive(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mapActive])

  async function loadPreferences() {
    setLoading(true)
    const { data: mine } = await supabase
      .from('network_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    setMyNetworkProfile(mine || null)
    setBio(mine?.bio || '')
    setInterests(mine?.interests || [])
    setLookingFor(mine?.looking_for || [])
    setOffers(mine?.offers || [])
    setExpertiseTags(mine?.expertise_tags || [])
    setSoughtEducators(mine?.sought_educators || [])
    setEditing(!mine)
    setLoading(false)
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const row = {
        user_id: user.id,
        bio,
        interests,
        updated_at: new Date().toISOString(),
        ...(isStudent && { looking_for: lookingFor }),
        ...(isEducator && { expertise_tags: expertiseTags, offers }),
        ...(isWurthEmployee && {
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
      setMapActive(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="panel">Loading your network…</div>

  if (editing) {
    return (
      <div className="panel">
        <p className="eyebrow">Network preferences</p>
        <h2>{myNetworkProfile ? 'Redo your map' : 'Build your network'}</h2>
        <p className="subtitle">
          Choose your interests and what you are looking for. These preferences determine your
          connection map.
        </p>

        <form onSubmit={handleSave} className="form">
          <label className="field">
            <span>Short bio</span>
            <textarea
              rows={3}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
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

          {isWurthEmployee && (
            <>
              <MultiSelectDropdown
                label="Fachgebiet/Expertise"
                options={TOPIC_AREAS}
                selected={expertiseTags}
                onChange={setExpertiseTags}
              />
              <MultiSelectDropdown
                label="Gesuchte Studierende"
                options={WURTH_SOUGHT_STUDENTS}
                selected={lookingFor}
                onChange={setLookingFor}
              />
              <MultiSelectDropdown
                label="Gesuchte Educators"
                options={WURTH_SOUGHT_EDUCATORS}
                selected={soughtEducators}
                onChange={setSoughtEducators}
              />
              <MultiSelectDropdown
                label="Angebot"
                options={WURTH_OFFERS}
                selected={offers}
                onChange={setOffers}
              />
            </>
          )}

          <div className="card-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating map…' : 'Create map'}
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
    <div>
      <div className="card-actions" style={{ marginBottom: '0.75rem' }}>
        <button className="btn-secondary" onClick={() => setEditing(true)}>
          Redo map
        </button>
      </div>
      <div className="map-embed" ref={mapWrapperRef} onClick={() => setMapActive(true)}>
        <iframe
          src="/mindmap.html?embedded=1"
          title="Network graph"
          className="map-embed-frame"
          style={{ pointerEvents: mapActive ? 'auto' : 'none' }}
        />
        {!mapActive && <div className="map-embed-hint">Click to interact with the map</div>}
      </div>
    </div>
  )
}
