import { useAuth } from '../context/AuthContext'

// Adapts the app's single auth source (AuthContext) to the {session, profile,
// loading} shape the QR-feature components (RequireWurthEmployee, Slides,
// Register) expect, instead of running a second supabase.auth listener +
// profile fetch in parallel with AuthProvider's.
export function useSession() {
  const { user, profile, loading } = useAuth()
  return { session: user ? { user } : null, profile, loading }
}
