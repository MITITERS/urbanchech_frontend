import type { Municipality } from '@/types/auth'
import type { ReportCategory, ReportStatus } from '@/features/reports/types'

export type { Municipality }

/**
 * A municipality as the admin API returns it, including its coverage area:
 * the centre and radius that decide which reports reach this city.
 */
/** Un vértice del límite: `[latitud, longitud]`, como lo espera Leaflet. */
export type BoundaryPoint = [number, number]

export interface MunicipalityDetail extends Municipality {
  /** Centro de la ciudad. Encuadra el mapa; el límite lo pone `boundary`. */
  latitude: string | null
  longitude: string | null
  /** Polígono del límite del municipio. Nulo mientras nadie lo trazó. */
  boundary: BoundaryPoint[] | null
  is_active: boolean
  report_count: number
  user_count: number
  created_at: string
}

export interface MunicipalityPayload {
  city: string
  province: string
  latitude: number
  longitude: number
  boundary: BoundaryPoint[]
}

/** Minimal payload the coverage map needs for one marker. */
export interface MunicipalityReportMarker {
  id: number
  /** Número dentro de la municipalidad: es como lo nombra el popup. */
  number: number | null
  category: ReportCategory
  status: ReportStatus
  latitude: string
  longitude: string
  address: string
}

export interface MunicipalAgent {
  id: number
  name: string
  email: string
  /** Foto de perfil. Nula mientras la cuenta no haya subido ninguna. */
  avatar: string | null
  municipality: MunicipalityDetail | null
  /** Baja lógica: sin esto la cuenta existe pero el panel no le responde. */
  is_active_agent: boolean
  /** Cambios de estado que gestionó desde el panel. */
  management_count: number
  must_change_password: boolean
}

export interface MunicipalAgentPayload {
  name: string
  email: string
  temporaryPassword: string
  municipalityId: number
}
