// Builds the registration URL encoded into an event's QR code.
//
// Defaults to the current origin, but can be overridden with
// VITE_PUBLIC_BASE_URL so the QR can point at a LAN IP / tunnel / deployed URL
// that a phone can actually reach (localhost is not reachable from a phone).
export function buildRegisterUrl(token) {
  const base = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin
  return `${base.replace(/\/$/, '')}/register?e=${token}`
}
