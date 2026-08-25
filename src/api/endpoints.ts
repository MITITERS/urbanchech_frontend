/**
 * Every API path of the project. Nothing else in the codebase builds URL
 * strings by hand.
 *
 * Two families live here:
 * - `/_allauth/app/v1/...` — django-allauth "headless" endpoints, used for the
 *   session lifecycle. The session token they return travels in the
 *   `X-Session-Token` header on every later request.
 * - `/api/...` — the DRF API of the project.
 *
 * Note there is no municipality id anywhere: the API scopes every response to
 * the jurisdiction of the authenticated user, server-side.
 */

const ALLAUTH = '/_allauth/app/v1'
const API = '/api'

export const endpoints = {
  auth: {
    login: `${ALLAUTH}/auth/login`,
    session: `${ALLAUTH}/auth/session`,
    changePassword: `${ALLAUTH}/account/password/change`,
    requestPasswordReset: `${ALLAUTH}/auth/password/request`,
    resetPassword: `${ALLAUTH}/auth/password/reset`,
  },
  users: {
    me: `${API}/users/me/`,
    list: `${API}/users/`,
    detail: (id: number) => `${API}/users/${id}/`,
  },
  geo: {
    /** Catálogo oficial de la división política argentina (Georef). */
    provinces: `${API}/geo/provinces/`,
    localities: (provinceId: string) =>
      `${API}/geo/provinces/${provinceId}/localities/`,
  },
  municipalities: {
    list: `${API}/municipalities/`,
    detail: (id: number) => `${API}/municipalities/${id}/`,
    reports: (id: number) => `${API}/municipalities/${id}/reports/`,
    /** Marcadores sin paginar: el mapa los necesita todos de una. */
    reportMarkers: (id: number) => `${API}/municipalities/${id}/reports/map/`,
  },
  municipalAgents: {
    list: `${API}/municipal-agents/`,
  },
  validators: {
    list: `${API}/validators/`,
    activate: (id: number) => `${API}/validators/${id}/activate/`,
    deactivate: (id: number) => `${API}/validators/${id}/deactivate/`,
  },
  panelReports: {
    list: `${API}/panel/reports/`,
    detail: (id: number) => `${API}/panel/reports/${id}/`,
    /** Un endpoint por transición: los permisos y los campos difieren. */
    transition: (id: number, operation: string) =>
      `${API}/panel/reports/${id}/${operation}/`,
  },
  reports: {
    list: `${API}/reports/`,
    detail: (id: number) => `${API}/reports/${id}/`,
    comments: (id: number) => `${API}/reports/${id}/comments/`,
  },
  notifications: {
    list: `${API}/notifications/`,
    detail: (id: number) => `${API}/notifications/${id}/`,
  },
} as const
