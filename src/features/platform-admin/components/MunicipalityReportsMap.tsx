import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { divIcon, type LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { messages } from '@/config/messages'
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
    html: `<span style="background:${STATUS_COLOR[status]}" class="block size-3 rounded-full border-2 border-background shadow"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
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
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
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
      className="h-[28rem] w-full rounded-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hasCenter && municipality.coverage_radius_km && (
        <Circle
          center={center}
          radius={Number(municipality.coverage_radius_km) * KM_TO_METERS}
          pathOptions={{ color: 'var(--color-primary)', weight: 1, opacity: 0.6 }}
        />
      )}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[Number(marker.latitude), Number(marker.longitude)]}
          icon={markerIcon(marker.status)}
        >
          <Popup>
            <span className="font-medium">
              #{marker.number ?? marker.id} ·{' '}
              {messages.reports.category[marker.category]}
            </span>
            <br />
            {messages.reports.status[marker.status]}
            {marker.address && (
              <>
                <br />
                {marker.address}
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
