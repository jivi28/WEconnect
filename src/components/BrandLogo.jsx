import { useNavigate } from 'react-router-dom'
import weConnectLogo from '../assets/we-connect-logo-transparent.png'

// Clickable WEconnect brand mark used across the auth/utility screens.
// Clicking it returns the user "home": if an `onHome` callback is given
// (e.g. the state-machine auth views in App.jsx / Register.jsx), it's called;
// otherwise we fall back to routing to "/".
export default function BrandLogo({ onHome, className = '', height = 32, style }) {
  const navigate = useNavigate()
  const goHome = onHome || (() => navigate('/'))

  return (
    <button
      type="button"
      className={`brand-logo-btn ${className}`}
      onClick={goHome}
      aria-label="Go to home"
      title="Home"
      style={style}
    >
      <img
        className="brand-logo-img"
        src={weConnectLogo}
        alt="WEconnect"
        style={{ height }}
      />
    </button>
  )
}
