import Avatar from './Avatar'
import RoleBadge from './RoleBadge'
import type { Person } from '../types'

interface HoverProfileCardProps {
  person: Person
  x: number
  y: number
}

export default function HoverProfileCard({ person, x, y }: HoverProfileCardProps) {
  const isExpert = person.role === 'expert'

  return (
    <div
      className="pointer-events-none absolute z-40 w-72 animate-fadeUp overflow-hidden rounded-md border border-graylight bg-white shadow-card"
      style={{ left: x, top: y }}
    >
      <div className="h-1.5 w-full bg-brand-red" />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={person.name}
            imageUrl={person.imageUrl}
            tone={isExpert ? 'red' : 'grey'}
            className="h-12 w-12 rounded-full text-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold text-ink">{person.name}</p>
            <RoleBadge role={person.role} />
          </div>
        </div>

        <dl className="mt-3 space-y-1.5 text-[12.5px]">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-graymed">Email</dt>
            <dd className="truncate text-graydark">{person.email}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-graymed">
              {isExpert ? 'Expertise' : 'Main interest'}
            </dt>
            <dd className="text-ink">{person.mainInterest}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-graymed">Projects</dt>
            <dd className="text-ink">{person.projectNames.join(', ') || '—'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-graymed">Why connected</dt>
            <dd className="text-graydark">{person.connectionReason}</dd>
          </div>
        </dl>

        <div className="mt-3 flex items-center justify-between rounded-md bg-soft px-2.5 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-graydark">
            Match strength
          </span>
          <span className="text-[13px] font-bold text-brand-red">{person.connectionStrength}%</span>
        </div>
      </div>
    </div>
  )
}
