import weConnectLogo from '../assets/we-connect-logo-transparent.png'
import { formatDate } from '../lib/format'

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
      </div>
    </div>
  )
}
