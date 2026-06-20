import Avatar from './Avatar'
import type { CurrentUser } from '../types'

interface UserNodeProps {
  x: number
  y: number
  user: CurrentUser
  highlighted: boolean
}

export default function UserNode({ x, y, user, highlighted }: UserNodeProps) {
  return (
    <foreignObject x={x - 64} y={y - 64} width={128} height={128} style={{ overflow: 'visible' }}>
      <div
        // @ts-expect-error xmlns is valid on foreignObject children
        xmlns="http://www.w3.org/1999/xhtml"
        className="flex flex-col items-center"
      >
        <div
          className={`relative flex h-28 w-28 items-center justify-center rounded-full bg-white p-1.5 shadow-card transition-transform duration-300 ${
            highlighted ? 'scale-105' : ''
          }`}
          style={{
            boxShadow: highlighted
              ? '0 0 0 6px rgba(204,0,0,0.14), 0 14px 30px rgba(204,0,0,0.22)'
              : '0 10px 26px rgba(31,31,31,0.16)'
          }}
        >
          <div className="h-full w-full rounded-full ring-[5px] ring-brand-red">
            <Avatar
              name={user.name}
              imageUrl={user.imageUrl}
              tone="red"
              className="h-full w-full rounded-full text-2xl"
            />
          </div>
          <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-white bg-brand-red" />
        </div>
        <div className="mt-2 rounded-md bg-white/95 px-2.5 py-1 text-center shadow-node">
          <p className="text-[13px] font-bold leading-tight text-ink">{user.name}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-red">You</p>
        </div>
      </div>
    </foreignObject>
  )
}
