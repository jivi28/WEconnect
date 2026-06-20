import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

export default function ProjectsTab() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [myProjects, setMyProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [joiningProject, setJoiningProject] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [savingNew, setSavingNew] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    const [{ data: allProjects }, { data: joined }] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('project_members').select('project_id, projects(name, description)').eq('user_id', user.id)
    ])
    setProjects(allProjects || [])
    setMyProjects(joined || [])
    setLoading(false)
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

  async function handleCreateProject(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSavingNew(true)
    try {
      const { error } = await supabase
        .from('projects')
        .insert({ name: newName.trim(), description: newDescription.trim() || null, owner_id: user.id })
      if (error) throw error
      setNewName('')
      setNewDescription('')
      setCreating(false)
      await loadProjects()
    } finally {
      setSavingNew(false)
    }
  }

  async function handleToggleVisibility(project) {
    const nextVisibility = project.visibility === 'public' ? 'private' : 'public'
    const { error } = await supabase.from('projects').update({ visibility: nextVisibility }).eq('id', project.id)
    if (!error) await loadProjects()
  }

  async function handleToggleStatus(project) {
    const nextStatus = project.status === 'past' ? 'ongoing' : 'past'
    const { error } = await supabase.from('projects').update({ status: nextStatus }).eq('id', project.id)
    if (!error) await loadProjects()
  }

  if (loading) return <div className="panel">Loading projects…</div>

  const joinedProjectIds = new Set(myProjects.map((p) => p.project_id))
  const activeProject = projects.find((p) => p.id === activeProjectId) || null
  const ongoingProjects = projects.filter((p) => p.status !== 'past')
  const pastProjects = projects.filter((p) => p.status === 'past')

  function renderProjectList(list) {
    return (
      <ul className="match-list">
        {list.map((project) => {
          const isOwner = project.owner_id === user.id
          const isMember = joinedProjectIds.has(project.id)
          return (
            <li key={project.id} className="match-card">
              <div
                className="match-thumb"
                style={project.thumbnail_url ? { backgroundImage: `url(${project.thumbnail_url})` } : undefined}
              />
              <div className="match-body">
                <p className="match-name">
                  <button type="button" className="link-btn" onClick={() => setActiveProjectId(project.id)}>
                    {project.name}
                  </button>{' '}
                  <span className="role-tag">{project.visibility}</span>
                </p>
                {project.description && <p className="muted">{project.description}</p>}
              </div>
              <div className="match-action">
                {isOwner && (
                  <>
                    <button className="btn-secondary" onClick={() => handleToggleVisibility(project)}>
                      Make {project.visibility === 'public' ? 'private' : 'public'}
                    </button>
                    <button className="btn-secondary" onClick={() => handleToggleStatus(project)}>
                      {project.status === 'past' ? 'Reopen' : 'Mark completed'}
                    </button>
                  </>
                )}
                {!isOwner && isMember && <span className="muted">Joined</span>}
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="panel">
      <div className="card-header">
        <div>
          <p className="eyebrow">Projects</p>
          <h2>Your projects</h2>
        </div>
        <button className="btn-secondary" onClick={() => setCreating((v) => !v)}>
          {creating ? 'Cancel' : 'New project'}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreateProject} className="form">
          <label className="field">
            <span>Project name</span>
            <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea rows={2} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          </label>
          <div className="card-actions">
            <button type="submit" className="btn-primary" disabled={savingNew}>
              {savingNew ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <p className="muted">No projects exist yet — check back once the simulation module adds some</p>
      ) : (
        <>
          <h3 className="section-heading">Ongoing projects</h3>
          {ongoingProjects.length === 0 ? (
            <p className="muted">No ongoing projects right now.</p>
          ) : (
            renderProjectList(ongoingProjects)
          )}

          <h3 className="section-heading">Past projects</h3>
          {pastProjects.length === 0 ? (
            <p className="muted">No completed projects yet.</p>
          ) : (
            renderProjectList(pastProjects)
          )}
        </>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Join an existing project</h3>
        </div>
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

      {activeProject && (
        <div className="card">
          <div className="card-header">
            <h3>{activeProject.name}</h3>
            <button className="link-btn" onClick={() => setActiveProjectId(null)}>
              Close
            </button>
          </div>
          <p className="muted">{activeProject.description || 'No description yet.'}</p>
          {/* SIMULATOR_PLACEHOLDER: teammate's component mounts here, receives projectId as prop */}
        </div>
      )}
    </div>
  )
}
