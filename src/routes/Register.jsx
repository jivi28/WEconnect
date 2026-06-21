import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Landing from '../components/Landing'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import BrandLogo from '../components/BrandLogo'

// QR target: /register?e=<qr_token>
// Funnel: landing (shows which event) → event signup (event locked in) → slides.
// The full "Create your account" form (Signup with eventToken) attributes the
// attendee to the event (source_event_id); the handle_new_user DB trigger then
// creates their profile AND the user_events row that unlocks the slides.
export default function Register() {
  const [params] = useSearchParams()
  const token = params.get('e')
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [loadErr, setLoadErr] = useState('')
  const [step, setStep] = useState('landing') // 'landing' | 'signup' | 'login'

  useEffect(() => {
    if (!token) return
    supabase.rpc('event_by_qr_token', { token }).then(({ data, error }) => {
      if (error) return setLoadErr(error.message)
      if (!data || data.length === 0) return setLoadErr('Unknown event QR code.')
      setEvent(data[0])
    })
  }, [token])

  if (!token || loadErr) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <BrandLogo onHome={() => navigate('/')} className="auth-brand" />
          <p className="eyebrow">Event registration</p>
          <h1>Registration</h1>
          <p className="error">
            {loadErr || 'No event token in the link. Scan a valid event QR code.'}
          </p>
          <p className="switch-line">
            <Link to="/">Back to home</Link>
          </p>
        </div>
      </div>
    )
  }

  if (step === 'signup') {
    return <Signup eventToken={token} onHome={() => setStep('landing')} />
  }

  if (step === 'login') {
    return (
      <Login
        onSwitchToSignup={() => setStep('signup')}
        onLoggedIn={() => navigate('/slides')}
        onHome={() => setStep('landing')}
      />
    )
  }

  return (
    <Landing event={event} onSignup={() => setStep('signup')} onLogin={() => setStep('login')} />
  )
}
