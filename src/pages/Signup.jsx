import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import RoleFields from '../components/RoleFields'
import BrandLogo from '../components/BrandLogo'
import { UNIVERSITY_EMAIL_ALLOWLIST } from '../constants/options'
import { formatDate } from '../lib/format'
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

// `eventToken` (optional): when set, this is the QR-code flow — the form is
// locked to that one event (source attribution), the "which event?" dropdown is
// hidden, and a successful signup redirects to /slides to unlock the event's
// slides instead of showing the email-confirm notice / MainApp gating.
export default function Signup({ onSwitchToLogin, eventToken = null, onHome }) {
  const { signup } = useAuth()
  const navigate = useNavigate()
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
  const [msg, setMsg] = useState('')
  const [events, setEvents] = useState([])
  const [sourceEventId, setSourceEventId] = useState('')
  const [lockedEvent, setLockedEvent] = useState(null)
  const [lockedEventErr, setLockedEventErr] = useState('')

  const requiresAffiliationCheck = role === 'student' || role === 'educator'

  // QR attendees are students/educators only — Würth Employees never onboard
  // through an event QR code.
  const availableRoles = eventToken ? ROLES.filter((r) => r.value !== 'wurth_employee') : ROLES

  useEffect(() => {
    // QR flow: resolve the single locked event instead of offering a dropdown.
    if (eventToken) {
      supabase.rpc('event_by_qr_token', { token: eventToken }).then(({ data, error }) => {
        if (error) return setLockedEventErr(error.message)
        if (!data || data.length === 0) return setLockedEventErr('Unknown event QR code.')
        setLockedEvent(data[0])
      })
      return
    }
    supabase
      .from('events')
      .select('*')
      .then(({ data }) => setEvents(data || []))
  }, [eventToken])

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
        sourceEventId: lockedEvent ? lockedEvent.id : sourceEventId,
        verificationStatus
      })

      // QR flow: send them straight to the event's slides. /slides is its own
      // route outside MainApp's verification gate, so students get the slides
      // immediately even while their account stays "pending" elsewhere.
      if (eventToken) {
        if (!needsEmailConfirmation) {
          navigate('/slides')
          return
        }
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) {
          setMsg(
            'Account created and registered for the event! Please confirm your ' +
              'email, then sign in to access the slides.'
          )
          return
        }
        navigate('/slides')
        return
      }

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

  if (lockedEventErr) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <BrandLogo onHome={onHome} className="auth-brand" />
          <p className="eyebrow">Event registration</p>
          <h1>Registration</h1>
          <p className="error">{lockedEventErr}</p>
          <p className="switch-line">
            <Link to="/">Back to home</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <BrandLogo onHome={onHome} className="auth-brand" />
        {eventToken && <p className="eyebrow">Event registration</p>}
        <h1>Create your account</h1>
        {eventToken ? (
          <>
            <p className="subtitle">
              {lockedEvent ? (
                <>
                  <strong>{lockedEvent.name}</strong>
                  {lockedEvent.event_date ? ` — ${formatDate(lockedEvent.event_date)}` : ''}
                </>
              ) : (
                'Loading event…'
              )}
            </p>
            <p className="subtitle">Sign up to join WEconnect and unlock this event's slides.</p>
          </>
        ) : (
          <p className="subtitle">Tell us who you are so we can shape your view of the network.</p>
        )}

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
              {availableRoles.map((r) => (
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

          {!eventToken && (
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
          )}

          {error && <p className="error">{error}</p>}
          {msg && <p className="success">{msg}</p>}

          <button type="submit" className="btn-we" disabled={busy || (eventToken && !lockedEvent)}>
            <span className="btn-we-label">{busy ? 'Creating account…' : 'Create account'}</span>
            <span className="btn-we-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </form>

        {eventToken ? (
          <p className="switch-line">
            <Link to="/">Back to home</Link>
          </p>
        ) : (
          <p className="switch-line">
            Already have an account?{' '}
            <button type="button" className="link-btn" onClick={onSwitchToLogin}>
              Log in
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
