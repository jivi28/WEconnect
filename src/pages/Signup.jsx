import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import RoleFields from '../components/RoleFields'
import { UNIVERSITY_EMAIL_ALLOWLIST } from '../constants/options'
import { readableAuthError } from './Login'

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'educator', label: 'Educator' },
  { value: 'wurth_employee', label: 'Würth Employee' }
]

// MOCK university/staff-affiliation check — there is no real integration
// with any university's systems here. It only compares the signup email's
// domain against a small hardcoded allowlist (UNIVERSITY_EMAIL_ALLOWLIST).
// A match auto-verifies the account for this hackathon demo; anything else
// leaves it "pending" and gated behind the verification-pending screen
// (see App.jsx) until someone updates it directly in the database.
function passesMockAffiliationCheck(email) {
  const domain = (email.split('@')[1] || '').toLowerCase()
  return UNIVERSITY_EMAIL_ALLOWLIST.includes(domain)
}

export default function Signup({ onSwitchToLogin }) {
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [roleData, setRoleData] = useState({})
  const [affiliationId, setAffiliationId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmNotice, setConfirmNotice] = useState(false)
  const [events, setEvents] = useState([])
  const [sourceEventId, setSourceEventId] = useState('')

  const requiresAffiliationCheck = role === 'student' || role === 'educator'

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
        role === 'wurth_employee'
          ? { ...roleData, organization: 'Würth Elektronik' }
          : { ...roleData, affiliationId }
      const verificationStatus = requiresAffiliationCheck
        ? passesMockAffiliationCheck(email)
          ? 'verified'
          : 'pending'
        : 'verified'
      const { needsEmailConfirmation } = await signup({
        name,
        username: username.trim(),
        email,
        password,
        role,
        roleData: finalRoleData,
        sourceEventId,
        verificationStatus
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
        <p className="we-wordmark">
          WE<span>connect</span>
        </p>
        <h1>Create your account</h1>
        <p className="subtitle">Tell us who you are so we can shape your view of the network.</p>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Name</span>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. circuit_otter42"
            />
            <small className="muted">
              Don't use your real name — this is the handle that shows up on the leaderboard.
            </small>
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

          {requiresAffiliationCheck && (
            <label className="field">
              <span>Student/staff ID</span>
              <input
                type="text"
                required
                value={affiliationId}
                onChange={(e) => setAffiliationId(e.target.value)}
                placeholder="Used to verify your university affiliation"
              />
              <small className="muted">
                We'll verify your university affiliation automatically — this takes a moment.
              </small>
            </label>
          )}

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

          <button type="submit" className="btn-we" disabled={busy}>
            <span className="btn-we-label">{busy ? 'Creating account…' : 'Create account'}</span>
            <span className="btn-we-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
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
