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
    <foreignObject x={x - 76} y={y - 76} width={152} height={152} style={{ overflow: 'visible' }}>
      <div
        // @ts-expect-error xmlns is valid on foreignObject children
        xmlns="http://www.w3.org/1999/xhtml"
        className="flex flex-col items-center"
      >
        <div
          className={`relative flex h-32 w-32 items-center justify-center rounded-full bg-white p-2 shadow-card transition-transform duration-300 ${
            highlighted ? 'scale-105' : ''
          }`}
          style={{
            boxShadow: highlighted
              ? '0 0 0 6px rgba(204,0,0,0.14), 0 14px 30px rgba(204,0,0,0.22)'
              : '0 10px 26px rgba(31,31,31,0.16)'
          }}
        >
          <div className="h-full w-full rounded-full ring-[6px] ring-brand-red">
            <Avatar
              name={user.name}
              imageUrl={user.imageUrl}
              tone="red"
              className="h-full w-full rounded-full text-2xl"
            />
          </div>
        </div>
      </div>
    </foreignObject>
  )
}
