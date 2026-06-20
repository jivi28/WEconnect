import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import RoleFields from '../components/RoleFields'

export default function Profile() {
  const { profile, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [roleData, setRoleData] = useState(profile.role_data || {})
  const [saving, setSaving] = useState(false)

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
    </div>
  )
}
