import RoleIcon from './RoleIcon'

export default function Legend() {
  return (
    <div className="border-t border-graylight pt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-graydark">Legend</p>
      <ul className="mt-3 space-y-2.5 text-[12.5px] text-graydark">
        <li className="flex items-center gap-2.5">
          <svg width="28" height="8" aria-hidden>
            <line x1="0" y1="4" x2="28" y2="4" stroke="#CC0000" strokeWidth="3" strokeLinecap="round" />
          </svg>
          Strong connection
        </li>
        <li className="flex items-center gap-2.5">
          <svg width="28" height="8" aria-hidden>
            <line x1="0" y1="4" x2="28" y2="4" stroke="#959595" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Weaker connection
        </li>
        <li className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-graylight bg-soft text-graydark">
            <RoleIcon role="student" size={11} />
          </span>
          Student
        </li>
        <li className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand-red bg-white text-brand-red">
            <RoleIcon role="educator" size={11} />
          </span>
          Educator
        </li>
        <li className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-white">
            <RoleIcon role="expert" size={11} />
          </span>
          WU Elektronik Expert
        </li>
      </ul>
    </div>
  )
}
