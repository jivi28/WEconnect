import { useState } from 'react'
import weConnectLogo from '../assets/we-connect-logo-transparent.png'
import { formatDate } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { DEMO_ACCOUNTS } from '../constants/demoAccounts'
import { readableAuthError } from '../pages/Login'

// The motto words, shown as separate colorful bubbles (colors match FEATURES).
const MOTTO = [
  { word: 'Connect', color: 'var(--we-red)' },
  { word: 'Create', color: '#e0a200' },
  { word: 'Prove', color: '#1d9d5b' }
]

// Public front door. Reused in two places:
//  - src/App.jsx (logged-out `/`): generic, no event.
//  - src/routes/Register.jsx (QR `/register?e=…`): pass `event` to show which
//    event the attendee is registering for before they sign up.
const FEATURES = [
  {
    num: '01',
    color: 'var(--we-red)',
    title: 'Connect',
    sub: 'Contacts',
    outcome: 'searchable network'
  },
  {
    num: '02',
    color: '#e0a200',
    title: 'Create',
    sub: 'Idea',
    outcome: 'real product',
    note: 'for students & educators'
  },
  {
    num: '03',
    color: '#1d9d5b',
    title: 'Prove',
    sub: 'Event',
    outcome: 'measurable ROI',
    note: 'analytics for admins'
  }
]

export default function Landing({ event = null, onSignup, onLogin }) {
  const { demoLogin } = useAuth()
  const [demoBusy, setDemoBusy] = useState(null) // role currently logging in, or null
  const [demoError, setDemoError] = useState('')

  async function handleDemoLogin(account) {
    setDemoError('')
    setDemoBusy(account.role)
    try {
      // On success MainApp re-renders into the app on its own (auth state).
      await demoLogin(account)
    } catch (err) {
      setDemoError(readableAuthError(err))
      setDemoBusy(null)
    }
  }

  return (
    <div className="auth-screen landing">
      <div className="landing-inner">
        <img className="landing-logo" src={weConnectLogo} alt="WEconnect" />
        <div className="motto-bubbles">
          {MOTTO.map((m) => (
            <span className="motto-bubble" key={m.word}>
              <span className="motto-bubble-dot" style={{ background: m.color }} />
              {m.word}
            </span>
          ))}
        </div>

        {event && (
          <div className="landing-event">
            <p className="eyebrow">Event registration</p>
            <p className="landing-event-name">
              <strong>{event.name}</strong>
              {event.event_date ? ` — ${formatDate(event.event_date)}` : ''}
            </p>
            <p className="subtitle">Sign up to join WEconnect and unlock this event's slides.</p>
          </div>
        )}

        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.num}>
              <p className="feature-num">
                <span className="feature-dot" style={{ background: f.color }} />
                {f.num}
              </p>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-sub">{f.sub}</p>
              <span className="feature-arrow" style={{ color: f.color }} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="feature-outcome">{f.outcome}</p>
              {f.note && <p className="feature-note">{f.note}</p>}
            </div>
          ))}
        </div>

        <div className="landing-cta-row">
          <button type="button" className="btn-cta" onClick={onSignup}>
            {event ? 'Sign up & get slides' : 'Sign up'}
          </button>
          <button type="button" className="btn-secondary landing-login-btn" onClick={onLogin}>
            Log in
          </button>
        </div>

        {/* QR registration (`event` set) is about signing up for that event,
            so the demo shortcut only appears on the generic front door. */}
        {!event && (
          <div className="landing-demo">
            <p className="landing-demo-label">Just looking around? Explore with a demo account:</p>
            <div className="landing-demo-row">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  type="button"
                  key={account.role}
                  className="landing-demo-btn"
                  onClick={() => handleDemoLogin(account)}
                  disabled={demoBusy !== null}
                >
                  <span className="landing-demo-dot" style={{ background: account.color }} />
                  {demoBusy === account.role ? 'Logging in…' : `Demo: ${account.label}`}
                </button>
              ))}
            </div>
            {demoError && <p className="error">{demoError}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
