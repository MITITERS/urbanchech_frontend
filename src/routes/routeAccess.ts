import { ROLES, type Role } from '@/types/auth'

/**
 * Qué rol puede entrar a qué sección del panel.
 *
 * Es la única tabla de acceso: la consultan el router para guardar cada bloque,
 * el sidebar para dibujar la navegación y el login para decidir a dónde mandar
 * al usuario. Tenerla repartida es lo que hacía que un agente aterrizara en una
 * pantalla de administrador y se comiera un «permisos insuficientes».
 */
interface RouteAccess {
  /** Prefijo de la ruta; cubre también sus subrutas (`/reportes/7`). */
  prefix: string
  roles: readonly Role[]
}

export const ADMIN_ONLY: readonly Role[] = [ROLES.PLATFORM_ADMIN]
export const AGENT_ONLY: readonly Role[] = [ROLES.MUNICIPAL_AGENT]

export const ROUTE_ACCESS: readonly RouteAccess[] = [
  // El administrador de la plataforma no gestiona reportes: la API del panel
  // le responde 403, así que tampoco le mostramos la sección.
  { prefix: '/reportes', roles: AGENT_ONLY },
  { prefix: '/validadores', roles: AGENT_ONLY },
  { prefix: '/municipalidades', roles: ADMIN_ONLY },
  { prefix: '/agentes', roles: ADMIN_ONLY },
]

/** Primera pantalla de cada rol, y destino de «volver al inicio». */
const HOME_BY_ROLE: Record<Role, string> = {
  [ROLES.PLATFORM_ADMIN]: '/municipalidades',
  [ROLES.MUNICIPAL_AGENT]: '/reportes',
  // Ninguno de los dos entra al panel; el valor existe para que el tipo sea
  // total y nunca se devuelva `undefined`.
  [ROLES.VALIDATOR]: '/reportes',
  [ROLES.CITIZEN]: '/reportes',
}

export function homeRouteFor(role: Role | null | undefined): string {
  return role ? HOME_BY_ROLE[role] : '/reportes'
}

function accessFor(path: string): RouteAccess | undefined {
  return ROUTE_ACCESS.find(
    (entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`),
  )
}

/**
 * Si `role` puede abrir `path`.
 *
 * Una ruta que no está en la tabla —el cambio de contraseña, una URL
 * inexistente— no es de nadie en particular: la decide su propia guarda.
 */
export function canAccessPath(role: Role | null | undefined, path: string): boolean {
  if (!role) return false
  const access = accessFor(path)
  return access === undefined || access.roles.includes(role)
}
