/**
 * Roles that exist across the whole UrbanCheck platform. Only the two municipal
 * ones can use this panel; citizens and validators use the mobile app.
 */
export const ROLES = {
  PLATFORM_ADMIN: 'ADMIN_PLATAFORMA',
  MUNICIPAL_AGENT: 'AGENTE_MUNICIPAL',
  VALIDATOR: 'VALIDADOR',
  CITIZEN: 'CIUDADANO',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/** The only roles allowed to reach an authenticated route of this panel. */
export const PANEL_ROLES: readonly Role[] = [
  ROLES.PLATFORM_ADMIN,
  ROLES.MUNICIPAL_AGENT,
]

export interface Municipality {
  id: number
  city: string
  province: string
}

export interface AuthUser {
  id: number
  email: string
  name: string
  role: Role
  /** Absent for the platform admin, who is not scoped to a municipality. */
  municipality: Municipality | null
  /**
   * True while the user still has the temporary password issued at creation.
   * Every route redirects to the change-password screen until it is false.
   */
  mustChangePassword: boolean
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export function isPanelRole(role: Role): boolean {
  return PANEL_ROLES.includes(role)
}
