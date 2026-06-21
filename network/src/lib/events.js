// Shared by EventsTab and Profile: events have no explicit "status" column —
// going vs. attended is just event_date relative to now.

export function formatEventDate(value) {
  if (!value) return 'Date TBD'
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function isPastEvent(eventDate) {
  if (!eventDate) return false
  return new Date(eventDate) < new Date()
}

// rows: array of { event_id, events: { id, name, event_date, ... } } (the
// shape Supabase returns from a user_events select with an events() join).
export function splitJoinedEvents(rows) {
  const going = []
  const attended = []
  for (const row of rows) {
    const event = row.events
    if (!event) continue
    if (isPastEvent(event.event_date)) attended.push(event)
    else going.push(event)
  }
  going.sort((a, b) => new Date(a.event_date || 0) - new Date(b.event_date || 0))
  attended.sort((a, b) => new Date(b.event_date || 0) - new Date(a.event_date || 0))
  return { going, attended }
}
