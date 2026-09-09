import type { Municipality } from '@/types/auth'

/**
 * Los siete estados del sistema, con los valores exactos que usa la API.
 *
 * `PENDING_CONFIRMATION` lo agregó US-046: el operario cierra el trabajo y el
 * reporte queda ahí hasta que el autor deja vencer la ventana de objeción
 * (US-047) o la usa apelando (US-048).
 */
export const REPORT_STATUSES = {
  PENDING_VALIDATION: 'pendiente_validacion',
  REPORTED: 'reportado',
  IN_PROGRESS: 'en_proceso',
  PENDING_CONFIRMATION: 'resuelto_pendiente_confirmacion',
  RESOLVED: 'resuelto',
  CANCELLED: 'cancelado',
  ARCHIVED: 'archivado',
} as const

export type ReportStatus = (typeof REPORT_STATUSES)[keyof typeof REPORT_STATUSES]

export const REPORT_STATUS_ORDER: readonly ReportStatus[] = [
  REPORT_STATUSES.PENDING_VALIDATION,
  REPORT_STATUSES.REPORTED,
  REPORT_STATUSES.IN_PROGRESS,
  REPORT_STATUSES.PENDING_CONFIRMATION,
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
  // Un cierre pendiente de confirmación sigue necesitando atención: el agente
  // puede confirmarlo antes de que venza el plazo, o ver que fue apelado.
  REPORT_STATUSES.PENDING_CONFIRMATION,
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

/** El área operativa responsable, resumida (US-028). */
export interface OperativeArea {
  id: number
  name: string
  is_active: boolean
}

/** Una comunicación institucional publicada sobre el reporte (US-024). */
export interface OfficialResponse {
  id: number
  text: string
  created_at: string
  /**
   * Quién la publicó. Solo viaja en el panel: ante el ciudadano responde la
   * municipalidad, con el mismo criterio de protección del personal de US-038.
   */
  author: ReportAuthor | null
  municipality: Municipality | null
}

/** De dónde salió una transición, más allá de a qué estado llegó (US-038). */
export type TransitionOrigin =
  | 'manual'
  | 'validacion_terreno'
  | 'validacion_colectiva'
  | 'cierre_operario'
  | 'confirmacion_automatica'
  | 'apelacion_ciudadano'
  | 'archivado_inactividad'

/** El parte de trabajo con el que un operario cerró el reporte (US-046). */
export interface ResolutionEvidence {
  id: number
  photo: string
  description: string
  created_at: string
  /**
   * Quién lo ejecutó. Viaja **solo en el panel**: ante el ciudadano responde
   * el área, con el mismo criterio de protección del personal de US-038.
   */
  operator: ReportAuthor | null
  operational_area: OperativeArea | null
  latitude: string | null
  longitude: string | null
}

/** La objeción del autor a un cierre (US-048). */
export interface ResolutionAppeal {
  id: number
  photo: string
  reason: string
  created_at: string
  author: ReportAuthor | null
  /** El cierre que se objetó, con el operario que lo firmó. */
  evidence: ResolutionEvidence | null
}

/** Un asiento del registro de asignaciones de área (US-028). */
export interface AreaAssignment {
  /** Nulo en la asignación inicial, la única sin área anterior. */
  previous_area: OperativeArea | null
  area: OperativeArea
  assigned_by: ReportAuthor | null
  created_at: string
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
  /** El área que se hizo cargo. Nula mientras el reporte no entró en gestión. */
  operative_area: OperativeArea | null
  /**
   * Si el municipio ya se pronunció sobre el reporte (US-024, escenario 13).
   * Es lo que deja identificar de un vistazo los reclamos sin comunicación.
   */
  has_official_response: boolean
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
  /**
   * Solo llega al pedir el listado con `closed_by`, por lo mismo que
   * `validation`: sin operario por el que preguntar no hay cierre del que
   * hablar. No lo reemplaza la fecha del reporte —después de una apelación el
   * cierre vigente puede ser de otro operario del área—.
   */
  closure: ReportClosure | null
}

/** El cierre en terreno del operario por el que se filtró (US-046). */
export interface ReportClosure {
  closed_at: string
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

/**
 * Las operaciones que el panel puede ejecutar.
 *
 * `resolver` desapareció en US-046: el agente ya no declara resuelto un trabajo
 * que no ejecutó. Lo reemplaza `confirmar_resolucion_municipal`, que confirma
 * el cierre del operario sin esperar a que venza la ventana de objeción.
 */
export const TRANSITION_OPERATIONS = [
  'procesar',
  'confirmar_resolucion_municipal',
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
  /**
   * Si la transición exige elegir un área operativa (US-028). Hoy solo
   * `procesar`: asignar el área **es** empezar la gestión, no un paso aparte.
   */
  requires_area: boolean
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
  /**
   * De dónde salió la transición. Es lo que distingue una validación en terreno
   * de una colectiva, o un cierre de operario de una confirmación automática:
   * los pares de estados no alcanzan porque varios caminos los comparten.
   */
  origin: TransitionOrigin | ''
  /** Cuántas confirmaciones tenía al validarse colectivamente (US-040). */
  confirmation_count: number | null
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
  /** El área responsable. Nula mientras el reporte no entró en gestión. */
  operational_area: OperativeArea | null
  area_assigned_at: string | null
  area_assignments: AreaAssignment[]
  /** Cuándo se archivó, sea por el municipio o por inactividad (US-031). */
  archived_at: string | null
  /** El hilo institucional, en orden cronológico. */
  official_responses: OfficialResponse[]
  /**
   * Si la acción de publicar se ofrece ahora mismo. Lo decide el servidor
   * desde la máquina de estados: el panel no replica la regla.
   */
  can_publish_official_response: boolean
  /**
   * Los partes de trabajo, en orden cronológico. Son más de uno cuando hubo
   * una apelación: el segundo cierre no pisa al primero (US-048).
   */
  resolution_evidences: ResolutionEvidence[]
  resolution_appeals: ResolutionAppeal[]
  /** Cuándo el operario registró la resolución. Nulo si nadie la registró. */
  closed_at: string | null
  /** Hasta cuándo el autor puede objetar el cierre (US-047). */
  objection_deadline: string | null
  appeal_count: number
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
