import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerificationPending from './pages/VerificationPending'
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

  // Students/educators only — wurth_employee accounts skip the mock
  // university-affiliation check entirely (see Signup.jsx) and are always
  // "verified". This gate runs before onboarding: no access to the rest of
  // the app, including the one-time onboarding step, until verified.
  const needsVerification =
    (profile.role === 'student' || profile.role === 'educator') &&
    profile.verification_status !== 'verified'

  if (needsVerification) {
    return <VerificationPending />
  }

  const needsOnboarding =
    (profile.role === 'student' || profile.role === 'educator') && !profile.onboarding_completed

  if (needsOnboarding) {
    return <Onboarding />
  }

  return <Home />
}
