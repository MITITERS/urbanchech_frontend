import type { Municipality } from '@/types/auth'

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

/** Qué decidió un validador sobre un reporte, y cuándo. */
export interface ReportValidation {
  /**
   * Quién decidió. Viaja en el detalle; en el listado va nulo, porque ahí ya se
   * está filtrando por un validador y repetirlo por fila no aporta.
   */
  validator: ReportAuthor | null
  decided_at: string
  outcome: 'validado' | 'rechazado'
}

export interface PanelReportRow {
  id: number
  /**
   * Número del reporte **dentro de su municipalidad**: es como lo nombran el
   * vecino y el municipio. El `id` sigue siendo lo que va en las URLs.
   */
  number: number | null
  category: ReportCategory
  status: ReportStatus
  created_at: string
  address: string
  latitude: string | null
  longitude: string | null
  like_count: number
  operative_area: string | null
  /** Jurisdicción del reporte. La necesita el admin para distinguir filas. */
  municipality: Municipality | null
  author: ReportAuthor
  /**
   * Solo llega al pedir el listado con `validated_by`: es la única consulta en
   * la que hay un validador del que hablar. El estado del reporte no lo
   * reemplaza —uno validado y cancelado después figura igual que uno
   * rechazado—.
   */
  validation: ReportValidation | null
}

/** Ordering values accepted by the API. */
export type ReportOrdering = 'created_at' | '-created_at' | 'like_count' | '-like_count'

/**
 * Tamaños de página que ofrece el panel.
 *
 * El tope lo pone el backend (`PanelPagination.max_page_size`): pedir más de
 * eso no trae más filas, así que ofrecerlo sería mentir.
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export interface ReportFilters {
  statuses: ReportStatus[]
  categories: ReportCategory[]
  zone: string
  createdFrom: string
  createdTo: string
  ordering: ReportOrdering
  page: number
  /** Cuántas filas por página. Lo elige quien mira, no el servidor. */
  pageSize: number
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
  /** Número dentro de su municipalidad: es como se lo nombra en pantalla. */
  number: number | null
  /** A dónde vuelve el admin, que llega acá desde la ficha de un municipio. */
  municipality: Municipality | null
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
  /**
   * Qué decidió el validador que salió a mirarlo. Nulo si nadie lo decidió.
   *
   * Lo resuelve el servidor y no el panel: `reactivar` deja el reporte en
   * *Reportado* y `cancelar` lo deja en *Cancelado*, pero las dos las ejecuta
   * un agente, así que deducirlo del historial haría pasar a ese agente por
   * validador.
   */
  validation: ReportValidation | null
}
