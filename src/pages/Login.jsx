import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import BrandLogo from '../components/BrandLogo'

export default function Login({ onSwitchToSignup, onLoggedIn, onHome }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login({ email, password })
      // QR flow passes this to jump straight to the event's slides; in the main
      // app it's absent and MainApp re-renders to the app on its own.
      if (onLoggedIn) onLoggedIn()
    } catch (err) {
      setError(readableAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <BrandLogo onHome={onHome} className="auth-brand" />
        <h1>Log in</h1>
        <p className="subtitle">Create, connect, prove.</p>

        <form onSubmit={handleSubmit} className="form">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-we" disabled={busy}>
            <span className="btn-we-label">{busy ? 'Logging in…' : 'Log in'}</span>
            <span className="btn-we-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </form>

        <p className="switch-line">
          New here?{' '}
          <button type="button" className="link-btn" onClick={onSwitchToSignup}>
            Create an account
          </button>
        </p>
      </div>
    </div>
  )
}

export function readableAuthError(err) {
  const message = err?.message || ''
  if (message.includes('Invalid login credentials')) {
    return 'No account matches that email and password.'
  }
  if (message.includes('already registered')) return 'An account already exists for that email.'
  if (message.includes('profiles_username_unique')) return 'That username is taken — try another one.'
  if (
    message.includes('profiles_username_not_blank') ||
    (message.includes('null value') && message.includes('username'))
  ) {
    return 'A username is required — please choose one.'
  }
  if (message.includes('Password should be at least')) return 'Password should be at least 6 characters.'
  if (message.includes('Email not confirmed')) {
    return 'Please confirm your email (check your inbox) before logging in.'
  }
  return message || 'Something went wrong. Please try again.'
}
