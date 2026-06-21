import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { supabase, SLIDES_BUCKET } from '../lib/supabase'
import { buildRegisterUrl } from '../lib/registerUrl'
import { formatDate } from '../lib/format'
import RequireWurthEmployee from '../components/RequireWurthEmployee'

// Per-event management: upload slides, the event's (permanent) QR code, hosts.
export default function AdminEvent() {
  return (
    <RequireWurthEmployee>{() => <EventDetail />}</RequireWurthEmployee>
  )
}

function EventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [ev, setEv] = useState(null)
  const [hosts, setHosts] = useState({})
  const [qr, setQr] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [hostEmail, setHostEmail] = useState('')
  const [hostErr, setHostErr] = useState('')
  const [hostOk, setHostOk] = useState('')
  const [copied, setCopied] = useState(false)

  async function load() {
    setErr('')
    const { data, error } = await supabase
      .from('events')
      .select('id, name, event_date, start_date, qr_token, slides_path, host_ids')
      .eq('id', eventId)
      .single()
    if (error) return setErr(error.message)
    setEv(data)

    const ids = data.host_ids || []
    if (ids.length) {
      // `email` has no direct SELECT grant for `authenticated` (column-level
      // lockdown in schema.sql) — name comes from the normal table read,
      // email from the wurth_employee-gated RPC built for exactly this.
      const [{ data: profs }, { data: emails }] = await Promise.all([
        supabase.from('profiles').select('id, name').in('id', ids),
        supabase.rpc('get_profile_emails', { target_ids: ids })
      ])
      const emailById = {}
      ;(emails || []).forEach((e) => (emailById[e.id] = e.email))
      const map = {}
      ;(profs || []).forEach((p) => (map[p.id] = { name: p.name, email: emailById[p.id] }))
      setHosts(map)
    } else {
      setHosts({})
    }
  }

  useEffect(() => { load() }, [eventId])

  // The QR is the event's permanent code: rendered automatically and identical
  // for every host on every visit (it encodes the fixed qr_token, never rotated).
  useEffect(() => {
    if (ev?.qr_token) {
      QRCode.toDataURL(buildRegisterUrl(ev.qr_token), { width: 240, margin: 1 })
        .then(setQr)
        .catch((e) => setErr(String(e)))
    }
  }, [ev?.qr_token])

  async function uploadSlides(file) {
    if (!file) return
    setErr(''); setOk(''); setBusy(true)
    const path = `${ev.id}/${file.name}`
    const up = await supabase.storage
      .from(SLIDES_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type || undefined })
    if (up.error) { setErr(up.error.message); setBusy(false); return }
    const { error } = await supabase
      .from('events').update({ slides_path: path }).eq('id', ev.id)
    if (error) setErr(error.message)
    else { setOk('Slides uploaded.'); await load() }
    setBusy(false)
  }

  async function removeSlides() {
    if (!ev.slides_path) return
    if (!window.confirm('Remove the uploaded slides for this event?')) return
    setErr(''); setOk(''); setBusy(true)
    // Delete the stored file. If it's already gone, still clear the reference.
    const rm = await supabase.storage.from(SLIDES_BUCKET).remove([ev.slides_path])
    if (rm.error) { setErr(rm.error.message); setBusy(false); return }
    const { error } = await supabase
      .from('events').update({ slides_path: null }).eq('id', ev.id)
    if (error) setErr(error.message)
    else { setOk('Slides removed.'); await load() }
    setBusy(false)
  }

  async function addHost() {
    setHostErr(''); setHostOk('')
    const email = hostEmail.trim()
    if (!email) return
    // Plain `.eq('email', ...)` can't be used here — the email column has no
    // SELECT grant for `authenticated`, so filtering on it is rejected
    // before RLS even runs. find_profile_by_email is the wurth_employee-
    // gated RPC built for this lookup (see migrations/0008).
    const { data, error } = await supabase.rpc('find_profile_by_email', { target_email: email })
    if (error) return setHostErr(error.message)
    const p = data?.[0]
    if (!p) return setHostErr('No user with that email.')
    if (p.role !== 'wurth_employee') return setHostErr('Hosts must be Würth employees.')
    if ((ev.host_ids || []).includes(p.id)) return setHostErr('Already a host.')
    const upd = await supabase
      .from('events').update({ host_ids: [...(ev.host_ids || []), p.id] }).eq('id', ev.id)
    if (upd.error) setHostErr(upd.error.message)
    else { setHostEmail(''); setHostOk('Host added.'); await load() }
  }

  async function removeHost(uid) {
    setHostErr(''); setHostOk('')
    const current = ev.host_ids || []
    // An event with zero hosts is unmanageable (nobody to upload slides,
    // rotate hosts, etc.), so the last host can't remove themselves —
    // someone else has to be added first. Enforced again on the DB side
    // (migrations/0009) since this check alone is just client-side UX.
    if (current.length <= 1) {
      setHostErr('An event must have at least one host — add another host before removing this one.')
      return
    }
    const next = current.filter((x) => x !== uid)
    const upd = await supabase.from('events').update({ host_ids: next }).eq('id', ev.id)
    if (upd.error) setHostErr(upd.error.message)
    else await load()
  }

  async function deleteEvent() {
    if (!window.confirm(`Delete "${ev.name}"? This can't be undone.`)) return
    setErr(''); setBusy(true)
    if (ev.slides_path) {
      await supabase.storage.from(SLIDES_BUCKET).remove([ev.slides_path])
    }
    // .select('id') so a missing/denying RLS policy surfaces as an empty
    // result (caught below) instead of looking like success: a delete that
    // matches zero rows under RLS returns no error either way.
    const { data, error } = await supabase.from('events').delete().eq('id', ev.id).select('id')
    setBusy(false)
    if (error) return setErr(error.message)
    if (!data || data.length === 0) {
      return setErr("Delete didn't go through — you may not have permission to delete this event.")
    }
    navigate('/', { state: { initialTab: 'events' } })
  }

  if (err && !ev) {
    return (
      <EventStageShell>
        <div className="panel event-admin-panel">
          <BackToEventsLink />
          <div className="card">
            <p className="error">{err}</p>
          </div>
        </div>
      </EventStageShell>
    )
  }
  if (!ev) {
    return (
      <EventStageShell>
        <div className="panel event-admin-panel">
          <p className="muted">Loading…</p>
        </div>
      </EventStageShell>
    )
  }

  const registerUrl = buildRegisterUrl(ev.qr_token)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(registerUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard may be blocked on http; link is shown anyway */ }
  }

  return (
    <EventStageShell>
      <div className="panel event-admin-panel">
        <BackToEventsLink />
        <p className="eyebrow">Event admin</p>
        <h1>{ev.name}</h1>
        <p className="subtitle">{formatDate(ev.event_date || ev.start_date)}</p>

        {err && <p className="error">{err}</p>}
        {ok && <p className="success">{ok}</p>}

        <div className="card">
          <div className="card-header">
            <h2>Slides</h2>
          </div>
          <p className="muted">
            {ev.slides_path ? `Uploaded: ${ev.slides_path}` : 'No slides uploaded yet.'}
          </p>
          <div className="file-field">
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,application/pdf"
              disabled={busy}
              onChange={(e) => uploadSlides(e.target.files?.[0])}
            />
          </div>
          {ev.slides_path && (
            <div className="card-actions">
              <button type="button" className="link-btn-danger" disabled={busy} onClick={removeSlides}>
                Remove slides
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>QR code</h2>
          </div>
          <p className="muted">
            This is the event's permanent QR code — the same for every host. Attendees
            scan it to register and unlock these slides.
          </p>
          <div className="qr-card-body">
            {qr && <img className="qr-image" src={qr} alt="event QR" />}
            <p className="qr-link">{registerUrl}</p>
          </div>
          <div className="card-actions">
            {qr && (
              <a href={qr} download={`qr-${ev.qr_token}.png`}>
                <button type="button" className="btn-primary-we">Download PNG</button>
              </a>
            )}
            <button type="button" className="btn-secondary-we" onClick={copyLink}>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <a href={registerUrl} target="_blank" rel="noreferrer">
              <button type="button" className="btn-secondary-we">Open registration page</button>
            </a>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Hosts</h2>
          </div>
          {(ev.host_ids || []).length === 0 && <p className="muted">No hosts yet.</p>}
          <ul className="host-list">
            {(ev.host_ids || []).map((uid) => (
              <li key={uid} className="host-row">
                <span>
                  <strong>{hosts[uid]?.name || 'Unknown'}</strong>
                  {hosts[uid]?.email ? ` · ${hosts[uid].email}` : ''}
                </span>
                <button type="button" className="link-btn-danger" onClick={() => removeHost(uid)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="host-add-row">
            <input
              type="text"
              placeholder="Würth employee email"
              value={hostEmail}
              onChange={(e) => setHostEmail(e.target.value)}
            />
            <button type="button" className="btn-secondary-we" onClick={addHost}>Add host</button>
          </div>
          {(hostErr || hostOk) && (
            <div className="field-alert-row">
              <span className={`field-alert ${hostErr ? 'field-alert-error' : 'field-alert-success'}`}>
                {hostErr || hostOk}
              </span>
            </div>
          )}
        </div>

        <div className="card card-danger">
          <div className="card-header">
            <h2>Delete event</h2>
          </div>
          <p className="muted">
            Permanently removes the event, its QR code, and its slides. This can't be undone.
          </p>
          <div className="card-actions">
            <button type="button" className="btn-danger" disabled={busy} onClick={deleteEvent}>
              Delete event
            </button>
          </div>
        </div>
      </div>
    </EventStageShell>
  )
}

function BackArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Single, left-aligned way back into the Events tab — used once per page
// (not duplicated in the topbar) so it stays the obvious, uncluttered exit.
function BackToEventsLink() {
  return (
    <Link to="/" state={{ initialTab: 'events' }} className="admin-back-link">
      <BackArrowIcon />
      Back to events
    </Link>
  )
}

// Same shell chrome (wordmark only) as the main app's topbar, so this
// standalone route doesn't look like a different site once you click through
// from the Events tab.
function EventStageShell({ children }) {
  return (
    <div className="shell">
      <header className="topbar">
        <p className="we-wordmark" style={{ margin: 0 }}>
          WE<span>connect</span>
        </p>
      </header>
      <main className="main">{children}</main>
    </div>
  )
}
