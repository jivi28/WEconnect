import Avatar from './Avatar'
import RoleIcon from './RoleIcon'
import type { Person } from '../types'
import { strengthTier } from '../layout'

interface ConnectionNodeProps {
  person: Person
  x: number
  y: number
  index: number
  isHovered: boolean
  isSelected: boolean
  dimmed: boolean
  onEnter: (e: React.MouseEvent) => void
  onMove: (e: React.MouseEvent) => void
  onLeave: () => void
  onClick: () => void
}

const SIZE_BY_TIER = { strong: 92, medium: 78, weak: 64 }

export default function ConnectionNode({
  person,
  x,
  y,
  index,
  isHovered,
  isSelected,
  dimmed,
  onEnter,
  onMove,
  onLeave,
  onClick
}: ConnectionNodeProps) {
  const tier = strengthTier(person.connectionStrength)
  const size = SIZE_BY_TIER[tier]
  const isExpert = person.role === 'expert'
  const isEducator = person.role === 'educator'
  const active = isHovered || isSelected

  const ringClass = isExpert
    ? 'ring-[4px] ring-brand-red'
    : isEducator
      ? 'ring-[3px] ring-brand-red/70'
      : 'ring-2 ring-graylight'

  return (
    <foreignObject
      x={x - size / 2 - 12}
      y={y - size / 2 - 12}
      width={size + 24}
      height={size + 48}
      style={{ overflow: 'visible' }}
    >
      <div
        // @ts-expect-error xmlns valid on foreignObject html children
        xmlns="http://www.w3.org/1999/xhtml"
        className="flex animate-nodeIn flex-col items-center"
        style={{ animationDelay: `${index * 60}ms` }}
        onMouseEnter={onEnter}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
      >
        <div
          className={`relative flex cursor-pointer items-center justify-center rounded-full bg-white p-1 transition-all duration-200 ${ringClass} ${
            active ? 'scale-110 shadow-nodeStrong' : 'shadow-node'
          } ${dimmed ? 'opacity-30' : 'opacity-100'}`}
          style={{ width: size, height: size }}
        >
          <Avatar
            name={person.name}
            imageUrl={person.imageUrl}
            tone={isExpert ? 'red' : 'grey'}
            className="h-full w-full rounded-full text-xs"
          />
          <span
            className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${
              isExpert
                ? 'bg-brand-red text-white'
                : isEducator
                  ? 'bg-white text-brand-red ring-1 ring-brand-red'
                  : 'bg-soft text-graydark'
            }`}
          >
            <RoleIcon role={person.role} size={11} />
          </span>
        </div>
        <div
          className={`mt-1.5 max-w-[110px] rounded-md px-1.5 py-0.5 text-center transition-opacity ${
            dimmed ? 'opacity-40' : 'opacity-100'
          }`}
        >
          <p className="truncate text-[11px] font-semibold leading-tight text-ink">{person.name}</p>
        </div>
      </div>
    </foreignObject>
  )
}
