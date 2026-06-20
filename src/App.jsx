import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'

export default function App() {
  const { user, profile, loading } = useAuth()
  const [authView, setAuthView] = useState('login') // 'login' | 'signup'

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading…</p>
      </div>
    )
  }

  if (!user || !profile) {
    return authView === 'login' ? (
      <Login onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthView('login')} />
    )
  }

  const needsOnboarding =
    (profile.role === 'student' || profile.role === 'educator') && !profile.onboarding_completed

  if (needsOnboarding) {
    return <Onboarding />
  }

  return <Home />
}
