'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Search, Filter, X, ExternalLink, Trash2, Eye, Image, MapPin, Calendar, User, FileText, Camera } from 'lucide-react'

interface Checkpoint {
  id: string
  placeName: string
  latitude: number
  longitude: number
  timestamp: string
  notes?: string
  imageUrl?: string
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
}

interface CheckpointDetailsModalProps {
  checkpoint: Checkpoint
  onClose: () => void
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
                      src={checkpoint.imageUrl}
                      alt="Checkpoint"
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
              src={checkpoint.imageUrl}
              alt="Checkpoint"
              className="max-h-[90vh] max-w-full object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <a
                href={checkpoint.imageUrl}
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
                src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${checkpoint.longitude}!3d${checkpoint.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1ses!2sar!4v1234567890123`}
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

  const formatFileSize = (url: string) => {
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
                  src={checkpoint.imageUrl}
                  alt="Checkpoint"
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
                  {checkpoint.imageUrl ? formatFileSize(checkpoint.imageUrl) : 'N/A'}
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
                href={checkpoint.imageUrl}
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
        <div className="pointer-events-auto bg-white rounded-2xl shadow-xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
              <div className="w-full h-[512px] bg-gray-200 rounded-lg overflow-hidden">
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

              <div className="bg-gray-50 rounded-lg p-4">
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

              <div className="bg-gray-50 rounded-lg p-4">
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

  // Debug logging
  console.log('Current selectedCheckpoint:', selectedCheckpoint)

  useEffect(() => {
    fetchCheckpoints()
    fetchUsers()
    fetchPlaces()
  }, [])

  useEffect(() => {
    fetchCheckpoints()
  }, [filter])

  const fetchCheckpoints = async () => {
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
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.map((u: any) => ({ id: u.id, name: u.name })))
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
        setPlaces(data.map((p: any) => ({ id: p.id, name: p.name })))
      }
    } catch (error) {
      console.error('Error fetching places:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este checkpoint?')) {
      try {
        const response = await fetch('/api/checkpoints', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })

        if (response.ok) {
          fetchCheckpoints()
          alert('Checkpoint eliminado exitosamente')
        } else {
          const errorData = await response.json()
          alert(`Error al eliminar: ${errorData.error || 'Error desconocido'}`)
        }
      } catch (error) {
        console.error('Error deleting checkpoint:', error)
        alert('Error de conexión al eliminar el checkpoint')
      }
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
      <DashboardLayout title="Gestión de Checkpoints">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Gestión de Checkpoints">
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
              {checkpoints.map((checkpoint) => (
                <tr
                  key={checkpoint.id}
                  onClick={(e) => {
                    console.log('Click en fila')
                    e.preventDefault()
                  }}
                >
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
                        src={checkpoint.imageUrl}
                        alt="Checkpoint"
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
                    <div>{new Date(checkpoint.timestamp).toLocaleDateString()}</div>
                    <div>{new Date(checkpoint.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {checkpoint.notes || '-'}
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
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(checkpoint.id)
                      }}
                      className="inline-flex items-center text-red-600 hover:text-red-900"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
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
      </div>
    </DashboardLayout>
  )
}