export type Role = 'student' | 'educator' | 'expert'

export interface Person {
  id: string
  name: string
  role: Role
  email: string
  imageUrl: string
  /** Main interest (student/educator) or expertise area (WU Elektronik expert) */
  mainInterest: string
  projectNames: string[]
  sharedInterests: string[]
  sharedEvents: string[]
  /** 0-100 */
  connectionStrength: number
  connectionReason: string
  /** Used for educators: their teaching/research area. Used for experts: their department. */
  detailLine?: string
}

export interface CurrentUser {
  name: string
  role: 'Student'
  email: string
  imageUrl: string
  mainInterests: string
}

export type RoleFilter = Role | 'all'

export interface Filters {
  roles: Record<Role, boolean>
  minStrength: number
  interestQuery: string
  eventFilter: string
  projectFilter: string
}
