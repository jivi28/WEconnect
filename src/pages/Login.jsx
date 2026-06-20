import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login({ onSwitchToSignup }) {
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
    } catch (err) {
      setError(readableAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <p className="we-wordmark">
          WE<span>connect</span>
        </p>
        <p className="eyebrow">Network module</p>
        <h1>Log in</h1>
        <p className="subtitle">Pick up where your connections left off.</p>

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
  if (message.includes('Password should be at least')) return 'Password should be at least 6 characters.'
  if (message.includes('Email not confirmed')) {
    return 'Please confirm your email (check your inbox) before logging in.'
  }
  return message || 'Something went wrong. Please try again.'
}
