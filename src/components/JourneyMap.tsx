'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Importar Leaflet dinámicamente para evitar problemas con SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })

interface JourneyLocation {
  id: string
  latitude: number
  longitude: number
  recordedAt: string
}

interface JourneyMapProps {
  locations: JourneyLocation[]
  journeyName: string
  selectedLocation?: JourneyLocation | null
}

// Crear componente dinámico para manejar el centrado
const MapCenterController = dynamic(() =>
  import('react-leaflet').then(mod => {
    function CenterController({ selectedLocation }: { selectedLocation?: JourneyLocation | null }) {
      const map = mod.useMap()

      useEffect(() => {
        if (selectedLocation) {
          map.setView([selectedLocation.latitude, selectedLocation.longitude], 16, {
            animate: true,
            duration: 0.5
          })
        }
      }, [selectedLocation, map])

      return null
    }
    return CenterController
  }),
  { ssr: false }
)

export default function JourneyMap({ locations, selectedLocation }: JourneyMapProps) {
  const [leaflet, setLeaflet] = useState<typeof import('leaflet') | null>(null)

  useEffect(() => {
    // Importar Leaflet dinámicamente
    import('leaflet').then((L) => {
      setLeaflet(L)

      // Configurar iconos de Leaflet
      delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })
    })
  }, [])

  if (!leaflet || locations.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">
          {!leaflet ? 'Cargando mapa...' : 'No hay ubicaciones para mostrar'}
        </p>
      </div>
    )
  }

  // Centrar el mapa en la última ubicación (más reciente)
  const lastLocation = locations[locations.length - 1]
  const centerLat = lastLocation ? lastLocation.latitude : 0
  const centerLng = lastLocation ? lastLocation.longitude : 0

  // Preparar coordenadas para la polilínea
  const pathCoordinates = locations.map(loc => [loc.latitude, loc.longitude] as [number, number])

  // Iconos personalizados para inicio y fin
  const startIcon = leaflet ? new leaflet.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }) : null

  const endIcon = leaflet ? new leaflet.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }) : null

  const selectedIcon = leaflet ? new leaflet.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }) : null

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Línea del recorrido */}
        <Polyline
          positions={pathCoordinates}
          color="#3B82F6"
          weight={3}
          opacity={0.8}
        />

        {/* Marcador de inicio */}
        {locations.length > 0 && startIcon && (
          <Marker
            position={[locations[0].latitude, locations[0].longitude]}
            icon={startIcon}
          >
            <Popup>
              <div>
                <strong>Inicio de Jornada</strong><br />
                {new Date(locations[0].recordedAt).toLocaleString()}<br />
                <small>{locations[0].latitude.toFixed(6)}, {locations[0].longitude.toFixed(6)}</small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador de fin (si hay más de una ubicación) */}
        {locations.length > 1 && endIcon && (
          <Marker
            position={[locations[locations.length - 1].latitude, locations[locations.length - 1].longitude]}
            icon={endIcon}
          >
            <Popup>
              <div>
                <strong>Último Registro</strong><br />
                {new Date(locations[locations.length - 1].recordedAt).toLocaleString()}<br />
                <small>{locations[locations.length - 1].latitude.toFixed(6)}, {locations[locations.length - 1].longitude.toFixed(6)}</small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador de ubicación seleccionada */}
        {selectedLocation && selectedIcon && (
          <Marker
            position={[selectedLocation.latitude, selectedLocation.longitude]}
            icon={selectedIcon}
          >
            <Popup>
              <div>
                <strong>Ubicación Seleccionada</strong><br />
                {new Date(selectedLocation.recordedAt).toLocaleString()}<br />
                <small>{selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}</small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Controlador para centrar el mapa */}
        <MapCenterController selectedLocation={selectedLocation} />
      </MapContainer>
    </div>
  )
}