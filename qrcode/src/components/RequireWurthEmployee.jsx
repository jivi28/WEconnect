import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import LoginForm from './LoginForm'

// Shared gate for the Würth-employee admin pages: shows a login form when
// signed out, a forbidden notice for non-employees, and the children otherwise.
export default function RequireWurthEmployee({ children }) {
  const { session, profile, loading } = useSession()

  if (loading) return <div className="wrap"><p>Loading…</p></div>

  if (!session) {
    return (
      <div className="wrap">
        <h1>Würth-employee admin</h1>
        <LoginForm title="Admin sign in" />
        <Link to="/">Home</Link>
      </div>
    )
  }

  // profile may still be loading right after sign-in
  if (!profile) return <div className="wrap"><p>Loading…</p></div>

  if (profile.role !== 'wurth_employee') {
    return (
      <div className="wrap">
        <h1>Würth-employee admin</h1>
        <div className="card">
          <p className="err">
            This area is for Würth employees only. Your role is <b>{profile.role}</b>.
          </p>
          <button className="secondary" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
        <Link to="/">Home</Link>
      </div>
    )
  }

  return children({ session, profile })
}
