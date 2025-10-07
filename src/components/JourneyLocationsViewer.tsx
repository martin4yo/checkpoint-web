'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, ExternalLink, Navigation, MapPin } from 'lucide-react'
import JourneyMap from '@/components/JourneyMap'

interface JourneyLocation {
  id: string
  latitude: number
  longitude: number
  recordedAt: string
}

interface JourneyLocationsViewerProps {
  journeyId: string
  journeyName: string
  userName: string
  startTime: string
  endTime?: string | null
  onClose: () => void
}

export default function JourneyLocationsViewer({
  journeyId,
  journeyName,
  userName,
  startTime,
  endTime,
  onClose
}: JourneyLocationsViewerProps) {
  const [locations, setLocations] = useState<JourneyLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<JourneyLocation | null>(null)

  const fetchJourneyLocations = useCallback(async () => {
    try {
      const response = await fetch(`/api/mobile/journey/${journeyId}/locations`)
      if (response.ok) {
        const data = await response.json()
        const sortedLocations = (data.locations || []).sort((a: JourneyLocation, b: JourneyLocation) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        )
        setLocations(sortedLocations)
      }
    } catch (error) {
      console.error('Error fetching journey locations:', error)
    } finally {
      setLoading(false)
    }
  }, [journeyId])

  useEffect(() => {
    fetchJourneyLocations()
  }, [fetchJourneyLocations])

  const calculateTimeDifference = (currentLocation: JourneyLocation, previousLocation: JourneyLocation) => {
    const currentTime = new Date(currentLocation.recordedAt).getTime()
    const previousTime = new Date(previousLocation.recordedAt).getTime()
    const diffMs = currentTime - previousTime

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const calculateTotalTime = () => {
    if (locations.length < 2) return '00:00'

    const firstLocation = locations[0]
    const lastLocation = locations[locations.length - 1]
    const totalMs = new Date(lastLocation.recordedAt).getTime() - new Date(firstLocation.recordedAt).getTime()

    const hours = Math.floor(totalMs / (1000 * 60 * 60))
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="relative inline-block w-full max-w-6xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Ubicaciones de Jornada - {journeyName}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              <p><strong>Usuario:</strong> {userName}</p>
              <p><strong>Inicio:</strong> {new Date(startTime).toLocaleString('es-ES')}</p>
              {endTime && (
                <p><strong>Fin:</strong> {new Date(endTime).toLocaleString('es-ES')}</p>
              )}
              {locations.length >= 2 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 font-semibold">
                    <strong>Tiempo Total de Jornada:</strong> {calculateTotalTime()}
                  </p>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Cargando ubicaciones...</div>
              </div>
            ) : (
              <div className="flex gap-4 h-96">
                {locations.length > 0 && (
                  <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
                    <div className="p-3 border-b border-gray-200">
                      <h4 className="font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                        Mapa del Recorrido
                      </h4>
                    </div>
                    <div className="flex-1">
                      <JourneyMap
                        locations={locations}
                        journeyName={journeyName}
                        selectedLocation={selectedLocation}
                      />
                    </div>
                  </div>
                )}

                <div className="w-80 bg-gray-50 rounded-lg flex flex-col">
                  <div className="p-3 border-b border-gray-200">
                    <h4 className="font-medium text-sm">Ubicaciones ({locations.length})</h4>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {locations.length === 0 ? (
                      <p className="text-gray-500 p-3 text-sm">No hay ubicaciones registradas para esta jornada.</p>
                    ) : (
                      <div className="h-full overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="text-left p-2 font-medium">ID</th>
                              <th className="text-left p-2 font-medium">Hora</th>
                              <th className="text-left p-2 font-medium">Min</th>
                              <th className="text-center p-2 font-medium">Maps</th>
                            </tr>
                          </thead>
                          <tbody>
                            {locations.map((location, index) => (
                              <tr
                                key={location.id}
                                className={`cursor-pointer transition-colors hover:bg-blue-50 border-b border-gray-200 ${
                                  selectedLocation?.id === location.id ? 'bg-blue-100' : 'bg-white'
                                }`}
                                onClick={() => setSelectedLocation(location)}
                              >
                                <td className="p-2">
                                  <div className="flex items-center space-x-1">
                                    <Navigation className="h-3 w-3 text-purple-600" />
                                    <span className="font-medium">
                                      {index === 0 ? 'Inicio' : index === locations.length - 1 ? 'Último' : `#${index + 1}`}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2 text-gray-600">
                                  {new Date(location.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{new Date(location.recordedAt).getMilliseconds().toString().padStart(3, '0')}
                                </td>
                                <td className="p-2">
                                  {index > 0 && (
                                    <span className="text-green-700 font-medium">
                                      +{calculateTimeDifference(location, locations[index - 1])}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}&t=satellite&z=18`
                                      window.open(url, '_blank')
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}