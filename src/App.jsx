import { Link } from 'react-router-dom'
import { useSession } from './lib/useSession'
import { supabase } from './lib/supabase'

export default function App() {
  const { session, profile } = useSession()

  return (
    <div className="wrap">
      <h1>WEconnect — Events</h1>
      <p className="muted">QR-driven event registration + slide access.</p>

      <div className="card">
        <h2>Navigation</h2>
        <nav>
          <Link to="/admin">Würth-employee admin</Link>
          <Link to="/slides">My event slides</Link>
        </nav>
        <p className="muted" style={{ marginTop: 12 }}>
          Attendees reach <code>/register?e=&lt;token&gt;</code> by scanning an
          event QR code (generated on the admin side).
        </p>
      </div>

      <div className="card">
        <h2>Session</h2>
        {session ? (
          <>
            <p className="muted">
              Signed in as <b>{session.user.email}</b>
              {profile?.role ? ` — role: ${profile.role}` : ''}
            </p>
            <button className="secondary" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          </>
        ) : (
          <p className="muted">Not signed in.</p>
        )}
      </div>
    </div>
  )
}
