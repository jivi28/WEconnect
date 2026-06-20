export type ChipKey = 'all' | 'student' | 'educator' | 'expert' | 'strongest'

const CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'student', label: 'Students' },
  { key: 'educator', label: 'Educators' },
  { key: 'expert', label: 'WU Elektronik' },
  { key: 'strongest', label: 'Strongest connections' }
]

interface FilterChipsProps {
  active: ChipKey
  onChange: (key: ChipKey) => void
}

export default function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((chip) => {
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
