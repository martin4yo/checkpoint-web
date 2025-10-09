'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Wifi, WifiOff, Circle, RefreshCw, Navigation } from 'lucide-react'

// Importar mapa dinámicamente para evitar SSR
const Map = dynamic(() => import('@/components/LiveMonitorMap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Cargando mapa...</div>
})

interface Device {
  userId: string
  userName: string
  userEmail: string
  journeyId: string
  journeyStartTime: string
  lastHeartbeat: string | null
  appState: string
  isConnectedViaWS: boolean
  lastLocation: {
    latitude: number
    longitude: number
    recordedAt: string
  } | null
  placeName: string
}

interface Summary {
  total: number
  connected: number
  active: number
  background: number
  inactive: number
  disconnected: number
}

export default function LiveMonitorPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/active-devices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDevices(data.devices || [])
        setSummary(data.summary || null)
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestLocation = async (userId: string, journeyId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/request-location', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, journeyId })
      })

      const data = await response.json()
      if (data.success) {
        alert('Solicitud de ubicación enviada')
      } else {
        alert(data.message || 'No se pudo enviar la solicitud')
      }
    } catch (error) {
      console.error('Error requesting location:', error)
      alert('Error al solicitar ubicación')
    }
  }

  useEffect(() => {
    fetchDevices()

    if (autoRefresh) {
      const interval = setInterval(fetchDevices, 5000) // Actualizar cada 5 segundos
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (appState: string) => {
    switch (appState) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'background': return 'text-yellow-600 bg-yellow-100'
      case 'inactive': return 'text-orange-600 bg-orange-100'
      case 'disconnected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
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

  const getLastUpdateTime = (device: Device) => {
    const time = device.lastHeartbeat || device.lastLocation?.recordedAt
    if (!time) return 'Nunca'

    const date = new Date(time)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Hace menos de 1 min'
    if (diffMins < 60) return `Hace ${diffMins} min`

    const diffHours = Math.floor(diffMins / 60)
    return `Hace ${diffHours}h ${diffMins % 60}min`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Cargando monitor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Monitor en Vivo</h1>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-actualizar
              </label>
              <button
                onClick={fetchDevices}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualizar ahora"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{summary.connected}</div>
                <div className="text-sm text-blue-600">Conectados WS</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.active}</div>
                <div className="text-sm text-green-600">Activos</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{summary.background}</div>
                <div className="text-sm text-yellow-600">Background</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{summary.inactive}</div>
                <div className="text-sm text-orange-600">Inactivos</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary.disconnected}</div>
                <div className="text-sm text-red-600">Desconectados</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de dispositivos */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Dispositivos Activos</h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {devices.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No hay dispositivos activos
                </div>
              ) : (
                devices.map((device) => (
                  <div
                    key={`${device.userId}-${device.journeyId}`}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedDevice?.userId === device.userId ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{device.userName}</h3>
                          {device.isConnectedViaWS ? (
                            <Wifi className="w-4 h-4 text-green-500" title="Conectado via WebSocket" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-gray-400" title="No conectado via WebSocket" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{device.placeName}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.appState)}`}>
                            <Circle className="w-2 h-2 fill-current" />
                            {getStatusLabel(device.appState)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getLastUpdateTime(device)}
                          </span>
                        </div>
                      </div>
                      {device.lastLocation && device.isConnectedViaWS && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            requestLocation(device.userId, device.journeyId)
                          }}
                          className="ml-4 p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Solicitar ubicación"
                        >
                          <Navigation className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mapa */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Mapa en Tiempo Real</h2>
            </div>
            <div className="h-[600px]">
              <Map devices={devices} selectedDevice={selectedDevice} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
