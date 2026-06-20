import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import RoleFields from '../components/RoleFields'

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

export default function Profile({ onNavigate }) {
  const { profile, updateProfile, user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [roleData, setRoleData] = useState(profile.role_data || {})
  const [saving, setSaving] = useState(false)

  const isAdmin = profile.role === 'admin'

  const [networkProfile, setNetworkProfile] = useState(null)
  const [sourceEvent, setSourceEvent] = useState(null)
  const [eventCount, setEventCount] = useState(0)
  const [projectCount, setProjectCount] = useState(0)
  const [loadingExtras, setLoadingExtras] = useState(true)

  useEffect(() => {
    loadExtras()
  }, [])

  async function loadExtras() {
    setLoadingExtras(true)
    const [{ data: net }, { data: events }, { data: members }, sourceEventResult] = await Promise.all([
      supabase.from('network_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_events').select('event_id').eq('user_id', user.id),
      isAdmin
        ? Promise.resolve({ data: [] })
        : supabase.from('project_members').select('project_id').eq('user_id', user.id),
      profile.source_event_id
        ? supabase.from('events').select('name, event_date').eq('id', profile.source_event_id).maybeSingle()
        : Promise.resolve({ data: null })
    ])
    setNetworkProfile(net || null)
    setEventCount((events || []).length)
    setProjectCount((members || []).length)
    setSourceEvent(sourceEventResult.data || null)
    setLoadingExtras(false)
  }

  function setRoleField(key, value) {
    setRoleData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile({ role_data: roleData })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const opportunityTags = isAdmin
    ? [...(networkProfile?.looking_for || []), ...(networkProfile?.sought_educators || []), ...(networkProfile?.offers || [])]
    : profile.role === 'educator'
      ? networkProfile?.offers || []
      : networkProfile?.looking_for || []

  return (
    <div className="panel">
      <div className="profile-header">
        <div className="avatar avatar-lg" aria-hidden="true">
          {initials(profile.name)}
        </div>
        <div>
          <p className="eyebrow">Profile</p>
          <h2>{profile.name}</h2>
          <p className="subtitle">
            {profile.email} · <span className="role-tag">{profile.role}</span>
          </p>
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
            {Object.entries(profile.role_data || {}).length === 0 && (
              <p className="muted">No details added yet.</p>
            )}
            {Object.entries(profile.role_data || {}).map(([key, value]) => (
              <div key={key} className="detail-row">
                <dt>{key}</dt>
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
            ))}
          </dl>
        )}
      </div>

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
            <dd>{eventCount}</dd>
          </div>
          {!isAdmin && (
            <div className="detail-row">
              <dt>Projects joined</dt>
              <dd>{projectCount}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
