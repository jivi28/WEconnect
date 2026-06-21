import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './components/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerificationPending from './pages/VerificationPending'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Admin from './routes/Admin'
import AdminEvent from './routes/AdminEvent'
import NewEvent from './routes/NewEvent'
import Register from './routes/Register'
import Slides from './routes/Slides'

// Router lives here (not main.jsx) so the QR routes get the same
// AuthProvider context as the rest of the app without touching main.jsx.
// Würth-employee admin (QR/slides/hosts) and the attendee-facing QR
// registration + slides routes sit outside the auth-gated "/*" app below —
// /register in particular must be reachable by someone scanning a QR code
// who has no account yet.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/new" element={<NewEvent />} />
        <Route path="/admin/:eventId" element={<AdminEvent />} />
        <Route path="/register" element={<Register />} />
        <Route path="/slides" element={<Slides />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  )
}

function MainApp() {
  const { user, profile, loading } = useAuth()
  const [authView, setAuthView] = useState('landing') // 'landing' | 'login' | 'signup'

  // Always return to the public landing page after logout, rather than the
  // login/signup view the user happened to leave behind before signing in.
  useEffect(() => {
    if (!user) setAuthView('landing')
  }, [user])

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading…</p>
      </div>
    )
  }

  if (!user || !profile) {
    if (authView === 'login') {
      return <Login onSwitchToSignup={() => setAuthView('signup')} />
    }
    if (authView === 'signup') {
      return <Signup onSwitchToLogin={() => setAuthView('login')} />
    }
    return (
      <Landing onSignup={() => setAuthView('signup')} onLogin={() => setAuthView('login')} />
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
