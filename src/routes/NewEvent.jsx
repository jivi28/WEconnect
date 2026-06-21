import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import RequireWurthEmployee from '../components/RequireWurthEmployee'

// Standalone "create event" page — the "+ New event" entry point from the
// Events tab lands here directly instead of on the admin overview (which
// would just re-show the same event list the Events tab already has).
export default function NewEvent() {
  return (
    <RequireWurthEmployee>{() => <NewEventCard />}</RequireWurthEmployee>
  )
}

function NewEventCard() {
  const navigate = useNavigate()
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
    // qr_token and host_ids both default on the DB (host_ids to '{}') — hosts
    // are added explicitly by email on the event page, not auto-assigned to
    // whoever created the event.
    const { data, error } = await supabase
      .from('events')
      .insert({
        name: form.name.trim(),
        event_date: form.event_date || null,
        start_date: form.event_date || null,
        city: form.city.trim() || null,
        description: form.description.trim() || null,
        is_wuerth: form.is_wuerth,
      })
      .select('id')
      .single()
    setBusy(false)
    if (error) return setErr(error.message)
    navigate(`/admin/${data.id}`)
  }

  return (
    <div className="shell">
      <header className="topbar">
        <p className="we-wordmark" style={{ margin: 0 }}>
          WE<span>connect</span>
        </p>
      </header>
      <main className="main">
        <div className="panel event-admin-panel">
          <Link to="/" state={{ initialTab: 'events' }} className="admin-back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to events
          </Link>
          <p className="eyebrow">Event admin</p>
          <h1>New event</h1>
          <p className="subtitle">Set the basics now — slides, the QR code, and hosts come next.</p>

          <div className="card">
            <form onSubmit={createEvent} className="form">
              <label className="field">
                <span>Name *</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Campus Tech Talk"
                  required
                />
              </label>

              <label className="field">
                <span>Date</span>
                <input type="date" value={form.event_date} onChange={(e) => set('event_date', e.target.value)} />
              </label>

              <label className="field">
                <span>City</span>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="e.g. Munich"
                />
              </label>

              <label className="field">
                <span>Description</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="What's this event about?"
                />
              </label>

              <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={form.is_wuerth}
                  onChange={(e) => set('is_wuerth', e.target.checked)}
                />
                <span style={{ textTransform: 'none', fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--ink)' }}>
                  Würth event
                </span>
              </label>

              {err && <p className="error">{err}</p>}

              <button type="submit" className="btn-primary-we" disabled={busy}>
                {busy ? 'Creating…' : 'Create event'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
