import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null) // row from the "profiles" table: name, email, role, role_data
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial load
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadProfile(data.session.user.id)
      else setLoading(false)
    })

    // Keep in sync as the user logs in/out elsewhere (e.g. another tab)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) loadProfile(newSession.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    // Excludes `email`: the DB only grants that column to the row owner /
    // wurth_employee accounts via get_profile_email() (see
    // supabase/schema.sql), not through a blanket select. The signed-in
    // user's own email comes from the auth session (`user.email`) instead.
    const { data } = await supabase
      .from('profiles')
      .select('id, name, role, role_data, source_event_id, onboarding_completed, verification_status, cv_file_path, created_at')
      .eq('id', userId)
      .single()
    setProfile(data || null)
    setLoading(false)
  }

  // name, email, password, role ('student' | 'educator' | 'wurth_employee'), roleData (role-specific fields)
  // verificationStatus: 'verified' | 'pending' — decided by Signup.jsx's mock
  // university-affiliation check before this is called (see UNIVERSITY_EMAIL_ALLOWLIST).
  async function signup({ name, email, password, role, roleData, sourceEventId, verificationStatus }) {
    // Metadata goes through options.data, not a follow-up client insert: the
    // `profiles` row is created server-side by the on_auth_user_created
    // trigger (see supabase/schema.sql) so it doesn't depend on a session
    // existing yet — signUp() returns no session when email confirmation is
    // required, and an insert without one would be rejected by RLS.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          role_data: roleData || {},
          source_event_id: sourceEventId || null,
          verification_status: verificationStatus || 'pending'
        }
      }
    })
    if (error) throw error

    const user = data.user
    if (!user) throw new Error('Signup did not return a user — check your Supabase auth settings.')

    const row = {
      id: user.id,
      name,
      email,
      role,
      role_data: roleData || {},
      source_event_id: sourceEventId || null,
      verification_status: verificationStatus || 'pending'
    }
    setProfile(row)

    // If email confirmation is required, there will be no session yet.
    return { user, needsEmailConfirmation: !data.session }
  }

  async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await loadProfile(data.user.id)
    return data.user
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function updateProfile(partial) {
    if (!session) return
    const { error } = await supabase.from('profiles').update(partial).eq('id', session.user.id)
    if (error) throw error
    setProfile((prev) => ({ ...prev, ...partial }))
  }

  const value = {
    user: session?.user || null,
    profile,
    loading,
    signup,
    login,
    logout,
    updateProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
