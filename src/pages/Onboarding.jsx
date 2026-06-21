import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import BrandLogo from '../components/BrandLogo'

const COLLABORATION_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'maybe', label: 'Maybe later' },
  { value: 'no', label: 'Not right now' }
]

const OTHER_EVENT_VALUE = 'other'

// Shown exactly once, between first signup and first home-page view, for
// student/educator accounts only. profiles.onboarding_completed is the single
// source of truth — App.jsx gates on it, this page just flips it to true.
export default function Onboarding() {
  const { user, updateProfile } = useAuth()
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [eventOther, setEventOther] = useState('')
  const [rating, setRating] = useState(0)
  const [collaboration, setCollaboration] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .then(({ data }) => setEvents(data || []))
  }, [])

  const isOther = selectedEventId === OTHER_EVENT_VALUE
  const eventAnswered = selectedEventId !== '' && (!isOther || eventOther.trim() !== '')
  const canContinue = eventAnswered && rating > 0 && collaboration !== ''

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canContinue) return
    setError('')
    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('onboarding_responses').insert({
        user_id: user.id,
        event_id: isOther ? null : selectedEventId,
        event_other: isOther ? eventOther.trim() : null,
        event_rating: rating,
        collaboration_interest: collaboration
      })
      if (insertError) throw insertError
      await updateProfile({ onboarding_completed: true })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <BrandLogo className="auth-brand" />
        <p className="eyebrow">Before you start</p>
        <h1>A few quick questions</h1>
        <p className="subtitle">This takes under a minute and only appears once.</p>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Which event did you join?</span>
            <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
              <option value="" disabled>
                Select…
              </option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                  {event.event_date ? ` · ${event.event_date}` : ''}
                </option>
              ))}
              <option value={OTHER_EVENT_VALUE}>Other / not listed</option>
            </select>
          </label>

          {isOther && (
            <label className="field">
              <span>Tell us which one</span>
              <input
                type="text"
                value={eventOther}
                onChange={(e) => setEventOther(e.target.value)}
                placeholder="Event name"
              />
            </label>
          )}

          <div className="field">
            <span>How would you rate the event so far?</span>
            <div className="role-picker">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`role-pill ${rating === n ? 'role-pill-active' : ''}`}
                  onClick={() => setRating(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Are you interested in collaborating with Würth Elektronik later?</span>
            <div className="role-picker">
              {COLLABORATION_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`role-pill ${collaboration === opt.value ? 'role-pill-active' : ''}`}
                  onClick={() => setCollaboration(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-we" disabled={!canContinue || submitting}>
            <span className="btn-we-label">{submitting ? 'Saving…' : 'Continue'}</span>
            <span className="btn-we-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}
