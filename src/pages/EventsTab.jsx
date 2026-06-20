import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { formatEventDate, isPastEvent, splitJoinedEvents } from '../lib/events'

function SidebarEventRow({ event }) {
  const past = isPastEvent(event.event_date)
  return (
    <li className="sidebar-event-row">
      <div>
        <p className="sidebar-event-name">{event.name}</p>
        <p className="sidebar-event-date">{formatEventDate(event.event_date)}</p>
      </div>
      <span className={`status-dot ${past ? 'status-dot-past' : 'status-dot-upcoming'}`} aria-hidden="true" />
    </li>
  )
}

function EventTile({ event, joined, onSignUp, signingUp, allowSignup }) {
  const past = isPastEvent(event.event_date)
  const canSignUp = allowSignup && !past
  return (
    <div
      className="tile-card"
      style={event.thumbnail_url ? { backgroundImage: `url(${event.thumbnail_url})`, backgroundSize: 'cover' } : undefined}
    >
      <span className="tile-card-meta">{formatEventDate(event.event_date)}</span>
      <span className="tile-card-label">{event.name}</span>
      {canSignUp && (
        <button
          type="button"
          className="tile-card-signup"
          onClick={() => onSignUp(event.id)}
          disabled={joined || signingUp === event.id}
        >
          {joined ? 'Signed up ✓' : signingUp === event.id ? 'Signing up…' : '+ Sign up'}
        </button>
      )}
      {past && !canSignUp && joined && <span className="tile-card-signup tile-card-signup-static">Attended</span>}
    </div>
  )
}

export default function EventsTab() {
  const { user, profile } = useAuth()
  const isWurthEmployee = profile.role === 'wurth_employee'
  const [events, setEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [signingUp, setSigningUp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signupError, setSignupError] = useState('')

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    const [{ data: allEvents }, { data: joined }] = await Promise.all([
      supabase.from('events').select('*'),
      supabase.from('user_events').select('event_id, events(*)').eq('user_id', user.id)
    ])
    setEvents(allEvents || [])
    setMyEvents(joined || [])
    setLoading(false)
  }

  async function handleSignUp(eventId) {
    setSignupError('')
    const event = events.find((ev) => ev.id === eventId)
    if (event && isPastEvent(event.event_date)) {
      setSignupError("Can't sign up — that event has already happened.")
      return
    }
    setSigningUp(eventId)
    try {
      const { error } = await supabase.from('user_events').insert({ user_id: user.id, event_id: eventId })
      if (error) throw error
      await loadEvents()
    } catch (err) {
      setSignupError(err.message || 'Could not sign up. Please try again.')
    } finally {
      setSigningUp(null)
    }
  }

  if (loading) return <div className="panel">Loading events…</div>

  const joinedEventIds = new Set(myEvents.map((e) => e.event_id))
  const { going, attended } = splitJoinedEvents(myEvents)
  const hosting = events
    .filter((ev) => ev.organizer_id === user.id)
    .sort((a, b) => new Date(a.event_date || 0) - new Date(b.event_date || 0))

  const mainEvents = isWurthEmployee ? events : events.filter((ev) => !joinedEventIds.has(ev.id))
  const upcomingMain = mainEvents
    .filter((ev) => !isPastEvent(ev.event_date))
    .sort((a, b) => new Date(a.event_date || 0) - new Date(b.event_date || 0))
  const pastMain = mainEvents
    .filter((ev) => isPastEvent(ev.event_date))
    .sort((a, b) => new Date(b.event_date || 0) - new Date(a.event_date || 0))

  return (
    <div className="events-layout">
      <aside className="events-sidebar">
        {isWurthEmployee ? (
          <div className="sidebar-section">
            <p className="eyebrow">Hosting</p>
            {hosting.length === 0 ? (
              <p className="muted">You're not hosting any events yet.</p>
            ) : (
              <ul className="sidebar-event-list">
                {hosting.map((ev) => (
                  <SidebarEventRow key={ev.id} event={ev} />
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            <div className="sidebar-section">
              <p className="eyebrow">Going</p>
              {going.length === 0 ? (
                <p className="muted">No upcoming events yet.</p>
              ) : (
                <ul className="sidebar-event-list">
                  {going.map((ev) => (
                    <SidebarEventRow key={ev.id} event={ev} />
                  ))}
                </ul>
              )}
            </div>
            <div className="sidebar-section">
              <p className="eyebrow">Attended</p>
              {attended.length === 0 ? (
                <p className="muted">No past events yet.</p>
              ) : (
                <ul className="sidebar-event-list">
                  {attended.map((ev) => (
                    <SidebarEventRow key={ev.id} event={ev} />
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </aside>

      <div className="events-main">
        <p className="eyebrow">Events</p>
        <h2>Würth Elektronik events</h2>
        <p className="subtitle">
          {isWurthEmployee
            ? 'Everything the company is running right now.'
            : "Sign up for anything that looks interesting — it'll show up under Going."}
        </p>

        {signupError && <p className="error">{signupError}</p>}

        {mainEvents.length === 0 ? (
          <p className="muted">
            {isWurthEmployee ? 'No events have been added yet.' : "You're signed up for everything on offer."}
          </p>
        ) : (
          <>
            <h3 className="section-heading">Upcoming events</h3>
            {upcomingMain.length === 0 ? (
              <p className="muted">No upcoming events right now.</p>
            ) : (
              <div className="tile-grid">
                {upcomingMain.map((ev) => (
                  <EventTile
                    key={ev.id}
                    event={ev}
                    joined={joinedEventIds.has(ev.id)}
                    onSignUp={handleSignUp}
                    signingUp={signingUp}
                    allowSignup={!isWurthEmployee}
                  />
                ))}
              </div>
            )}

            <h3 className="section-heading">Past events</h3>
            {pastMain.length === 0 ? (
              <p className="muted">No past events yet.</p>
            ) : (
              <div className="tile-grid">
                {pastMain.map((ev) => (
                  <EventTile
                    key={ev.id}
                    event={ev}
                    joined={joinedEventIds.has(ev.id)}
                    onSignUp={handleSignUp}
                    signingUp={signingUp}
                    allowSignup={false}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
