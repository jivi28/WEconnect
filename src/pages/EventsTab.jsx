import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { SLIDES_BUCKET } from '../lib/supabase'
import { formatEventDate, isPastEvent, splitJoinedEvents } from '../lib/events'

function SidebarEventRow({ event, onOpen }) {
  const past = isPastEvent(event.event_date)
  return (
    <li
      className="sidebar-event-row"
      onClick={onOpen ? () => onOpen(event.id) : undefined}
      style={onOpen ? { cursor: 'pointer' } : undefined}
    >
      <div>
        <p className="sidebar-event-name">{event.name}</p>
        <p className="sidebar-event-date">{formatEventDate(event.event_date)}</p>
      </div>
      <span className={`status-dot ${past ? 'status-dot-past' : 'status-dot-upcoming'}`} aria-hidden="true" />
    </li>
  )
}

function EventTile({ event, joined, onSignUp, signingUp, allowSignup, onOpen }) {
  const past = isPastEvent(event.event_date)
  const canSignUp = allowSignup && !past
  return (
    <div
      className="tile-card"
      style={{
        ...(event.thumbnail_url ? { backgroundImage: `url(${event.thumbnail_url})`, backgroundSize: 'cover' } : undefined),
        ...(onOpen ? { cursor: 'pointer' } : undefined)
      }}
      onClick={onOpen ? () => onOpen(event.id) : undefined}
    >
      <span className="tile-card-meta">{formatEventDate(event.event_date)}</span>
      <span className="tile-card-label">{event.name}</span>
      {canSignUp && (
        <button
          type="button"
          className="tile-card-signup"
          onClick={(e) => { e.stopPropagation(); onSignUp(event.id) }}
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
  const navigate = useNavigate()
  const isWurthEmployee = profile.role === 'wurth_employee'
  const [events, setEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [signingUp, setSigningUp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signupError, setSignupError] = useState('')

  // Students/educators get a read-only look (host + slides, no QR) via this
  // in-tab modal; wurth_employee accounts go straight to the full event
  // stage (QR code, slides, hosts) at /admin/:eventId instead.
  const [viewingEvent, setViewingEvent] = useState(null)
  const [viewHosts, setViewHosts] = useState([])
  const [viewErr, setViewErr] = useState('')
  const [downloading, setDownloading] = useState(false)

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

  async function handleCancelSignup(eventId) {
    setSignupError('')
    setSigningUp(eventId)
    try {
      const { error } = await supabase
        .from('user_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId)
      if (error) throw error
      await loadEvents()
    } catch (err) {
      setSignupError(err.message || 'Could not leave the event. Please try again.')
    } finally {
      setSigningUp(null)
    }
  }

  async function openEventDetail(eventId) {
    const event = events.find((ev) => ev.id === eventId)
    if (!event) return
    setViewErr('')
    setViewingEvent(event)
    const ids = event.host_ids || []
    if (!ids.length) {
      setViewHosts([])
      return
    }
    const { data, error } = await supabase.from('profiles').select('id, name').in('id', ids)
    if (error) setViewErr(error.message)
    setViewHosts(data || [])
  }

  function closeEventDetail() {
    setViewingEvent(null)
    setViewHosts([])
    setViewErr('')
  }

  async function downloadSlides() {
    if (!viewingEvent?.slides_path) return
    setViewErr('')
    setDownloading(true)
    const { data, error } = await supabase.storage
      .from(SLIDES_BUCKET)
      .createSignedUrl(viewingEvent.slides_path, 3600)
    setDownloading(false)
    if (error) return setViewErr(error.message)
    window.open(data.signedUrl, '_blank')
  }

  if (loading) return <div className="panel">Loading events…</div>

  const joinedEventIds = new Set(myEvents.map((e) => e.event_id))
  const { going, attended } = splitJoinedEvents(myEvents)
  // host_ids (added by email on the event stage) is the real "who hosts
  // this" list; organizer_id is an older single-owner field some events
  // still carry. Checking both means an event shows up here as soon as
  // someone's added as a host, not just for whoever created it.
  const hosting = events
    .filter((ev) => (ev.host_ids || []).includes(user.id) || ev.organizer_id === user.id)
    .sort((a, b) => new Date(a.event_date || 0) - new Date(b.event_date || 0))

  // Event stage (QR code, slides, hosts) is admin-only management; everyone
  // else gets the read-only modal (host + slides, no QR) instead.
  const onOpenEvent = isWurthEmployee ? (eventId) => navigate(`/admin/${eventId}`) : openEventDetail

  const mainEvents = isWurthEmployee ? events : events.filter((ev) => !joinedEventIds.has(ev.id))
  const upcomingMain = mainEvents
    .filter((ev) => !isPastEvent(ev.event_date))
    .sort((a, b) => new Date(a.event_date || 0) - new Date(b.event_date || 0))
  const pastMain = mainEvents
    .filter((ev) => isPastEvent(ev.event_date))
    .sort((a, b) => new Date(b.event_date || 0) - new Date(a.event_date || 0))

  return (
    <>
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
                  <SidebarEventRow key={ev.id} event={ev} onOpen={onOpenEvent} />
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
                    <SidebarEventRow key={ev.id} event={ev} onOpen={onOpenEvent} />
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
                    <SidebarEventRow key={ev.id} event={ev} onOpen={onOpenEvent} />
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </aside>

      <div className="events-main">
        <div className="events-main-header">
          <div>
            <p className="eyebrow">Events</p>
            <h2>Würth Elektronik events</h2>
            <p className="subtitle">
              {isWurthEmployee
                ? 'Everything the company is running right now. Click an event to manage its QR code, slides, and hosts.'
                : "Sign up for anything that looks interesting — it'll show up under Going."}
            </p>
          </div>
          {isWurthEmployee && (
            <button type="button" className="btn-cta" onClick={() => navigate('/admin/new')}>
              + New event
            </button>
          )}
        </div>

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
                    onOpen={onOpenEvent}
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
                    onOpen={onOpenEvent}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {viewingEvent && (
      <div className="modal-overlay" onClick={closeEventDetail}>
        <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="modal-close" onClick={closeEventDetail} aria-label="Close">
            ✕
          </button>
          <p className="eyebrow">Event</p>
          <h2>{viewingEvent.name}</h2>
          <p className="subtitle">{formatEventDate(viewingEvent.event_date)}</p>
          {viewingEvent.description && <p className="muted">{viewingEvent.description}</p>}

          <div className="card-header" style={{ marginTop: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>Hosted by</h3>
          </div>
          {viewHosts.length === 0 ? (
            <p className="muted">No hosts listed yet.</p>
          ) : (
            <ul className="host-list">
              {viewHosts.map((h) => (
                <li key={h.id} className="host-row">
                  <span>{h.name}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="card-header" style={{ marginTop: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>Slides</h3>
          </div>
          {viewingEvent.slides_path ? (
            joinedEventIds.has(viewingEvent.id) ? (
              <button type="button" className="btn-secondary-we" disabled={downloading} onClick={downloadSlides}>
                {downloading ? 'Preparing…' : 'Download slides'}
              </button>
            ) : (
              <p className="muted">Sign up for this event to unlock its slides.</p>
            )
          ) : (
            <p className="muted">No slides uploaded yet.</p>
          )}

          {joinedEventIds.has(viewingEvent.id) && !isPastEvent(viewingEvent.event_date) && (
            <div className="card-actions" style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                className="link-btn-danger"
                disabled={signingUp === viewingEvent.id}
                onClick={async () => {
                  await handleCancelSignup(viewingEvent.id)
                  closeEventDetail()
                }}
              >
                {signingUp === viewingEvent.id ? 'Leaving…' : "Leave event — I'm not attending"}
              </button>
            </div>
          )}

          {viewErr && <p className="error">{viewErr}</p>}
        </div>
      </div>
    )}
    </>
  )
}
