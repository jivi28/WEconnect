import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, SLIDES_BUCKET } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import { formatDate } from '../lib/format'
import LoginForm from '../components/LoginForm'

// Attendee view: lists the events the signed-in user is registered for that
// have slides, and lets them download via a short-lived signed URL.
export default function Slides() {
  const { session, loading } = useSession()
  const [rows, setRows] = useState([])
  const [sourceEventId, setSourceEventId] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!session?.user) return
    supabase
      .from('user_events')
      .select('event_id, events ( id, name, event_date, slides_path )')
      .eq('user_id', session.user.id)
      .then(({ data, error }) => {
        if (error) return setErr(error.message)
        setRows((data || []).map((r) => r.events).filter(Boolean))
      })
    // Which event drove this user's signup (attribution).
    supabase
      .from('profiles')
      .select('source_event_id')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setSourceEventId(data?.source_event_id ?? null))
  }, [session])

  async function download(slidesPath) {
    setErr('')
    const { data, error } = await supabase.storage
      .from(SLIDES_BUCKET)
      .createSignedUrl(slidesPath, 3600)
    if (error) return setErr(error.message)
    window.open(data.signedUrl, '_blank')
  }

  if (loading) return <div className="wrap"><p>Loading…</p></div>

  if (!session) {
    return (
      <div className="wrap">
        <h1>My event slides</h1>
        <p className="muted">Sign in to view slides for events you registered for.</p>
        <LoginForm title="Attendee sign in" />
        <Link to="/">Home</Link>
      </div>
    )
  }

  const withSlides = rows.filter((e) => e.slides_path)
  const withoutSlides = rows.filter((e) => !e.slides_path)
  const joinedVia = rows.find((e) => e.id === sourceEventId)

  return (
    <div className="wrap">
      <h1>My event slides</h1>
      <p className="muted">
        Signed in as {session.user.email} —{' '}
        <a href="#" onClick={() => supabase.auth.signOut()}>sign out</a>
      </p>

      {joinedVia && (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            You joined WEconnect via: <b>{joinedVia.name}</b>
          </p>
        </div>
      )}

      {err && <p className="err">{err}</p>}

      {withSlides.length === 0 && (
        <div className="card">
          <p className="muted">No slides available for your events yet.</p>
        </div>
      )}

      {withSlides.map((e) => (
        <div className="card" key={e.id}>
          <h2>
            {e.name}
            {e.id === sourceEventId && (
              <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
                {'  '}— you joined via this event
              </span>
            )}
          </h2>
          <p className="muted">{formatDate(e.event_date)}</p>
          <button onClick={() => download(e.slides_path)}>Download slides</button>
        </div>
      ))}

      {withoutSlides.length > 0 && (
        <div className="card">
          <h2>Registered (slides not uploaded yet)</h2>
          <ul className="muted">
            {withoutSlides.map((e) => (
              <li key={e.id}>{e.name}</li>
            ))}
          </ul>
        </div>
      )}

      <Link to="/">Home</Link>
    </div>
  )
}
