import type { Role } from '../types'

interface RoleIconProps {
  role: Role
  size?: number
  className?: string
}

export default function RoleIcon({ role, size = 12, className = '' }: RoleIconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className
  }

  if (role === 'student') {
    return (
      <svg {...props}>
        <path d="M2 9.5 12 5l10 4.5-10 4.5z" />
        <path d="M6 11.5v4.5c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
        <path d="M21 9.5v6" />
      </svg>
    )
  }

  if (role === 'educator') {
    return (
      <svg {...props}>
        <path d="M4 19.5V5.2c0-.7.5-1.2 1.1-1.2H18a1 1 0 0 1 1 1v14" />
        <path d="M4 19.5c0-1 1-1.5 2-1.5h13" />
        <path d="M8 7h7M8 10.2h7" />
      </svg>
    )
  }

  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.6 7l1.9 1.1M17.5 16l1.9 1.1M4.6 17l1.9-1.1M17.5 8l1.9-1.1M3.5 12h2.2M18.3 12h2.2" />
    </svg>
  )
}
