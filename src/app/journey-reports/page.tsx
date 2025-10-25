'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import JourneyAdjustmentModal from '@/components/JourneyAdjustmentModal'
import JourneyLocationsViewer from '@/components/JourneyLocationsViewer'
import { Filter, X, Edit3, Clock, MapPin, User, Coffee, FileBarChart, Download, Navigation } from 'lucide-react'
import * as XLSX from 'xlsx'

interface JourneyReport {
  id: string
  placeName: string
  userName: string
  userEmail: string
  startDate: string
  startTime: string
  endDate?: string
  endTime?: string
  duration: string
  adjustments?: {
    id?: string
    manualStartTime?: string
    manualEndTime?: string
    lunchStartTime?: string
    lunchEndTime?: string
    notes?: string
  }
}

interface JourneyAdjustmentEdit {
  checkpointId: string
  manualStartTime: string
  manualEndTime: string
  lunchStartTime: string
  lunchEndTime: string
  notes: string
}

export default function JourneyReportsPage() {
  const [journeys, setJourneys] = useState<JourneyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJourney, setSelectedJourney] = useState<JourneyReport | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showJourneyLocations, setShowJourneyLocations] = useState<JourneyReport | null>(null)
  const [filter, setFilter] = useState({
    dateFrom: '',
    dateTo: '',
    userId: '',
    search: ''
  })
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])

  const fetchJourneys = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom)
      if (filter.dateTo) params.append('dateTo', filter.dateTo)
      if (filter.userId) params.append('userId', filter.userId)
      if (filter.search) params.append('search', filter.search)

      const response = await fetch(`/api/journey-reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setJourneys(data)
      }
    } catch (error) {
      console.error('Error fetching journey reports:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers((data.users || []).map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchJourneys()
  }, [fetchJourneys])

  const handleEdit = (journey: JourneyReport) => {
    setSelectedJourney(journey)
    setIsModalOpen(true)
  }

  const handleSave = async (editData: JourneyAdjustmentEdit) => {
    const response = await fetch('/api/journey-adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    })

    if (response.ok) {
      fetchJourneys()
    } else {
      throw new Error('Error saving adjustments')
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedJourney(null)
  }

  const getFinalStartTime = (journey: JourneyReport) => {
    if (journey.adjustments?.manualStartTime) {
      return new Date(journey.adjustments.manualStartTime).toLocaleString()
    }
    return `${journey.startDate === journey.endDate ? '' : `${journey.startDate} `}${journey.startTime}`
  }

  const getFinalEndTime = (journey: JourneyReport) => {
    if (journey.adjustments?.manualEndTime) {
      return new Date(journey.adjustments.manualEndTime).toLocaleString()
    }
    if (journey.endDate && journey.endTime) {
      return `${journey.startDate === journey.endDate ? '' : `${journey.endDate} `}${journey.endTime}`
    }
    return 'En curso'
  }

  const clearFilters = () => {
    setFilter({
      dateFrom: '',
      dateTo: '',
      userId: '',
      search: ''
    })
  }

  const exportToExcel = () => {
    const exportData = journeys.map((journey) => ({
      'Usuario': journey.userName,
      'Email': journey.userEmail,
      'Lugar': journey.placeName,
      'Fecha Inicio': journey.startDate,
      'Hora Inicio Original': journey.startTime,
      'Fecha Fin': journey.endDate || 'En curso',
      'Hora Fin Original': journey.endTime || 'En curso',
      'Hora Inicio Final': journey.adjustments?.manualStartTime ?
        new Date(journey.adjustments.manualStartTime).toLocaleString() :
        `${journey.startDate === journey.endDate ? '' : `${journey.startDate} `}${journey.startTime}`,
      'Hora Fin Final': journey.adjustments?.manualEndTime ?
        new Date(journey.adjustments.manualEndTime).toLocaleString() :
        (journey.endDate && journey.endTime ?
          `${journey.startDate === journey.endDate ? '' : `${journey.endDate} `}${journey.endTime}` :
          'En curso'),
      'Almuerzo Inicio': journey.adjustments?.lunchStartTime || '-',
      'Almuerzo Fin': journey.adjustments?.lunchEndTime || '-',
      'Duración': journey.duration,
      'Notas': journey.adjustments?.notes || '-',
      'Tiene Ajustes': (journey.adjustments?.manualStartTime || journey.adjustments?.manualEndTime ||
                        journey.adjustments?.lunchStartTime || journey.adjustments?.notes) ? 'Sí' : 'No'
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 20 }, // Usuario
      { wch: 25 }, // Email
      { wch: 20 }, // Lugar
      { wch: 12 }, // Fecha Inicio
      { wch: 15 }, // Hora Inicio Original
      { wch: 12 }, // Fecha Fin
      { wch: 15 }, // Hora Fin Original
      { wch: 20 }, // Hora Inicio Final
      { wch: 20 }, // Hora Fin Final
      { wch: 12 }, // Almuerzo Inicio
      { wch: 12 }, // Almuerzo Fin
      { wch: 10 }, // Duración
      { wch: 30 }, // Notas
      { wch: 12 }  // Tiene Ajustes
    ]
    worksheet['!cols'] = columnWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte de Jornadas')

    // Generar nombre del archivo con fecha
    const today = new Date().toISOString().split('T')[0]
    const filename = `reporte_jornadas_${today}.xlsx`

    XLSX.writeFile(workbook, filename)
  }


  if (loading) {
    return (
      <DashboardLayout title="Reporte de Jornadas" titleIcon={<FileBarChart className="h-8 w-8 text-gray-600" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Reporte de Jornadas" titleIcon={<FileBarChart className="h-8 w-8 text-gray-600" />}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Resumen de Jornadas ({journeys.length})
          </h2>
          <button
            onClick={exportToExcel}
            disabled={journeys.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar a Excel
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Filter className="mr-2 h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Jornadas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
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
                    Inicio Original
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fin Original
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inicio Final
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fin Final
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Almuerzo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
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
                {journeys.map((journey) => (
                  <tr key={journey.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="font-medium text-gray-900">{journey.userName}</div>
                          <div className="text-sm text-gray-500">{journey.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{journey.placeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {journey.startDate === journey.endDate ? '' : `${journey.startDate} `}{journey.startTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {journey.endDate && journey.endTime ? (
                        `${journey.startDate === journey.endDate ? '' : `${journey.endDate} `}${journey.endTime}`
                      ) : (
                        <span className="text-green-600 font-medium">En curso</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={journey.adjustments?.manualStartTime ? 'text-blue-600 font-medium' : 'text-gray-900'}>
                        {getFinalStartTime(journey)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={journey.adjustments?.manualEndTime ? 'text-blue-600 font-medium' : 'text-gray-900'}>
                        {getFinalEndTime(journey)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {journey.adjustments?.lunchStartTime && journey.adjustments?.lunchEndTime ? (
                        <div className="flex items-center">
                          <Coffee className="h-4 w-4 text-gray-400 mr-1" />
                          <span>{journey.adjustments.lunchStartTime} - {journey.adjustments.lunchEndTime}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">{journey.duration}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs">
                      {journey.adjustments?.notes ? (
                        <div className="truncate" title={journey.adjustments.notes}>
                          {journey.adjustments.notes}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowJourneyLocations(journey)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Ver ubicaciones de jornada"
                        >
                          <Navigation className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(journey)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar ajustes"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {journeys.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay jornadas registradas con los filtros seleccionados
            </div>
          )}
        </div>

        {/* Modal de ajustes */}
        <JourneyAdjustmentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          journey={selectedJourney}
        />

        {/* Modal de Ubicaciones de Jornada */}
        {showJourneyLocations && (
          <JourneyLocationsViewer
            journeyId={showJourneyLocations.id}
            journeyName={showJourneyLocations.placeName}
            userName={showJourneyLocations.userName}
            startTime={`${showJourneyLocations.startDate} ${showJourneyLocations.startTime}`}
            endTime={showJourneyLocations.endDate && showJourneyLocations.endTime ?
              `${showJourneyLocations.endDate} ${showJourneyLocations.endTime}` : null}
            onClose={() => setShowJourneyLocations(null)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}