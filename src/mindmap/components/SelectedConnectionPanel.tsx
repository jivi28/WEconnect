import Avatar from './Avatar'
import RoleBadge from './RoleBadge'
import ArrowButton from './ArrowButton'
import type { Person } from '../types'

interface SelectedConnectionPanelProps {
  person: Person | null
}

export default function SelectedConnectionPanel({ person }: SelectedConnectionPanelProps) {
  if (!person) {
    return (
      <aside className="flex h-full flex-col rounded-md border border-graylight bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-graydark">
          Selected Connection
        </p>
        <div className="mt-8 flex flex-1 flex-col items-center justify-center text-center text-graymed">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-graylight">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
            </svg>
          </div>
          <p className="text-sm">Hover or click a person to view details.</p>
        </div>
      </aside>
    )
  }

  const isExpert = person.role === 'expert'

  return (
    <aside className="flex h-full flex-col overflow-y-auto rounded-md border border-graylight bg-white p-5 we-scrollbar">
      <p className="text-xs font-bold uppercase tracking-wide text-graydark">Selected Connection</p>

      <div className="mt-4 flex flex-col items-center text-center">
        <Avatar
          name={person.name}
          imageUrl={person.imageUrl}
          tone={isExpert ? 'red' : 'grey'}
          className="h-20 w-20 rounded-full text-xl ring-4 ring-soft"
        />
        <p className="mt-3 text-base font-bold text-ink">{person.name}</p>
        <div className="mt-1.5">
          <RoleBadge role={person.role} size="md" />
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-graymed">
            {isExpert ? 'Expertise area' : 'Main interest'}
          </dt>
          <dd className="text-ink">{person.mainInterest}</dd>
        </div>
        {person.detailLine && (
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-graymed">Detail</dt>
            <dd className="text-graydark">{person.detailLine}</dd>
          </div>
        )}
        {person.email && (
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-graymed">Email</dt>
            <dd className="text-ink">
              <a href={`mailto:${person.email}`} className="hover:underline">
                {person.email}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {person.sharedInterests.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-wide text-graymed">Shared interests</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {person.sharedInterests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-graylight bg-soft px-2.5 py-1 text-[11px] font-medium text-graydark"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 rounded-lg bg-soft p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-graydark">
            Connection strength
          </span>
          <span className="text-sm font-bold text-brand-red">{person.connectionStrength}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-graylight">
          <div
            className="h-full rounded-full bg-brand-red"
            style={{ width: `${person.connectionStrength}%` }}
          />
        </div>
        <p className="mt-2 text-[12px] text-graydark">{person.connectionReason}</p>
      </div>

      <div className="mt-5 flex gap-2">
        <button className="group flex flex-1 items-center justify-between overflow-hidden">
          <span className="flex-1 bg-ink px-3 py-2 text-left text-[12px] font-bold uppercase tracking-wide text-white">
            Message
          </span>
          <ArrowButton size={34} />
        </button>
      </div>
    </aside>
  )
}
