import FilterChips, { type ChipKey } from './FilterChips'
import type { Role } from '../types'

interface HeroProps {
  activeChip: ChipKey
  onChipChange: (key: ChipKey) => void
  roleChips: ChipKey[]
  viewerRole: Role
}

const EXPLANATION: Record<Role, string> = {
  student:
    'This map shows your connections to Würth Elektronik experts, ranked by shared interests and goals — not other students or educators. Experts are public contacts, so you can always see and reach them here.',
  educator:
    'This map shows your connections to Würth Elektronik experts, ranked by shared interests and goals — not other educators or students. Experts are public contacts, so you can always see and reach them here.',
  expert:
    'This map shows your connections to students and educators, ranked by shared interests and goals. Use the filter to switch between viewing students or educators.'
}

export default function Hero({ activeChip, onChipChange, roleChips, viewerRole }: HeroProps) {
  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-5 pt-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            Your Connection Map
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-graydark">{EXPLANATION[viewerRole]}</p>
        </div>
        <FilterChips active={activeChip} onChange={onChipChange} roleChips={roleChips} />
      </div>
      <div className="mt-5 h-[3px] w-full bg-ink">
        <div className="h-full w-16 bg-brand-red" />
      </div>
    </div>
  )
}
