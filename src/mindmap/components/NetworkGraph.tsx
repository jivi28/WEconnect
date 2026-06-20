import { useRef, useState } from 'react'
import UserNode from './UserNode'
import ConnectionNode from './ConnectionNode'
import HoverProfileCard from './HoverProfileCard'
import { computeLayout, strengthTier } from '../layout'
import type { CurrentUser, Person } from '../types'

const VIEW_W = 1080
const VIEW_H = 760
const CENTER = { x: VIEW_W / 2, y: VIEW_H / 2 }
const MIN_SCALE = 0.6
const MAX_SCALE = 2.4

interface NetworkGraphProps {
  currentUser: CurrentUser
  people: Person[]
  hoveredId: string | null
  selectedId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string | null) => void
}

const LINE_COLOR = { strong: '#CC0000', medium: '#959595', weak: '#DEDEDE' }
const EXPERT_LINE_COLOR = { strong: '#A30000', medium: '#605D5C', weak: '#959595' }
const LINE_WIDTH = { strong: 3.2, medium: 2, weak: 1.1 }

export default function NetworkGraph({
  currentUser,
  people,
  hoveredId,
  selectedId,
  onHover,
  onSelect
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const lastPoint = useRef({ x: 0, y: 0 })
  const pointerDownClient = useRef<{ x: number; y: number } | null>(null)

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const positions = computeLayout(people, CENTER.x, CENTER.y)
  const activeId = hoveredId ?? selectedId

  function toSvgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const p = pt.matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  function zoomBy(factor: number, clientX?: number, clientY?: number) {
    setTransform((t) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * factor))
      const rect = containerRef.current?.getBoundingClientRect()
      const cx = clientX ?? (rect ? rect.left + rect.width / 2 : 0)
      const cy = clientY ?? (rect ? rect.top + rect.height / 2 : 0)
      const p = toSvgPoint(cx, cy)
      const worldX = (p.x - t.x) / t.scale
      const worldY = (p.y - t.y) / t.scale
      return { scale: newScale, x: p.x - worldX * newScale, y: p.y - worldY * newScale }
    })
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    zoomBy(factor, e.clientX, e.clientY)
  }

  function handlePointerDown(e: React.PointerEvent) {
    pointerDownClient.current = { x: e.clientX, y: e.clientY }
    lastPoint.current = toSvgPoint(e.clientX, e.clientY)
  }

  function handlePointerMove(e: React.PointerEvent) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })

    if (!dragging.current) {
      // Only start panning once the pointer has actually moved a few
      // pixels — this keeps plain clicks on nodes from being hijacked.
      const start = pointerDownClient.current
      if (!start) return
      const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y)
      if (moved < 4) return
      dragging.current = true
      containerRef.current?.setPointerCapture(e.pointerId)
    }

    const p = toSvgPoint(e.clientX, e.clientY)
    const dx = p.x - lastPoint.current.x
    const dy = p.y - lastPoint.current.y
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
    lastPoint.current = p
  }

  function handlePointerUp() {
    dragging.current = false
    pointerDownClient.current = null
  }

  function resetView() {
    setTransform({ x: 0, y: 0, scale: 1 })
  }

  const hoveredPerson = hoveredId ? people.find((p) => p.id === hoveredId) ?? null : null

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-grab touch-none select-none overflow-hidden rounded-md border border-graylight we-grid-bg active:cursor-grabbing"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
      >
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
          {people.map((person) => {
            const pos = positions.get(person.id)
            if (!pos) return null
            const tier = strengthTier(person.connectionStrength)
            const isActive = activeId === person.id
            const isExpert = person.role === 'expert'
            const stroke = isExpert ? EXPERT_LINE_COLOR[tier] : LINE_COLOR[tier]
            const width = LINE_WIDTH[tier] * (isActive ? 1.6 : 1)

            return (
              <line
                key={`line-${person.id}`}
                x1={CENTER.x}
                y1={CENTER.y}
                x2={pos.x}
                y2={pos.y}
                stroke={stroke}
                strokeWidth={width}
                strokeLinecap="round"
                opacity={activeId && !isActive ? 0.25 : isExpert ? 0.9 : 0.75}
                className={isActive ? 'animate-pulseLine' : ''}
              />
            )
          })}

          {people.map((person, index) => {
            const pos = positions.get(person.id)
            if (!pos) return null
            return (
              <ConnectionNode
                key={person.id}
                person={person}
                x={pos.x}
                y={pos.y}
                index={index}
                isHovered={hoveredId === person.id}
                isSelected={selectedId === person.id}
                dimmed={Boolean(activeId) && activeId !== person.id}
                onEnter={() => onHover(person.id)}
                onMove={() => {}}
                onLeave={() => onHover(null)}
                onClick={() => onSelect(selectedId === person.id ? null : person.id)}
              />
            )
          })}

          <UserNode x={CENTER.x} y={CENTER.y} user={currentUser} highlighted={Boolean(activeId)} />
        </g>
      </svg>

      {hoveredPerson && (
        <HoverProfileCard
          person={hoveredPerson}
          x={Math.min(mousePos.x + 18, (containerRef.current?.clientWidth ?? 600) - 300)}
          y={Math.min(mousePos.y + 12, (containerRef.current?.clientHeight ?? 400) - 220)}
        />
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button
          onClick={() => zoomBy(1.2)}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-graylight bg-white text-graydark shadow-node hover:border-brand-red hover:text-brand-red"
        >
          +
        </button>
        <button
          onClick={() => zoomBy(0.83)}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-graylight bg-white text-graydark shadow-node hover:border-brand-red hover:text-brand-red"
        >
          −
        </button>
        <button
          onClick={resetView}
          aria-label="Reset view"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-graylight bg-white text-[10px] font-bold text-graydark shadow-node hover:border-brand-red hover:text-brand-red"
        >
          ⟲
        </button>
      </div>
    </div>
  )
}
