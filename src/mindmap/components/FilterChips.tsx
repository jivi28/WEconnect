export type ChipKey = 'all' | 'student' | 'educator' | 'expert' | 'strongest'

const ALL_CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'student', label: 'Students' },
  { key: 'educator', label: 'Educators' },
  { key: 'expert', label: 'WU Elektronik' },
  { key: 'strongest', label: 'Strongest connections' }
]

interface FilterChipsProps {
  active: ChipKey
  onChange: (key: ChipKey) => void
  /** Role chips to offer beyond "All" and "Strongest connections". Students/
   * educators only ever see WU Elektronik experts, so there's nothing to
   * choose between and this is empty for them. */
  roleChips: ChipKey[]
}

export default function FilterChips({ active, onChange, roleChips }: FilterChipsProps) {
  const chips = ALL_CHIPS.filter((chip) => chip.key === 'all' || chip.key === 'strongest' || roleChips.includes(chip.key))
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const isActive = active === chip.key
        return (
          <button
            key={chip.key}
            onClick={() => onChange(chip.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-brand-red bg-brand-red text-white'
                : 'border-graylight bg-soft text-graydark hover:border-brand-red hover:text-brand-red'
            }`}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}
