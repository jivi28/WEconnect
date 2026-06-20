import FilterChips, { type ChipKey } from './FilterChips'

interface HeroProps {
  activeChip: ChipKey
  onChipChange: (key: ChipKey) => void
}

export default function Hero({ activeChip, onChipChange }: HeroProps) {
  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-5 pt-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            Your Connection Map
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-graydark">
            Discover students, educators, and WU Elektronik experts connected through shared
            interests, expertise, and opportunities.
          </p>
        </div>
        <FilterChips active={activeChip} onChange={onChipChange} />
      </div>
      <div className="mt-5 h-[3px] w-full bg-ink">
        <div className="h-full w-16 bg-brand-red" />
      </div>
    </div>
  )
}
