import Legend from './Legend'
import type { Filters, Role } from '../types'

interface FilterPanelProps {
  filters: Filters
  onToggleRole: (role: Role) => void
  onMinStrengthChange: (value: number) => void
  onInterestQueryChange: (value: string) => void
  onEventFilterChange: (value: string) => void
  onProjectFilterChange: (value: string) => void
  events: string[]
  projects: string[]
}

const ROLE_LABELS: { role: Role; label: string }[] = [
  { role: 'student', label: 'Students' },
  { role: 'educator', label: 'Educators' },
  { role: 'expert', label: 'WU Elektronik' }
]

export default function FilterPanel({
  filters,
  onToggleRole,
  onMinStrengthChange,
  onInterestQueryChange,
  onEventFilterChange,
  onProjectFilterChange,
  events,
  projects
}: FilterPanelProps) {
  return (
    <aside className="flex h-full flex-col overflow-y-auto rounded-md border border-graylight bg-white p-5 we-scrollbar">
      <p className="text-xs font-bold uppercase tracking-wide text-graydark">Connection Filters</p>

      <div className="mt-4">
        <p className="text-[12px] font-semibold text-ink">Role</p>
        <div className="mt-2 space-y-2">
          {ROLE_LABELS.map(({ role, label }) => (
            <label key={role} className="flex items-center gap-2.5 text-sm text-graydark">
              <input
                type="checkbox"
                checked={filters.roles[role]}
                onChange={() => onToggleRole(role)}
                className="h-4 w-4 rounded border-graylight text-brand-red focus:ring-brand-red"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-ink">Minimum match strength</p>
          <span className="text-[12px] font-bold text-brand-red">{filters.minStrength}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={filters.minStrength}
          onChange={(e) => onMinStrengthChange(Number(e.target.value))}
          className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-graylight accent-brand-red"
        />
      </div>

      <div className="mt-5">
        <p className="text-[12px] font-semibold text-ink">Interest search</p>
        <input
          type="text"
          value={filters.interestQuery}
          onChange={(e) => onInterestQueryChange(e.target.value)}
          placeholder="e.g. Embedded Systems"
          className="mt-2 w-full rounded-md border border-graylight px-3 py-2 text-sm text-ink placeholder:text-graymed focus:border-brand-red focus:outline-none"
        />
      </div>

      <div className="mt-5">
        <p className="text-[12px] font-semibold text-ink">Event</p>
        <select
          value={filters.eventFilter}
          onChange={(e) => onEventFilterChange(e.target.value)}
          className="mt-2 w-full rounded-md border border-graylight px-3 py-2 text-sm text-ink focus:border-brand-red focus:outline-none"
        >
          <option value="">All events</option>
          {events.map((event) => (
            <option key={event} value={event}>
              {event}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <p className="text-[12px] font-semibold text-ink">Project</p>
        <select
          value={filters.projectFilter}
          onChange={(e) => onProjectFilterChange(e.target.value)}
          className="mt-2 w-full rounded-md border border-graylight px-3 py-2 text-sm text-ink focus:border-brand-red focus:outline-none"
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>
      </div>

      <Legend />
    </aside>
  )
}
