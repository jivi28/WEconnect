import RoleIcon from './RoleIcon'
import type { Role } from '../types'

const ROLE_META: Record<Role, { label: string; classes: string }> = {
  student: {
    label: 'Student',
    classes: 'bg-soft text-graydark border border-graylight'
  },
  educator: {
    label: 'Educator',
    classes: 'bg-white text-brand-red border border-brand-red'
  },
  expert: {
    label: 'Würth Elektronik Expert',
    classes: 'bg-brand-red text-white border border-brand-red'
  }
}

export function roleMeta(role: Role) {
  return ROLE_META[role]
}

interface RoleBadgeProps {
  role: Role
  size?: 'sm' | 'md'
}

export default function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const meta = ROLE_META[role]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold tracking-wide uppercase ${meta.classes} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      }`}
    >
      <RoleIcon role={role} size={size === 'sm' ? 10 : 12} />
      {meta.label}
    </span>
  )
}
