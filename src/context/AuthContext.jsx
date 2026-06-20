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
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data || null)
    setLoading(false)
  }

  // name, email, password, role ('student' | 'educator' | 'admin'), roleData (role-specific fields)
  async function signup({ name, email, password, role, roleData, sourceEventId }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    const user = data.user
    if (!user) throw new Error('Signup did not return a user — check your Supabase auth settings.')

    const row = {
      id: user.id,
      name,
      email,
      role,
      role_data: roleData || {},
      source_event_id: sourceEventId || null
    }
    const { error: profileError } = await supabase.from('profiles').insert(row)
    if (profileError) throw profileError

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
