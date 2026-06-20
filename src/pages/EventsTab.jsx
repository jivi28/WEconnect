import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

export default function EventsTab() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [addingEvent, setAddingEvent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    const [{ data: allEvents }, { data: joined }] = await Promise.all([
      supabase.from('events').select('*'),
      supabase.from('user_events').select('event_id, events(name, event_date)').eq('user_id', user.id)
    ])
    setEvents(allEvents || [])
    setMyEvents(joined || [])
    setLoading(false)
  }

  async function handleAddEvent() {
    if (!selectedEventId) return
    setAddingEvent(true)
    try {
      const { error } = await supabase.from('user_events').insert({ user_id: user.id, event_id: selectedEventId })
      if (error) throw error
      setSelectedEventId('')
      await loadEvents()
    } finally {
      setAddingEvent(false)
    }
  }

  if (loading) return <div className="panel">Loading events…</div>

  const joinedEventIds = new Set(myEvents.map((e) => e.event_id))

  return (
    <div className="panel">
      <p className="eyebrow">Events</p>
      <h2>Upcoming &amp; past events</h2>
      <p className="subtitle">Add the ones you've attended — admins use this to plan ahead.</p>

      {events.length === 0 ? (
        <p className="muted">No events have been added yet</p>
      ) : (
        <div className="tile-grid">
          {events.map((ev) => (
            <div key={ev.id} className="tile-card">
              <span className="tile-card-meta">{ev.event_date || 'Date TBD'}</span>
              <span className="tile-card-label">
                {ev.name}
                {joinedEventIds.has(ev.id) && ' · Added'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Add an event you attended</h3>
        </div>
        {events.length === 0 ? (
          <p className="muted">No events have been added yet</p>
        ) : (
          <div className="card-actions">
            <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
              <option value="">Select an event…</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
            <button className="btn-secondary" onClick={handleAddEvent} disabled={!selectedEventId || addingEvent}>
              {addingEvent ? 'Adding…' : 'Add'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
