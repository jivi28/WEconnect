import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import RoleFields, { ROLE_FIELD_DEFS } from '../components/RoleFields'
import { formatEventDate, isPastEvent, splitJoinedEvents } from '../lib/events'

const LEGACY_STUDENT_YEAR_KEYS = ['year', 'studyYear', 'yearOfStudy', 'academicYear']

function cleanRoleData(role, data) {
  if (role !== 'student') return data || {}
  return Object.fromEntries(Object.entries(data || {}).filter(([key]) => !LEGACY_STUDENT_YEAR_KEYS.includes(key)))
}

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

function formatDate(value) {
  if (!value) return null
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

const MAX_CV_BYTES = 5 * 1024 * 1024

export default function Profile({ onNavigate }) {
  const { profile, updateProfile, user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [roleData, setRoleData] = useState(() => cleanRoleData(profile.role, profile.role_data))
  const [saving, setSaving] = useState(false)

  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameDraft, setUsernameDraft] = useState(profile.username || '')
  const [savingUsername, setSavingUsername] = useState(false)
  const [usernameError, setUsernameError] = useState('')

  const isWurthEmployee = profile.role === 'wurth_employee'
  const roleFieldDefs = ROLE_FIELD_DEFS[profile.role] || []
  const cleanedProfileRoleData = cleanRoleData(profile.role, profile.role_data)

  const [networkProfile, setNetworkProfile] = useState(null)
  const [sourceEvent, setSourceEvent] = useState(null)
  const [myEvents, setMyEvents] = useState([])
  const [loadingExtras, setLoadingExtras] = useState(true)
  const [cvUploading, setCvUploading] = useState(false)
  const [cvError, setCvError] = useState('')

  useEffect(() => {
    loadExtras()
  }, [])

  async function loadExtras() {
    setLoadingExtras(true)
    const [{ data: net }, { data: events }, { data: hosted }, sourceEventResult] =
      await Promise.all([
        supabase.from('network_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_events').select('event_id, events(*)').eq('user_id', user.id),
        // Hosting an event (events.host_ids) is separate from attending one
        // (user_events) — a host who never registered via the QR flow would
        // otherwise never see their own event in "Recently attended".
        isWurthEmployee
          ? supabase.from('events').select('*').contains('host_ids', [user.id])
          : Promise.resolve({ data: [] }),
        profile.source_event_id
          ? supabase.from('events').select('name, event_date').eq('id', profile.source_event_id).maybeSingle()
          : Promise.resolve({ data: null })
      ])
    setNetworkProfile(net || null)

    const attendedRows = events || []
    const hostedRows = (hosted || [])
      .filter((e) => !attendedRows.some((r) => r.event_id === e.id))
      .map((e) => ({ event_id: e.id, events: e }))
    setMyEvents([...attendedRows, ...hostedRows])

    setSourceEvent(sourceEventResult.data || null)
    setLoadingExtras(false)
  }

  function setRoleField(key, value) {
    setRoleData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSaveUsername() {
    const trimmed = usernameDraft.trim()
    if (!trimmed) {
      setUsernameError('Username cannot be empty.')
      return
    }
    setUsernameError('')
    setSavingUsername(true)
    try {
      await updateProfile({ username: trimmed })
      setEditingUsername(false)
    } catch (err) {
      setUsernameError(
        err.message?.includes('profiles_username_unique')
          ? 'That username is taken — try another.'
          : 'Could not save username. Please try again.'
      )
    } finally {
      setSavingUsername(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile({ role_data: cleanRoleData(profile.role, roleData) })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  // Fixed per-user path (not the original filename) so re-uploading
  // overwrites in place rather than accumulating old CVs in the bucket.
  async function handleCvUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setCvError('')
    if (file.type !== 'application/pdf') {
      setCvError('CV must be a PDF.')
      return
    }
    if (file.size > MAX_CV_BYTES) {
      setCvError('CV must be 5MB or smaller.')
      return
    }
    setCvUploading(true)
    try {
      const path = `${user.id}/cv.pdf`
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(path, file, { upsert: true, contentType: 'application/pdf' })
      if (uploadError) throw uploadError
      await updateProfile({ cv_file_path: path })
    } catch (err) {
      setCvError(err.message || 'Upload failed. Please try again.')
    } finally {
      setCvUploading(false)
    }
  }

  // Bucket is private (see supabase/schema.sql) — every view goes through a
  // freshly minted signed URL rather than a stored public link.
  async function handleViewCv() {
    setCvError('')
    const { data, error } = await supabase.storage.from('cvs').createSignedUrl(profile.cv_file_path, 60)
    if (error || !data?.signedUrl) {
      setCvError('Could not open your CV. Please try again.')
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function handleRemoveCv() {
    if (!window.confirm('Remove your uploaded CV?')) return
    setCvError('')
    setCvUploading(true)
    try {
      const { error: removeError } = await supabase.storage.from('cvs').remove([profile.cv_file_path])
      if (removeError) throw removeError
      await updateProfile({ cv_file_path: null })
    } catch (err) {
      setCvError(err.message || 'Could not remove your CV. Please try again.')
    } finally {
      setCvUploading(false)
    }
  }

  const opportunityTags = isWurthEmployee
    ? [...(networkProfile?.looking_for || []), ...(networkProfile?.sought_educators || []), ...(networkProfile?.offers || [])]
    : profile.role === 'educator'
      ? networkProfile?.offers || []
      : networkProfile?.looking_for || []

  const { attended } = splitJoinedEvents(myEvents)
  const highlightEvents = attended.slice(0, 5)

  return (
    <div className="profile-layout">
      <div className="panel profile-main">
      <div className="profile-header">
        <div className="avatar avatar-lg" aria-hidden="true">
          {initials(profile.name)}
        </div>
        <div>
          <p className="eyebrow">Profile</p>
          <h2>{profile.name}</h2>
          <p className="subtitle">
            {user.email} · <span className="role-tag">{profile.role}</span>
          </p>

          {editingUsername ? (
            <div className="card-actions" style={{ marginTop: 0 }}>
              <input
                type="text"
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                placeholder="Leaderboard username"
                autoFocus
              />
              <button className="link-btn" onClick={handleSaveUsername} disabled={savingUsername}>
                {savingUsername ? 'Saving…' : 'Save'}
              </button>
              <button
                className="link-btn"
                onClick={() => {
                  setEditingUsername(false)
                  setUsernameDraft(profile.username || '')
                  setUsernameError('')
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="muted">
              {profile.username ? `@${profile.username}` : 'No leaderboard username set yet'}{' · '}
              <button className="link-btn" onClick={() => setEditingUsername(true)}>
                {profile.username ? 'Change' : 'Set username'}
              </button>
            </p>
          )}
          {usernameError && <p className="error">{usernameError}</p>}

          <p className="muted">
            Member since {formatDate(profile.created_at) || '—'}
            {sourceEvent && ` · joined via ${sourceEvent.name}`}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Role details</h3>
          {!editing && (
            <button className="link-btn" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <>
            <RoleFields role={profile.role} values={roleData} onChange={setRoleField} />
            <div className="card-actions">
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button className="link-btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <dl className="detail-list">
            {roleFieldDefs.every(({ key }) => !cleanedProfileRoleData[key]) && (
              <p className="muted">No details added yet.</p>
            )}
            {roleFieldDefs.map(({ key, label }) => {
              const value = cleanedProfileRoleData[key]
              return (
                <div key={key} className="detail-row">
                  <dt>{label}</dt>
                  <dd>
                    {key === 'linkedinUrl' && value ? (
                      <a href={value} target="_blank" rel="noreferrer">
                        {value}
                      </a>
                    ) : (
                      value || '—'
                    )}
                  </dd>
                </div>
              )
            })}
          </dl>
        )}
      </div>

      {profile.role === 'student' && (
        <div className="card">
          <div className="card-header">
            <h3>CV</h3>
          </div>
          <p className="muted">
            Only visible to you and Würth Elektronik recruiters — not educators or other students.
          </p>
          {profile.cv_file_path && (
            <div className="card-actions">
              <button type="button" className="link-btn" onClick={handleViewCv}>
                View current CV
              </button>
              <button type="button" className="link-btn-danger" onClick={handleRemoveCv} disabled={cvUploading}>
                Remove CV
              </button>
            </div>
          )}
          <label className="field">
            <span>{profile.cv_file_path ? 'Replace CV (PDF, max 5MB)' : 'Upload CV (PDF, max 5MB)'}</span>
            <input type="file" accept="application/pdf" onChange={handleCvUpload} disabled={cvUploading} />
          </label>
          {cvUploading && <p className="muted">Working…</p>}
          {cvError && <p className="error">{cvError}</p>}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Network profile</h3>
          <button className="link-btn" onClick={() => onNavigate?.('network')}>
            Edit in Network tab
          </button>
        </div>

        {loadingExtras ? (
          <p className="muted">Loading…</p>
        ) : networkProfile ? (
          <>
            <p>{networkProfile.bio || <span className="muted">No bio added yet.</span>}</p>
            <div className="tag-row">
              {(networkProfile.interests || []).map((t) => (
                <span key={`int-${t}`} className="tag">
                  {t}
                </span>
              ))}
              {opportunityTags.map((t) => (
                <span key={`opp-${t}`} className="tag tag-outline">
                  {t}
                </span>
              ))}
              {(networkProfile.expertise_tags || []).map((t) => (
                <span key={`exp-${t}`} className="tag tag-outline">
                  {t}
                </span>
              ))}
              {(networkProfile.interests || []).length === 0 && opportunityTags.length === 0 && (
                <p className="muted">No tags added yet.</p>
              )}
            </div>
          </>
        ) : (
          <p className="muted">You haven't set up your network profile yet.</p>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Activity</h3>
        </div>
        <dl className="detail-list">
          <div className="detail-row">
            <dt>Events attended</dt>
            <dd>{attended.length}</dd>
          </div>
        </dl>
      </div>
    </div>

    <aside className="profile-aside">
      <div className="card highlight-card">
        <div className="card-header">
          <h3>Recently attended</h3>
          <button className="link-btn" onClick={() => onNavigate?.('events')}>
            See all
          </button>
        </div>
        {loadingExtras ? (
          <p className="muted">Loading…</p>
        ) : highlightEvents.length === 0 ? (
          <p className="muted">You haven't attended any events yet.</p>
        ) : (
          <ul className="sidebar-event-list">
            {highlightEvents.map((ev) => {
              const past = isPastEvent(ev.event_date)
              return (
                <li key={ev.id} className="sidebar-event-row">
                  <div>
                    <p className="sidebar-event-name">{ev.name}</p>
                    <p className="sidebar-event-date">{formatEventDate(ev.event_date)}</p>
                  </div>
                  <span className={`status-dot ${past ? 'status-dot-past' : 'status-dot-upcoming'}`} aria-hidden="true" />
                </li>
              )
            })}
          </ul>
        )}
      </div>

    </aside>
    </div>
  )
}
