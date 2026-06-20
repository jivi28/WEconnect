import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import RoleFields from '../components/RoleFields'
import { readableAuthError } from './Login'

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'educator', label: 'Educator' },
  { value: 'admin', label: 'Admin' }
]

export default function Signup({ onSwitchToLogin }) {
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [roleData, setRoleData] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmNotice, setConfirmNotice] = useState(false)
  const [events, setEvents] = useState([])
  const [sourceEventId, setSourceEventId] = useState('')

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .then(({ data }) => setEvents(data || []))
  }, [])

  function setRoleField(key, value) {
    setRoleData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const finalRoleData =
        role === 'admin' ? { ...roleData, organization: 'Würth Elektronik' } : roleData
      const { needsEmailConfirmation } = await signup({
        name,
        email,
        password,
        role,
        roleData: finalRoleData,
        sourceEventId
      })
      if (needsEmailConfirmation) setConfirmNotice(true)
    } catch (err) {
      setError(readableAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  if (confirmNotice) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <p className="eyebrow">Almost there</p>
          <h1>Check your email</h1>
          <p className="subtitle">
            We sent a confirmation link to <strong>{email}</strong>. Confirm it, then log in.
          </p>
          <button type="button" className="btn-primary" onClick={onSwitchToLogin}>
            Go to log in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <p className="eyebrow">Network module</p>
        <h1>Create your account</h1>
        <p className="subtitle">Tell us who you are so we can shape your view of the network.</p>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Name</span>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <div className="field">
            <span>Role</span>
            <div className="role-picker">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  className={`role-pill ${role === r.value ? 'role-pill-active' : ''}`}
                  onClick={() => setRole(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <RoleFields role={role} values={roleData} onChange={setRoleField} />

          <label className="field">
            <span>Which event brought you here? (optional)</span>
            <select value={sourceEventId} onChange={(e) => setSourceEventId(e.target.value)}>
              <option value="">Not sure / none</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="switch-line">
          Already have an account?{' '}
          <button type="button" className="link-btn" onClick={onSwitchToLogin}>
            Log in
          </button>
        </p>
      </div>
    </div>
  )
}
