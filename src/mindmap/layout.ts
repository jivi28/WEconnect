import type { Person, Role } from './types'

export interface NodePosition {
  x: number
  y: number
  radius: number
}

// Connection score is the sole source of radial distance: a higher score is
// always closer to the current user. The visible score range is stretched
// across this full span so even a set of, say, 40–60% matches has clearly
// different spoke lengths instead of looking like one ring.
const MIN_RADIUS = 145
const MAX_RADIUS = 365
const SCORE_CURVE = 0.82
const ANGLE_JITTER = (4 * Math.PI) / 180
const ROLE_ORDER: Role[] = ['student', 'educator', 'expert']

// Deterministic per-person offset used only for angle. Radial jitter would
// make the visual lie about the score (a weaker match could appear closer).
function hashToUnit(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return (Math.abs(h) % 1000) / 1000
}

export function distanceForScore(score: number, visibleMin = 0, visibleMax = 100): number {
  const span = visibleMax - visibleMin
  if (span <= 0) return (MIN_RADIUS + MAX_RADIUS) / 2
  const normalized = Math.min(1, Math.max(0, (score - visibleMin) / span))
  const closeness = Math.pow(normalized, SCORE_CURVE)
  return MAX_RADIUS - closeness * (MAX_RADIUS - MIN_RADIUS)
}

export function computeLayout(
  filtered: Person[],
  centerX: number,
  centerY: number
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>()
  if (filtered.length === 0) return positions

  const byRole: Record<Role, Person[]> = { student: [], educator: [], expert: [] }
  filtered.forEach((p) => byRole[p.role].push(p))

  const total = filtered.length
  const strengths = filtered.map((person) => person.connectionStrength)
  const visibleMin = Math.min(...strengths)
  const visibleMax = Math.max(...strengths)
  // Each role gets an arc of the full circle proportional to how many of
  // its members are actually showing — so the layout always fills 360°
  // evenly (true symmetry around the user) instead of three fixed 120°
  // wedges that look lopsided whenever role counts are uneven.
  let angleCursor = -Math.PI / 2

  ROLE_ORDER.forEach((role) => {
    const group = byRole[role]
    if (group.length === 0) return
    const arc = (group.length / total) * Math.PI * 2

    group.forEach((person, i) => {
      const baseAngle = angleCursor + (arc * (i + 0.5)) / group.length
      const angleOffset = (hashToUnit(person.id) - 0.5) * 2 * ANGLE_JITTER
      const angle = baseAngle + angleOffset
      const radius = distanceForScore(person.connectionStrength, visibleMin, visibleMax)
      positions.set(person.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        radius
      })
    })

    angleCursor += arc
  })

  return positions
}

export function strengthTier(strength: number): 'strong' | 'medium' | 'weak' {
  if (strength >= 75) return 'strong'
  if (strength >= 45) return 'medium'
  return 'weak'
}
