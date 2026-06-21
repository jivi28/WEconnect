import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import { useAuth } from '../context/AuthContext'

// QR target: /register?e=<qr_token>
// Signs the attendee up, attributing them to the event (source_event_id).
// The handle_new_user DB trigger creates their profile AND registers them
// into user_events, which unlocks the event's slides.
export default function Register() {
  const [params] = useSearchParams()
  const token = params.get('e')
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [event, setEvent] = useState(null)
  const [loadErr, setLoadErr] = useState('')
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setLoadErr('No event token in the link. Scan a valid event QR code.')
      return
    }
    supabase
      .rpc('event_by_qr_token', { token })
      .then(({ data, error }) => {
        if (error) return setLoadErr(error.message)
        if (!data || data.length === 0) return setLoadErr('Unknown event QR code.')
        setEvent(data[0])
      })
  }, [token])

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setMsg('')
    setBusy(true)
    try {
      const { needsEmailConfirmation } = await signup({
        name: form.name,
        username: form.username.trim(),
        email: form.email,
        password: form.password,
        role: 'student',
        sourceEventId: event.id,
      })

      // If email confirmation is disabled, signup() already has a live session.
      if (!needsEmailConfirmation) {
        navigate('/slides')
        return
      }

      // Otherwise try an immediate password sign-in (works if already allowed).
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (signInErr) {
        setMsg(
          'Account created and registered for the event! Please confirm your ' +
            'email, then sign in to access the slides.'
        )
        return
      }
      navigate('/slides')
    } catch (e2) {
      setErr(e2.message || String(e2))
    } finally {
      setBusy(false)
    }
  }

  if (loadErr) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <p className="we-wordmark">
            WE<span>connect</span>
          </p>
          <p className="eyebrow">Event registration</p>
          <h1>Registration</h1>
          <p className="error">{loadErr}</p>
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
        <p className="we-wordmark">
          WE<span>connect</span>
        </p>
        <p className="eyebrow">Event registration</p>
        <h1>Register for the event</h1>

        {event ? (
          <p className="subtitle">
            <strong>{event.name}</strong>
            {event.event_date ? ` — ${formatDate(event.event_date)}` : ''}
          </p>
        ) : (
          <p className="subtitle">Loading event…</p>
        )}
        <p className="subtitle">Sign up to join WEconnect and unlock this event's slides.</p>

        <form onSubmit={onSubmit} className="form">
          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>

          <label className="field">
            <span>Username</span>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="e.g. circuit_otter42"
              required
            />
            <small className="muted">This is the handle that shows up on the leaderboard.</small>
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              required
            />
          </label>

          {err && <p className="error">{err}</p>}
          {msg && <p className="success">{msg}</p>}

          <button type="submit" className="btn-we" disabled={busy || !event}>
            <span className="btn-we-label">{busy ? 'Creating account…' : 'Register & get slides'}</span>
            <span className="btn-we-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </form>

        <p className="switch-line">
          <Link to="/">Back to home</Link>
        </p>
      </div>
    </div>
  )
}
