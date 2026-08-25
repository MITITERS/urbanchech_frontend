import { useEffect } from 'react'
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { divIcon, type LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { messages } from '@/config/messages'

const DEFAULT_ZOOM = 12
const KM_TO_METERS = 1000

/** Centro de Córdoba: punto de partida razonable cuando no hay nada elegido. */
const FALLBACK_CENTER: LatLngExpression = [-31.4201, -64.1888]

const centerIcon = divIcon({
  className: '',
  html: '<span class="block size-3 rounded-full border-2 border-background bg-primary shadow"></span>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

function Recenter({
  latitude,
  longitude,
}: {
  latitude: number | null
  longitude: number | null
}) {
  const map = useMap()

  // `center` de MapContainer solo aplica al montarlo: para seguir a la ciudad
  // que se está escribiendo hay que mover la vista a mano.
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], map.getZoom())
    }
  }, [latitude, longitude, map])

  return null
}

function ClickHandler({
  onPick,
}: {
  onPick: (latitude: number, longitude: number) => void
}) {
  useMapEvents({
    click: (event) => onPick(event.latlng.lat, event.latlng.lng),
  })
  return null
}

interface CoverageMapPickerProps {
  latitude: number | null
  longitude: number | null
  radiusKm: number
  onPick: (latitude: number, longitude: number) => void
}

/**
 * Mapa para delimitar el área de cobertura de un municipio.
 *
 * El círculo se dibuja con el radio real, así que el administrador ve
 * exactamente qué zona va a alimentar a ese municipio antes de guardarlo — que
 * es la diferencia entre elegir un número a ciegas y tomar una decisión.
 */
export function CoverageMapPicker({
  latitude,
  longitude,
  radiusKm,
  onPick,
}: CoverageMapPickerProps) {
  const hasCenter = latitude !== null && longitude !== null
  const center: LatLngExpression = hasCenter ? [latitude, longitude] : FALLBACK_CENTER

  return (
    <div className="space-y-2">
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        className="h-56 w-full rounded-md"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onPick} />
        <Recenter latitude={latitude} longitude={longitude} />
        {hasCenter && (
          <>
            <Marker position={[latitude, longitude]} icon={centerIcon} />
            {radiusKm > 0 && (
              <Circle
                center={[latitude, longitude]}
                radius={radiusKm * KM_TO_METERS}
                pathOptions={{ color: 'var(--color-primary)', weight: 2 }}
              />
            )}
          </>
        )}
      </MapContainer>
      <p className="text-xs text-muted-foreground">
        {hasCenter
          ? `${messages.municipalities.center}: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          : messages.municipalities.centerHint}
      </p>
    </div>
  )
}
