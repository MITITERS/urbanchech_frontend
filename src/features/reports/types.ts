/** The six statuses of the system, with the exact values the API uses. */
export const REPORT_STATUSES = {
  PENDING_VALIDATION: 'pendiente_validacion',
  REPORTED: 'reportado',
  IN_PROGRESS: 'en_proceso',
  RESOLVED: 'resuelto',
  CANCELLED: 'cancelado',
  ARCHIVED: 'archivado',
} as const

export type ReportStatus = (typeof REPORT_STATUSES)[keyof typeof REPORT_STATUSES]

export const REPORT_STATUS_ORDER: readonly ReportStatus[] = [
  REPORT_STATUSES.PENDING_VALIDATION,
  REPORT_STATUSES.REPORTED,
  REPORT_STATUSES.IN_PROGRESS,
  REPORT_STATUSES.RESOLVED,
  REPORT_STATUSES.CANCELLED,
  REPORT_STATUSES.ARCHIVED,
]

/**
 * What the panel shows when the agent has not touched the filters: the three
 * statuses that still need attention. The API returns every status; this
 * default is applied client-side so the same endpoint serves other consumers.
 */
export const DEFAULT_STATUS_FILTER: readonly ReportStatus[] = [
  REPORT_STATUSES.PENDING_VALIDATION,
  REPORT_STATUSES.REPORTED,
  REPORT_STATUSES.IN_PROGRESS,
]

export const REPORT_CATEGORIES = [
  'bache',
  'alumbrado',
  'basura',
  'semaforo',
  'vereda',
  'otro',
] as const

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]

export interface ReportAuthor {
  id: number
  name: string
  avatar: string | null
}

export interface PanelReportRow {
  id: number
  category: ReportCategory
  status: ReportStatus
  created_at: string
  address: string
  latitude: string | null
  longitude: string | null
  like_count: number
  operative_area: string | null
  author: ReportAuthor
}

/** Ordering values accepted by the API. */
export type ReportOrdering = 'created_at' | '-created_at' | 'like_count' | '-like_count'

export interface ReportFilters {
  statuses: ReportStatus[]
  categories: ReportCategory[]
  zone: string
  createdFrom: string
  createdTo: string
  ordering: ReportOrdering
  page: number
}

export const TRANSITION_OPERATIONS = [
  'procesar',
  'resolver',
  'cancelar',
  'archivar',
  'reactivar',
] as const

export type TransitionOperation = (typeof TRANSITION_OPERATIONS)[number]

/** A transition the agent can run right now, as computed by the backend. */
export interface AvailableTransition {
  operation: TransitionOperation
  target: ReportStatus
  requires_reason: boolean
}

export interface ReportComment {
  id: number
  author: ReportAuthor
  text: string
  created_at: string
}

export interface StatusHistoryEntry {
  previous_status: ReportStatus | ''
  status: ReportStatus
  changed_by: ReportAuthor | null
  reason: string
  created_at: string
}

export interface PanelReportDetail {
  id: number
  photo: string | null
  description: string
  category: ReportCategory
  status: ReportStatus
  address: string
  latitude: string | null
  longitude: string | null
  created_at: string
  updated_at: string
  author: ReportAuthor
  like_count: number
  comments: ReportComment[]
  status_history: StatusHistoryEntry[]
  available_transitions: AvailableTransition[]
}
