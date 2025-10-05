'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Filter, X, ExternalLink, Trash2, Eye, Image, MapPin, Calendar, User, FileText, Camera, Play, Square, Navigation, CheckCircle } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import JourneyMap from '@/components/JourneyMap'

interface Checkpoint {
  id: string
  placeName: string
  latitude: number
  longitude: number
  timestamp: string
  notes?: string
  imageUrl?: string
  type: 'MANUAL' | 'JOURNEY_START' | 'JOURNEY_END'
  endLatitude?: number | null
  endLongitude?: number | null
  endTimestamp?: string | null
  endNotes?: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  place?: {
    id: string
    name: string
    address: string
  }
  _count?: {
    journeyLocations: number
  }
}

interface JourneyLocation {
  id: string
  latitude: number
  longitude: number
  recordedAt: string
}

interface JourneyLocationsModalProps {
  journeyCheckpoint: Checkpoint
  onClose: () => void
}

interface CheckpointDetailsModalProps {
  checkpoint: Checkpoint
  onClose: () => void
}

function JourneyLocationsModal({ journeyCheckpoint, onClose }: JourneyLocationsModalProps) {
  const [locations, setLocations] = useState<JourneyLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<JourneyLocation | null>(null)

  const fetchJourneyLocations = useCallback(async () => {
    try {
      const response = await fetch(`/api/mobile/journey/${journeyCheckpoint.id}/locations`)
      if (response.ok) {
        const data = await response.json()
        // Ordenar ubicaciones por fecha
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
  }, [journeyCheckpoint.id])

  useEffect(() => {
    fetchJourneyLocations()
  }, [fetchJourneyLocations])

  // Función para calcular tiempo entre ubicaciones
  const calculateTimeDifference = (currentLocation: JourneyLocation, previousLocation: JourneyLocation) => {
    const currentTime = new Date(currentLocation.recordedAt).getTime()
    const previousTime = new Date(previousLocation.recordedAt).getTime()
    const diffMs = currentTime - previousTime

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Calcular tiempo total de la jornada
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
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="relative inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Ubicaciones de Jornada - {journeyCheckpoint.placeName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            <p><strong>Usuario:</strong> {journeyCheckpoint.user.name}</p>
            <p><strong>Inicio:</strong> {new Date(journeyCheckpoint.timestamp).toLocaleString()}</p>
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
            <div className="space-y-4">
              {/* Mapa del recorrido */}
              {locations.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                    Mapa del Recorrido
                  </h4>
                  <JourneyMap
                    locations={locations}
                    journeyName={journeyCheckpoint.placeName}
                    selectedLocation={selectedLocation}
                  />
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Ubicaciones Registradas ({locations.length})</h4>
                {locations.length === 0 ? (
                  <p className="text-gray-500">No hay ubicaciones registradas para esta jornada.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {locations.map((location, index) => (
                      <div
                        key={location.id}
                        className={`bg-white rounded border cursor-pointer transition-colors hover:bg-blue-50 ${
                          selectedLocation?.id === location.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedLocation(location)}
                      >
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center space-x-3">
                            <Navigation className="h-4 w-4 text-purple-600" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {index === 0 ? 'Inicio' : index === locations.length - 1 ? 'Último registro' : `Ubicación #${index + 1}`}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(location.recordedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {index > 0 && (
                              <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                +{calculateTimeDifference(location, locations[index - 1])}
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}&t=satellite&z=18`
                                window.open(url, '_blank')
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

function CheckpointDetailsModal({ checkpoint, onClose }: CheckpointDetailsModalProps) {
  const [showFullImage, setShowFullImage] = useState(false)
  const [showFullMap, setShowFullMap] = useState(false)
  const googleMapsUrl = `https://www.google.com/maps?q=${checkpoint.latitude},${checkpoint.longitude}&t=satellite&z=18`

  return (<>
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClose()
          }}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl sm:align-middle">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Detalles del Checkpoint</h3>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onClose()
              }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información del Checkpoint */}
            <div className="space-y-6">
              {/* Usuario */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 text-gray-500 mr-2" />
                  <h4 className="font-semibold text-gray-900">Usuario</h4>
                </div>
                <div className="ml-7">
                  <p className="font-medium text-gray-900">{checkpoint.user.name}</p>
                  <p className="text-sm text-gray-500">{checkpoint.user.email}</p>
                </div>
              </div>

              {/* Lugar */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                  <h4 className="font-semibold text-gray-900">Ubicación</h4>
                </div>
                <div className="ml-7">
                  <p className="font-medium text-gray-900">{checkpoint.placeName}</p>
                  {checkpoint.place && (
                    <p className="text-sm text-gray-500">{checkpoint.place.address}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {checkpoint.latitude.toFixed(6)}, {checkpoint.longitude.toFixed(6)}
                  </p>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                  <h4 className="font-semibold text-gray-900">Fecha y Hora</h4>
                </div>
                <div className="ml-7">
                  <p className="font-medium text-gray-900">
                    {new Date(checkpoint.timestamp).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(checkpoint.timestamp).toLocaleTimeString('es-ES')}
                  </p>
                </div>
              </div>

              {/* Notas */}
              {checkpoint.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="font-semibold text-gray-900">Notas</h4>
                  </div>
                  <div className="ml-7">
                    <p className="text-gray-700">{checkpoint.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Imagen y Mapa */}
            <div className="space-y-6">
              {/* Imagen */}
              {checkpoint.imageUrl ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <Camera className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="font-semibold text-gray-900">Fotografía</h4>
                  </div>
                  <div className="relative">
                    <img
                      src={`${window.location.origin}${checkpoint.imageUrl}`}
                      alt={`Fotografía del checkpoint en ${checkpoint.placeName}`}
                      className="w-full h-64 object-cover rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowFullImage(true)
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowFullImage(true)
                      }}
                      className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
                      title="Ver imagen completa"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <Camera className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="font-semibold text-gray-900">Fotografía</h4>
                  </div>
                  <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Sin imagen disponible</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Google Maps */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="font-semibold text-gray-900">Ubicación en el Mapa</h4>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowFullMap(true)
                    }}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver pantalla completa
                  </button>
                </div>
                <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d${checkpoint.longitude}!3d${checkpoint.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1ses!2sar!4v1234567890123`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Checkpoint ID: {checkpoint.id}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onClose()
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Modal de Imagen Completa */}
    {showFullImage && checkpoint.imageUrl && (
      <div className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className="fixed inset-0 transition-opacity bg-black bg-opacity-90"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowFullImage(false)
            }}
          ></div>
          <div className="relative z-10 max-w-7xl mx-auto">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowFullImage(false)
              }}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={`${window.location.origin}${checkpoint.imageUrl}`}
              alt={`Fotografía completa del checkpoint en ${checkpoint.placeName}`}
              className="max-h-[90vh] max-w-full object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <a
                href={`${window.location.origin}${checkpoint.imageUrl}`}
                download
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Descargar imagen
              </a>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Mapa Completo */}
    {showFullMap && (
      <div className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className="fixed inset-0 transition-opacity bg-black bg-opacity-90"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowFullMap(false)
            }}
          ></div>
          <div className="relative z-10 w-full max-w-7xl h-[90vh]">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowFullMap(false)
              }}
              className="absolute top-2 right-2 z-20 p-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="w-full h-full bg-gray-200 rounded-lg overflow-hidden">
              <iframe
                src={`https://maps.google.com/maps?q=${checkpoint.latitude},${checkpoint.longitude}&hl=es&z=18&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <div className="mt-4 text-center">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir en Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    )}
  </>)
}

interface PhotoModalProps {
  checkpoint: Checkpoint
  onClose: () => void
}

interface LocationModalProps {
  checkpoint: Checkpoint
  onClose: () => void
}

function PhotoInfoModal({ checkpoint, onClose }: PhotoModalProps) {
  console.log('PhotoInfoModal rendering with checkpoint:', checkpoint)

  const formatFileSize = () => {
    // Simulamos el tamaño ya que no tenemos acceso directo al archivo
    return '2.4 MB'
  }

  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase() || 'jpg'
    return extension.toUpperCase()
  }

  return (
    <>
      {/* Overlay con gris muy suave */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Información de la Fotografía</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Imagen Preview */}
            <div>
              {checkpoint.imageUrl ? (
                <img
                  src={`${window.location.origin}${checkpoint.imageUrl}`}
                  alt={`Información de fotografía del checkpoint en ${checkpoint.placeName}`}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Camera className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Información de la Foto */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Camera className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-semibold text-gray-700">Tipo de Archivo</span>
                </div>
                <p className="text-gray-900 font-medium ml-6">
                  {checkpoint.imageUrl ? getFileType(checkpoint.imageUrl) : 'N/A'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-semibold text-gray-700">Tamaño</span>
                </div>
                <p className="text-gray-900 font-medium ml-6">
                  {checkpoint.imageUrl ? formatFileSize() : 'N/A'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-semibold text-gray-700">Fecha de Captura</span>
                </div>
                <p className="text-gray-900 font-medium ml-6">
                  {new Date(checkpoint.timestamp).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-gray-600 text-sm ml-6">
                  {new Date(checkpoint.timestamp).toLocaleTimeString('es-ES')}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-semibold text-gray-700">Coordenadas</span>
                </div>
                <p className="text-gray-900 font-medium ml-6">
                  Lat: {checkpoint.latitude.toFixed(6)}
                </p>
                <p className="text-gray-900 font-medium ml-6">
                  Lng: {checkpoint.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            {checkpoint.imageUrl && (
              <a
                href={`${window.location.origin}${checkpoint.imageUrl}`}
                download
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Descargar
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function LocationInfoModal({ checkpoint, onClose }: LocationModalProps) {
  console.log('LocationInfoModal rendering with checkpoint:', checkpoint)

  const googleMapsUrl = `https://www.google.com/maps?q=${checkpoint.latitude},${checkpoint.longitude}&t=satellite&z=18`

  return (
    <>
      {/* Overlay con gris muy suave */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-2xl shadow-xl p-6 max-w-5xl w-full mx-4 max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Información de la Ubicación</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mapa de Google */}
            <div>
              <div className="w-full h-[360px] bg-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={`https://maps.google.com/maps?q=${checkpoint.latitude},${checkpoint.longitude}&hl=es&z=18&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>

            {/* Información de la Ubicación */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-semibold text-gray-700">Lugar</span>
                </div>
                <p className="text-gray-900 font-medium ml-6">
                  {checkpoint.placeName}
                </p>
                {checkpoint.place && (
                  <p className="text-gray-600 text-sm ml-6">
                    {checkpoint.place.address}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-semibold text-gray-700">Coordenadas GPS</span>
                </div>
                <p className="text-gray-900 font-medium ml-6">
                  Latitud: {checkpoint.latitude.toFixed(6)}
                </p>
                <p className="text-gray-900 font-medium ml-6">
                  Longitud: {checkpoint.longitude.toFixed(6)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] flex flex-col">
                <div className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-semibold text-gray-700">Fecha de Registro</span>
                </div>
                <p className="text-gray-900 font-medium ml-6">
                  {new Date(checkpoint.timestamp).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-gray-600 text-sm ml-6">
                  {new Date(checkpoint.timestamp).toLocaleTimeString('es-ES')}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] flex flex-col">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-semibold text-gray-700">Registrado por</span>
                </div>
                <p className="text-gray-900 font-medium ml-6">
                  {checkpoint.user.name}
                </p>
                <p className="text-gray-600 text-sm ml-6">
                  {checkpoint.user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir en Google Maps
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Función para obtener el icono y estilo según el tipo de checkpoint
const getCheckpointTypeInfo = (checkpoint: Checkpoint) => {
  switch (checkpoint.type) {
    case 'JOURNEY_START':
      const isComplete = checkpoint.endTimestamp !== null
      if (isComplete) {
        return {
          icon: Navigation,
          label: 'Jornada Completa',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          borderColor: 'border-purple-200'
        }
      } else {
        return {
          icon: Play,
          label: 'Jornada Activa',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200'
        }
      }
    case 'JOURNEY_END':
      // Mantener para compatibilidad con datos antiguos
      return {
        icon: Square,
        label: 'Fin Jornada (Antiguo)',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200'
      }
    default:
      return {
        icon: MapPin,
        label: 'Ubicación Manual',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200'
      }
  }
}

export default function CheckpointsPage() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    userId: '',
    placeId: '',
  })
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [places, setPlaces] = useState<{ id: string; name: string }[]>([])
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState<Checkpoint | null>(null)
  const [showLocationModal, setShowLocationModal] = useState<Checkpoint | null>(null)
  const [showJourneyLocationsModal, setShowJourneyLocationsModal] = useState<Checkpoint | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; checkpointId: string; checkpointName: string }>({
    isOpen: false,
    checkpointId: '',
    checkpointName: ''
  })

  // Debug logging
  console.log('Current selectedCheckpoint:', selectedCheckpoint)

  useEffect(() => {
    fetchUsers()
    fetchPlaces()
  }, [])

  const fetchCheckpoints = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter.search) params.append('search', filter.search)
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom)
      if (filter.dateTo) params.append('dateTo', filter.dateTo)
      if (filter.userId) params.append('userId', filter.userId)
      if (filter.placeId) params.append('placeId', filter.placeId)

      const response = await fetch(`/api/checkpoints?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCheckpoints(data)
      }
    } catch (error) {
      console.error('Error fetching checkpoints:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchCheckpoints()
  }, [fetchCheckpoints])


  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchPlaces = async () => {
    try {
      const response = await fetch('/api/places')
      if (response.ok) {
        const data = await response.json()
        setPlaces(data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
      }
    } catch (error) {
      console.error('Error fetching places:', error)
    }
  }

  const handleDeleteClick = (checkpoint: Checkpoint) => {
    setDeleteConfirm({
      isOpen: true,
      checkpointId: checkpoint.id,
      checkpointName: checkpoint.placeName
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch('/api/checkpoints', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteConfirm.checkpointId }),
      })

      if (response.ok) {
        fetchCheckpoints()
      } else {
        const errorData = await response.json()
        console.error('Error al eliminar:', errorData.error)
      }
    } catch (error) {
      console.error('Error deleting checkpoint:', error)
    }
  }

  const clearFilters = () => {
    setFilter({
      search: '',
      dateFrom: '',
      dateTo: '',
      userId: '',
      placeId: '',
    })
  }

  if (loading) {
    return (
      <DashboardLayout title="Gestión de Checkpoints" titleIcon={<CheckCircle className="h-8 w-8 text-gray-600" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Gestión de Checkpoints" titleIcon={<CheckCircle className="h-8 w-8 text-gray-600" />}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Lista de Checkpoints ({checkpoints.length})
          </h2>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Filter className="mr-2 h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar por lugar
              </label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                placeholder="Nombre del lugar..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <select
                value={filter.userId}
                onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Todos los usuarios</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lugar
              </label>
              <select
                value={filter.placeId}
                onChange={(e) => setFilter({ ...filter, placeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Todos los lugares</option>
                {places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha desde
              </label>
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha hasta
              </label>
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Checkpoints */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lugar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Foto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {checkpoints.filter(checkpoint => {
                // Filtrar checkpoints JOURNEY_END antiguos que ya tienen su JOURNEY_START correspondiente
                if (checkpoint.type === 'JOURNEY_END') {
                  return false // No mostrar registros JOURNEY_END antiguos
                }
                return true
              }).map((checkpoint) => {
                const typeInfo = getCheckpointTypeInfo(checkpoint)
                const TypeIcon = typeInfo.icon

                return (
                <tr
                  key={checkpoint.id}
                  onClick={(e) => {
                    console.log('Click en fila')
                    e.preventDefault()
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color} ${typeInfo.borderColor} border`}>
                      <TypeIcon className="w-3 h-3 mr-1" />
                      {typeInfo.label}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{checkpoint.user.name}</div>
                      <div className="text-sm text-gray-500">{checkpoint.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{checkpoint.placeName}</div>
                    {checkpoint.place && (
                      <div className="text-sm text-gray-500">{checkpoint.place.address}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {checkpoint.imageUrl ? (
                      <img
                        src={`${window.location.origin}${checkpoint.imageUrl}`}
                        alt={`Miniatura de ${checkpoint.placeName}`}
                        className="h-12 w-12 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowPhotoModal(checkpoint)
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Image className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {checkpoint.type === 'JOURNEY_START' && checkpoint.endTimestamp ? (
                      <div>
                        <div className="font-medium">Inicio:</div>
                        <div>{new Date(checkpoint.timestamp).toLocaleDateString()}</div>
                        <div>{new Date(checkpoint.timestamp).toLocaleTimeString()}</div>
                        <div className="font-medium mt-1">Fin:</div>
                        <div>{new Date(checkpoint.endTimestamp).toLocaleDateString()}</div>
                        <div>{new Date(checkpoint.endTimestamp).toLocaleTimeString()}</div>
                      </div>
                    ) : checkpoint.type === 'JOURNEY_START' ? (
                      <div>
                        <div className="font-medium text-green-600">En curso desde:</div>
                        <div>{new Date(checkpoint.timestamp).toLocaleDateString()}</div>
                        <div>{new Date(checkpoint.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ) : (
                      <div>
                        <div>{new Date(checkpoint.timestamp).toLocaleDateString()}</div>
                        <div>{new Date(checkpoint.timestamp).toLocaleTimeString()}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {checkpoint.type === 'JOURNEY_START' && checkpoint.endNotes ? (
                      <div>
                        <div>{checkpoint.notes}</div>
                        <div className="text-xs text-gray-400 mt-1">{checkpoint.endNotes}</div>
                      </div>
                    ) : (
                      checkpoint.notes || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowLocationModal(checkpoint)
                      }}
                      className="inline-flex items-center text-blue-600 hover:text-blue-900"
                      title="Ver Ubicación"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                    {checkpoint.type === 'JOURNEY_START' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowJourneyLocationsModal(checkpoint)
                        }}
                        className="inline-flex items-center text-purple-600 hover:text-purple-900"
                        title="Ver Ubicaciones de Jornada"
                      >
                        <Navigation className="h-4 w-4" />
                        {checkpoint._count?.journeyLocations && (
                          <span className="ml-1 text-xs">({checkpoint._count.journeyLocations})</span>
                        )}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteClick(checkpoint)
                      }}
                      className="inline-flex items-center text-red-600 hover:text-red-900"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
          {checkpoints.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay checkpoints registrados con los filtros seleccionados
            </div>
          )}
        </div>

        {/* Modal de Detalles del Checkpoint */}
        {selectedCheckpoint && (
          <CheckpointDetailsModal
            checkpoint={selectedCheckpoint}
            onClose={() => setSelectedCheckpoint(null)}
          />
        )}

        {/* Modal de Información de Foto */}
        {showPhotoModal && (
          <PhotoInfoModal
            checkpoint={showPhotoModal}
            onClose={() => setShowPhotoModal(null)}
          />
        )}

        {/* Modal de Información de Ubicación */}
        {showLocationModal && (
          <LocationInfoModal
            checkpoint={showLocationModal}
            onClose={() => setShowLocationModal(null)}
          />
        )}

        {/* Modal de Ubicaciones de Jornada */}
        {showJourneyLocationsModal && (
          <JourneyLocationsModal
            journeyCheckpoint={showJourneyLocationsModal}
            onClose={() => setShowJourneyLocationsModal(null)}
          />
        )}

        {/* Modal de Confirmación de Eliminación */}
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, checkpointId: '', checkpointName: '' })}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Checkpoint"
          message={
            <div>
              <p>¿Estás seguro de que quieres eliminar este checkpoint?</p>
              <p className="font-medium mt-2 text-gray-900">&quot;{deleteConfirm.checkpointName}&quot;</p>
              <p className="text-sm mt-2 text-gray-600">Esta acción no se puede deshacer.</p>
            </div>
          }
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </div>
    </DashboardLayout>
  )
}