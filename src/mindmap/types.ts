export type Role = 'student' | 'educator' | 'expert'

export interface Person {
  id: string
  name: string
  role: Role
  imageUrl: string
  /** Main interest (student/educator) or expertise area (Würth Elektronik expert) */
  mainInterest: string
  projectNames?: string[]
  sharedInterests: string[]
  sharedEvents?: string[]
  /** 0-100 */
  connectionStrength: number
  connectionReason: string
  /** Used for educators: their teaching/research area. Used for experts: their department. */
  detailLine?: string
  /** Only populated when the DB's get_profile_emails() grants the viewer access to this person's email. */
  email?: string
}

export interface CurrentUser {
  name: string
  role: Role
  email: string
  imageUrl: string
  mainInterests: string
}

export type RoleFilter = Role | 'all'

export interface Filters {
  roles: Record<Role, boolean>
  minStrength: number
  interestQuery: string
}
