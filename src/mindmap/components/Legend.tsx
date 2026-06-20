import RoleIcon from './RoleIcon'
import type { Role } from '../types'

interface LegendProps {
  /** Which role icons to show. Students/educators only ever see WU Elektronik
   * experts, so they only get that one entry; admins see students and
   * educators (the two groups their filter switches between). */
  roles: Role[]
}

export default function Legend({ roles }: LegendProps) {
  return (
    <div className="border-t border-graylight pt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-graydark">Legend</p>
      <ul className="mt-3 space-y-2.5 text-[12.5px] text-graydark">
        <li className="flex items-center gap-2.5">
          <svg width="60" height="8" aria-hidden>
            <defs>
              <linearGradient id="legend-strength" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(253, 226, 226)" />
                <stop offset="100%" stopColor="rgb(122, 0, 0)" />
              </linearGradient>
            </defs>
            <line x1="0" y1="4" x2="60" y2="4" stroke="url(#legend-strength)" strokeWidth="4" strokeLinecap="round" />
          </svg>
          Weaker → stronger connection
        </li>
        {roles.includes('student') && (
          <li className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-graylight bg-soft text-graydark">
              <RoleIcon role="student" size={11} />
            </span>
            Student
          </li>
        )}
        {roles.includes('educator') && (
          <li className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand-red bg-white text-brand-red">
              <RoleIcon role="educator" size={11} />
            </span>
            Educator
          </li>
        )}
        {roles.includes('expert') && (
          <li className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-white">
              <RoleIcon role="expert" size={11} />
            </span>
            WU Elektronik Expert
          </li>
        )}
      </ul>
    </div>
  )
}
