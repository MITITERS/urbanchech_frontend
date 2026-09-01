import { Link } from 'react-router-dom'
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { ArrowUpRight } from 'lucide-react'
import { divIcon, type LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { messages } from '@/config/messages'
import { ReportStatusBadge } from '@/features/reports/components/ReportStatusBadge'
import { REPORT_STATUSES, type ReportStatus } from '@/features/reports/types'
import type { MunicipalityDetail, MunicipalityReportMarker } from '../types'

const DEFAULT_ZOOM = 13
const KM_TO_METERS = 1000

/** Un color por estado, tomado de los tokens del proyecto. */
const STATUS_COLOR: Record<ReportStatus, string> = {
  [REPORT_STATUSES.PENDING_VALIDATION]: 'var(--status-pending)',
  [REPORT_STATUSES.REPORTED]: 'var(--status-in-progress)',
  [REPORT_STATUSES.IN_PROGRESS]: 'var(--status-in-progress)',
  [REPORT_STATUSES.RESOLVED]: 'var(--status-resolved)',
  [REPORT_STATUSES.CANCELLED]: 'var(--status-rejected)',
  [REPORT_STATUSES.ARCHIVED]: 'var(--muted-foreground)',
}

function markerIcon(status: ReportStatus) {
  return divIcon({
    className: '',
    html: `<span style="background:${STATUS_COLOR[status]}" class="block size-3.5 rounded-full border-2 border-background shadow-md"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

interface Props {
  municipality: MunicipalityDetail
  markers: MunicipalityReportMarker[]
}

/**
 * Reportes del municipio sobre el mapa, con su área de cobertura dibujada:
 * juntos explican por qué esos reportes y no otros cayeron acá.
 */
export function MunicipalityReportsMap({ municipality, markers }: Props) {
  const hasCenter = municipality.latitude !== null && municipality.longitude !== null

  if (markers.length === 0 && !hasCenter) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        {messages.municipalities.noMarkers}
      </p>
    )
  }

  const center: LatLngExpression = hasCenter
    ? [Number(municipality.latitude), Number(municipality.longitude)]
    : [Number(markers[0].latitude), Number(markers[0].longitude)]

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={false}
      className="h-[28rem] w-full rounded-lg ring-1 ring-border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hasCenter && municipality.coverage_radius_km && (
        <Circle
          center={center}
          radius={Number(municipality.coverage_radius_km) * KM_TO_METERS}
          // El área rellena y no solo su contorno: es lo que explica de un
          // vistazo por qué esos reportes cayeron en este municipio.
          pathOptions={{
            color: 'var(--color-primary)',
            weight: 1.5,
            opacity: 0.5,
            fillColor: 'var(--color-primary)',
            fillOpacity: 0.06,
          }}
        />
      )}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[Number(marker.latitude), Number(marker.longitude)]}
          icon={markerIcon(marker.status)}
        >
          <Popup>
            {/*
              El popup es la única salida del mapa hacia el reporte. Sin el
              enlace, ubicar un reclamo y querer gestionarlo obligaba a volver
              a la pestaña Lista y buscar el número a mano.
            */}
            <div className="flex min-w-44 flex-col items-start gap-1.5">
              <span className="font-medium">
                #{marker.number ?? marker.id} ·{' '}
                {messages.reports.category[marker.category]}
              </span>
              <ReportStatusBadge status={marker.status} />
              {marker.address && (
                <span className="text-muted-foreground">{marker.address}</span>
              )}
              <Link
                to={`/reportes/${marker.id}`}
                className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
              >
                {messages.reports.openDetail}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
