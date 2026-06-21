import { useAuth } from '../context/AuthContext'
import BrandLogo from '../components/BrandLogo'

// Shown instead of the main app for student/educator accounts whose
// profiles.verification_status isn't "verified" yet (see App.jsx gating).
// There's no manual review queue in this hackathon build — accounts only
// reach this screen if the mock university-affiliation check in
// Signup.jsx didn't pass, and there's no self-serve way out of it here.
export default function VerificationPending() {
  const { profile, logout } = useAuth()
  const rejected = profile.verification_status === 'rejected'

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <BrandLogo className="auth-brand" />
        <p className="eyebrow">{rejected ? 'Verification failed' : 'Verification pending'}</p>
        <h1>{rejected ? "We couldn't verify your affiliation" : 'Hang tight — verifying your account'}</h1>
        <p className="subtitle">
          {rejected
            ? 'Your university/staff affiliation could not be confirmed, so this account is restricted. Contact your WEconnect organizer if you think this is a mistake.'
            : "We're confirming your university or staff affiliation before unlocking the dashboard and connections. This usually only takes a moment — try logging in again shortly."}
        </p>
        <button type="button" className="link-btn" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  )
}
