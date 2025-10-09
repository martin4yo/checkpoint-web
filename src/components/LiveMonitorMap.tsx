'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Device {
  userId: string
  userName: string
  appState: string
  lastLocation: {
    latitude: number
    longitude: number
    recordedAt: string
  } | null
  placeName: string
}

interface LiveMonitorMapProps {
  devices: Device[]
  selectedDevice: Device | null
}

// Componente para centrar el mapa en el dispositivo seleccionado
function MapController({ selectedDevice }: { selectedDevice: Device | null }) {
  const map = useMap()

  useEffect(() => {
    if (selectedDevice?.lastLocation) {
      map.setView(
        [selectedDevice.lastLocation.latitude, selectedDevice.lastLocation.longitude],
        15,
        { animate: true }
      )
    }
  }, [selectedDevice, map])

  return null
}

export default function LiveMonitorMap({ devices, selectedDevice }: LiveMonitorMapProps) {
  const mapRef = useRef<L.Map | null>(null)

  // Iconos personalizados según estado
  const createIcon = (appState: string) => {
    let color = '#6b7280' // gray
    switch (appState) {
      case 'active': color = '#10b981'; break // green
      case 'background': color = '#f59e0b'; break // yellow
      case 'inactive': color = '#f97316'; break // orange
      case 'disconnected': color = '#ef4444'; break // red
    }

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    })
  }

  // Calcular centro del mapa basado en todos los dispositivos
  const getMapCenter = (): [number, number] => {
    const devicesWithLocation = devices.filter(d => d.lastLocation)

    if (devicesWithLocation.length === 0) {
      // Buenos Aires por defecto
      return [-34.6037, -58.3816]
    }

    if (selectedDevice?.lastLocation) {
      return [selectedDevice.lastLocation.latitude, selectedDevice.lastLocation.longitude]
    }

    // Promedio de todas las ubicaciones
    const avgLat = devicesWithLocation.reduce((sum, d) => sum + d.lastLocation!.latitude, 0) / devicesWithLocation.length
    const avgLng = devicesWithLocation.reduce((sum, d) => sum + d.lastLocation!.longitude, 0) / devicesWithLocation.length

    return [avgLat, avgLng]
  }

  const getStatusLabel = (appState: string) => {
    switch (appState) {
      case 'active': return 'Activo'
      case 'background': return 'Segundo plano'
      case 'inactive': return 'Inactivo'
      case 'disconnected': return 'Desconectado'
      default: return 'Desconocido'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <MapContainer
      center={getMapCenter()}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController selectedDevice={selectedDevice} />

      {devices.map((device) => {
        if (!device.lastLocation) return null

        return (
          <Marker
            key={`${device.userId}-marker`}
            position={[device.lastLocation.latitude, device.lastLocation.longitude]}
            icon={createIcon(device.appState)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-gray-900">{device.userName}</h3>
                <p className="text-sm text-gray-600">{device.placeName}</p>
                <div className="mt-2 space-y-1 text-xs">
                  <p>
                    <span className="font-medium">Estado:</span>{' '}
                    <span className={
                      device.appState === 'active' ? 'text-green-600' :
                      device.appState === 'background' ? 'text-yellow-600' :
                      device.appState === 'inactive' ? 'text-orange-600' :
                      'text-red-600'
                    }>
                      {getStatusLabel(device.appState)}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Última actualización:</span>{' '}
                    {formatTime(device.lastLocation.recordedAt)}
                  </p>
                  <p className="text-gray-500">
                    {device.lastLocation.latitude.toFixed(6)}, {device.lastLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
