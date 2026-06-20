import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import RequireWurthEmployee from '../components/RequireWurthEmployee'

// Local (not UTC) date as YYYY-MM-DD, so "today" matches the user's clock.
const todayISO = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
// Classify and sort by the date actually shown to the user (the event's date).
const eventDate = (e) => e.event_date || e.start_date || ''
// Past once that date is before today; events today or later stay upcoming.
const isFinished = (e) => {
  const d = eventDate(e)
  return d ? d < todayISO() : false
}

// Overview of ALL events. Management (upload slides / QR / hosts) lives on the
// per-event detail page (/admin/:eventId).
export default function Admin() {
  return (
    <RequireWurthEmployee>
      {({ session }) => <AdminOverview session={session} />}
    </RequireWurthEmployee>
  )
}

function AdminOverview({ session }) {
  const [events, setEvents] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    async function load() {
      setErr('')
      // Management fields from events...
      const ev = await supabase
        .from('events')
        .select('id, name, event_date, start_date, end_date, slides_path, host_ids')
      if (ev.error) return setErr(ev.error.message)

      // ...and signups-via-QR from the existing analytics view.
      const mx = await supabase.from('event_metrics').select('event_id, new_users')
      const signups = {}
      if (!mx.error) (mx.data || []).forEach((m) => (signups[m.event_id] = m.new_users))

      setEvents(
        (ev.data || []).map((e) => ({ ...e, new_users: signups[e.id] ?? 0 }))
      )
    }
    load()
  }, [])

  // Upcoming: ascending by date (closest to today first), undated pushed to the end.
  const upcoming = events
    .filter((e) => !isFinished(e))
    .sort((a, b) => (eventDate(a) || '9999').localeCompare(eventDate(b) || '9999'))
  // Past: descending by date (most recently finished first).
  const past = events
    .filter((e) => isFinished(e))
    .sort((a, b) => eventDate(b).localeCompare(eventDate(a)))

  return (
    <div className="wrap">
      <h1>Würth-employee admin</h1>
      <p className="muted">
        Signed in as {session.user.email} —{' '}
        <a href="#" onClick={() => supabase.auth.signOut()}>sign out</a>
      </p>
      <p className="muted">All events. Click one to upload slides and get its QR code.</p>

      <NewEventForm session={session} />

      {err && <p className="err">{err}</p>}

      {/* Upcoming: soonest (closest to today) first; undated last. */}
      <h2>Upcoming events</h2>
      {upcoming.length === 0 && <p className="muted">None.</p>}
      {upcoming.map((e) => <EventRow key={e.id} e={e} />)}

      {/* Past: most recently finished first. */}
      {past.length > 0 && (
        <>
          <h2 style={{ marginTop: 24 }}>Past events</h2>
          {past.map((e) => <EventRow key={e.id} e={e} />)}
        </>
      )}

      <Link to="/">Home</Link>
    </div>
  )
}

function EventRow({ e }) {
  return (
    <Link
      to={`/admin/${e.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="card" style={{ cursor: 'pointer' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>{e.name}</h2>
          <span className="muted">{formatDate(e.event_date || e.start_date)}</span>
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>
          Signups via QR: <b>{e.new_users}</b>
          {'  ·  '}Slides: {e.slides_path ? '✓ uploaded' : '— none'}
          {'  ·  '}Hosts: {(e.host_ids || []).length}
        </p>
      </div>
    </Link>
  )
}

function NewEventForm({ session }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '', event_date: '', city: '', description: '', is_wuerth: true,
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function createEvent(e) {
    e.preventDefault()
    setErr('')
    if (!form.name.trim()) return setErr('Name is required.')
    setBusy(true)
    // qr_token and host_ids default on the DB; the creator becomes a host so
    // they can manage the event right away.
    const { data, error } = await supabase
      .from('events')
      .insert({
        name: form.name.trim(),
        event_date: form.event_date || null,
        start_date: form.event_date || null,
        city: form.city.trim() || null,
        description: form.description.trim() || null,
        is_wuerth: form.is_wuerth,
        host_ids: [session.user.id],
      })
      .select('id')
      .single()
    setBusy(false)
    if (error) return setErr(error.message)
    navigate(`/admin/${data.id}`)
  }

  if (!open) {
    return (
      <div className="card">
        <button onClick={() => setOpen(true)}>+ New event</button>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>New event</h2>
      <form onSubmit={createEvent}>
        <label>Name *</label>
        <input value={form.name} onChange={(e) => set('name', e.target.value)} required />
        <label>Date</label>
        <input type="date" value={form.event_date} onChange={(e) => set('event_date', e.target.value)} />
        <label>City</label>
        <input value={form.city} onChange={(e) => set('city', e.target.value)} />
        <label>Description</label>
        <input value={form.description} onChange={(e) => set('description', e.target.value)} />
        <label className="row" style={{ marginTop: 12 }}>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={form.is_wuerth}
            onChange={(e) => set('is_wuerth', e.target.checked)}
          />
          {' '}Würth event
        </label>
        <div className="row">
          <button disabled={busy}>{busy ? 'Creating…' : 'Create event'}</button>
          <button
            type="button"
            className="secondary"
            style={{ marginTop: 8 }}
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </div>
      </form>
      {err && <p className="err">{err}</p>}
    </div>
  )
}
