import type { Person, Role } from './types'

export interface NodePosition {
  x: number
  y: number
  radius: number
}

const CLUSTER_ANGLE_DEG: Record<Role, number> = {
  student: -90,
  educator: 150,
  expert: 30
}

const MIN_RADIUS = 165
const MAX_RADIUS = 340
const RING_STAGGER = 38
const MAX_SPREAD_DEG = 110

export function computeLayout(
  filtered: Person[],
  centerX: number,
  centerY: number
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>()
  const byRole: Record<Role, Person[]> = { student: [], educator: [], expert: [] }
  filtered.forEach((p) => byRole[p.role].push(p))

  ;(Object.keys(byRole) as Role[]).forEach((role) => {
    const group = byRole[role]
    if (group.length === 0) return
    const clusterCenter = (CLUSTER_ANGLE_DEG[role] * Math.PI) / 180
    const spread = (Math.min(MAX_SPREAD_DEG, group.length * 26) * Math.PI) / 180

    group.forEach((person, i) => {
      const offset = group.length === 1 ? 0 : (i - (group.length - 1) / 2) * (spread / group.length)
      const angle = clusterCenter + offset
      const t = 1 - person.connectionStrength / 100
      const stagger = (i % 3) * RING_STAGGER
      const radius = MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS) + stagger
      positions.set(person.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        radius
      })
    })
  })

  return positions
}

export function strengthTier(strength: number): 'strong' | 'medium' | 'weak' {
  if (strength >= 75) return 'strong'
  if (strength >= 45) return 'medium'
  return 'weak'
}
