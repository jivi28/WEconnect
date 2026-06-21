import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
  const [ev, setEv] = useState(null)
  const [hostNames, setHostNames] = useState({})
  const [qr, setQr] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [hostEmail, setHostEmail] = useState('')
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
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', ids)
      const map = {}
      ;(profs || []).forEach((p) => (map[p.id] = p.name || p.email))
      setHostNames(map)
    } else {
      setHostNames({})
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
    setErr(''); setOk('')
    const email = hostEmail.trim()
    if (!email) return
    const { data: p, error } = await supabase
      .from('profiles').select('id, role').eq('email', email).maybeSingle()
    if (error) return setErr(error.message)
    if (!p) return setErr('No user with that email.')
    if (p.role !== 'wurth_employee') return setErr('Hosts must be Würth employees.')
    if ((ev.host_ids || []).includes(p.id)) return setErr('Already a host.')
    const upd = await supabase
      .from('events').update({ host_ids: [...(ev.host_ids || []), p.id] }).eq('id', ev.id)
    if (upd.error) setErr(upd.error.message)
    else { setHostEmail(''); setOk('Host added.'); await load() }
  }

  async function removeHost(uid) {
    setErr(''); setOk('')
    const next = (ev.host_ids || []).filter((x) => x !== uid)
    const upd = await supabase.from('events').update({ host_ids: next }).eq('id', ev.id)
    if (upd.error) setErr(upd.error.message)
    else await load()
  }

  if (err && !ev) {
    return (
      <div className="wrap">
        <div className="card"><p className="err">{err}</p></div>
        <Link to="/admin">← All events</Link>
      </div>
    )
  }
  if (!ev) return <div className="wrap"><p>Loading…</p></div>

  const registerUrl = buildRegisterUrl(ev.qr_token)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(registerUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard may be blocked on http; link is shown anyway */ }
  }

  return (
    <div className="wrap">
      <Link to="/admin">← All events</Link>
      <h1>{ev.name}</h1>
      <p className="muted">{formatDate(ev.event_date || ev.start_date)}</p>

      <div className="card">
        <h2>Slides</h2>
        <p className="muted">
          {ev.slides_path ? `Uploaded: ${ev.slides_path}` : 'No slides uploaded.'}
        </p>
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,application/pdf"
          disabled={busy}
          onChange={(e) => uploadSlides(e.target.files?.[0])}
        />
        {ev.slides_path && (
          <div>
            <button className="secondary" disabled={busy} onClick={removeSlides}>
              Remove slides
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>QR code</h2>
        <p className="muted">
          This is the event's permanent QR code — the same for every host. Attendees
          scan it to register and unlock these slides.
        </p>
        {qr && <img className="qr" src={qr} alt="event QR" />}
        <p className="muted" style={{ wordBreak: 'break-all' }}>{registerUrl}</p>
        <div className="row">
          {qr && <a href={qr} download={`qr-${ev.qr_token}.png`}><button>Download PNG</button></a>}
          <button className="secondary" style={{ marginTop: 0 }} onClick={copyLink}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <a href={registerUrl} target="_blank" rel="noreferrer">
            <button className="secondary" style={{ marginTop: 0 }}>Open registration page</button>
          </a>
        </div>
      </div>

      <div className="card">
        <h2>Hosts</h2>
        {(ev.host_ids || []).length === 0 && <p className="muted">No hosts.</p>}
        <ul className="muted">
          {(ev.host_ids || []).map((uid) => (
            <li key={uid} className="row">
              {hostNames[uid] || uid}{' '}
              <button
                className="secondary"
                style={{ marginTop: 0, padding: '2px 8px' }}
                onClick={() => removeHost(uid)}
              >
                remove
              </button>
            </li>
          ))}
        </ul>
        <div className="row">
          <input
            placeholder="wurth employee email"
            value={hostEmail}
            onChange={(e) => setHostEmail(e.target.value)}
          />
          <button style={{ marginTop: 0 }} onClick={addHost}>Add host</button>
        </div>
      </div>

      {err && <p className="err">{err}</p>}
      {ok && <p className="ok">{ok}</p>}
    </div>
  )
}
