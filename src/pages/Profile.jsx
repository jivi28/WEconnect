import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import RoleFields from '../components/RoleFields'

export default function Profile() {
  const { profile, updateProfile, user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [roleData, setRoleData] = useState(profile.role_data || {})
  const [saving, setSaving] = useState(false)

  const canJoinProjects = profile.role === 'student' || profile.role === 'educator'

  const [events, setEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [addingEvent, setAddingEvent] = useState(false)

  const [projects, setProjects] = useState([])
  const [myProjects, setMyProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [joiningProject, setJoiningProject] = useState(false)

  useEffect(() => {
    loadEvents()
    if (canJoinProjects) loadProjects()
  }, [])

  async function loadEvents() {
    const [{ data: allEvents }, { data: joined }] = await Promise.all([
      supabase.from('events').select('*'),
      supabase.from('user_events').select('event_id, events(name, event_date)').eq('user_id', user.id)
    ])
    setEvents(allEvents || [])
    setMyEvents(joined || [])
  }

  async function loadProjects() {
    const [{ data: allProjects }, { data: joined }] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('project_members').select('project_id, projects(name, description)').eq('user_id', user.id)
    ])
    setProjects(allProjects || [])
    setMyProjects(joined || [])
  }

  async function handleAddEvent() {
    if (!selectedEventId) return
    setAddingEvent(true)
    try {
      const { error } = await supabase
        .from('user_events')
        .insert({ user_id: user.id, event_id: selectedEventId })
      if (error) throw error
      setSelectedEventId('')
      await loadEvents()
    } finally {
      setAddingEvent(false)
    }
  }

  async function handleJoinProject() {
    if (!selectedProjectId) return
    setJoiningProject(true)
    try {
      const { error } = await supabase
        .from('project_members')
        .insert({ user_id: user.id, project_id: selectedProjectId })
      if (error) throw error
      setSelectedProjectId('')
      await loadProjects()
    } finally {
      setJoiningProject(false)
    }
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

  return (
    <div className="panel">
      <p className="eyebrow">Profile</p>
      <h2>{profile.name}</h2>
      <p className="subtitle">
        {profile.email} · <span className="role-tag">{profile.role}</span>
      </p>

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
                <dd>{value || '—'}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Events</h3>
        </div>

        <dl className="detail-list">
          {myEvents.length === 0 && <p className="muted">You haven't added any events yet.</p>}
          {myEvents.map((e) => (
            <div key={e.event_id} className="detail-row">
              <dt>{e.events?.name}</dt>
              <dd>{e.events?.event_date || '—'}</dd>
            </div>
          ))}
        </dl>

        {events.length === 0 ? (
          <p className="muted">No events have been added yet</p>
        ) : (
          <div className="card-actions">
            <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
              <option value="">Select an event…</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
            <button
              className="btn-secondary"
              onClick={handleAddEvent}
              disabled={!selectedEventId || addingEvent}
            >
              {addingEvent ? 'Adding…' : 'Add'}
            </button>
          </div>
        )}
      </div>

      {canJoinProjects && (
        <div className="card">
          <div className="card-header">
            <h3>Projects</h3>
          </div>

          <dl className="detail-list">
            {myProjects.length === 0 && <p className="muted">You haven't joined any projects yet.</p>}
            {myProjects.map((p) => (
              <div key={p.project_id} className="detail-row">
                <dt>{p.projects?.name}</dt>
                <dd>{p.projects?.description || '—'}</dd>
              </div>
            ))}
          </dl>

          {projects.length === 0 ? (
            <p className="muted">No projects exist yet — check back once the simulation module adds some</p>
          ) : (
            <div className="card-actions">
              <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                <option value="">Select a project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                className="btn-secondary"
                onClick={handleJoinProject}
                disabled={!selectedProjectId || joiningProject}
              >
                {joiningProject ? 'Joining…' : 'Join project'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
