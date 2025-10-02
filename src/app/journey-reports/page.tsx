'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Filter, X, Edit3, Save, Clock, MapPin, User } from 'lucide-react'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<JourneyAdjustmentEdit | null>(null)
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
        setUsers(data.map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })))
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
    setEditingId(journey.id)
    setEditData({
      checkpointId: journey.id,
      manualStartTime: journey.adjustments?.manualStartTime || '',
      manualEndTime: journey.adjustments?.manualEndTime || '',
      lunchStartTime: journey.adjustments?.lunchStartTime || '',
      lunchEndTime: journey.adjustments?.lunchEndTime || '',
      notes: journey.adjustments?.notes || ''
    })
  }

  const handleSave = async () => {
    if (!editData) return

    try {
      const response = await fetch('/api/journey-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        setEditingId(null)
        setEditData(null)
        fetchJourneys() // Recargar datos
      }
    } catch (error) {
      console.error('Error saving adjustments:', error)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData(null)
  }

  const clearFilters = () => {
    setFilter({
      dateFrom: '',
      dateTo: '',
      userId: '',
      search: ''
    })
  }


  if (loading) {
    return (
      <DashboardLayout title="Reporte de Jornadas">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Reporte de Jornadas">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Resumen de Jornadas ({journeys.length})
          </h2>
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
                    Inicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ajustes
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
                      {editingId === journey.id ? (
                        <div className="space-y-1">
                          <input
                            type="datetime-local"
                            value={editData?.manualStartTime || ''}
                            onChange={(e) => setEditData(prev => prev ? { ...prev, manualStartTime: e.target.value } : null)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            placeholder="Inicio manual"
                          />
                          <div className="text-xs text-gray-500">
                            Original: {journey.startDate === journey.endDate ? '' : `${journey.startDate} `}{journey.startTime}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>{journey.startDate === journey.endDate ? '' : `${journey.startDate} `}{journey.startTime}</div>
                          {journey.adjustments?.manualStartTime && (
                            <div className="text-xs text-blue-600">
                              Ajustado: {new Date(journey.adjustments.manualStartTime).toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === journey.id ? (
                        <div className="space-y-1">
                          <input
                            type="datetime-local"
                            value={editData?.manualEndTime || ''}
                            onChange={(e) => setEditData(prev => prev ? { ...prev, manualEndTime: e.target.value } : null)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            placeholder="Fin manual"
                          />
                          <div className="text-xs text-gray-500">
                            Original: {journey.endDate && journey.endTime ?
                              `${journey.startDate === journey.endDate ? '' : `${journey.endDate} `}${journey.endTime}` :
                              'En curso'
                            }
                          </div>
                        </div>
                      ) : (
                        <div>
                          {journey.endDate && journey.endTime ? (
                            <div>
                              <div>{journey.startDate === journey.endDate ? '' : `${journey.endDate} `}{journey.endTime}</div>
                              {journey.adjustments?.manualEndTime && (
                                <div className="text-xs text-blue-600">
                                  Ajustado: {new Date(journey.adjustments.manualEndTime).toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-green-600 font-medium">En curso</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">{journey.duration}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editingId === journey.id ? (
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-600">Almuerzo inicio:</label>
                            <input
                              type="time"
                              value={editData?.lunchStartTime || ''}
                              onChange={(e) => setEditData(prev => prev ? { ...prev, lunchStartTime: e.target.value } : null)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Almuerzo fin:</label>
                            <input
                              type="time"
                              value={editData?.lunchEndTime || ''}
                              onChange={(e) => setEditData(prev => prev ? { ...prev, lunchEndTime: e.target.value } : null)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Notas:</label>
                            <input
                              type="text"
                              value={editData?.notes || ''}
                              onChange={(e) => setEditData(prev => prev ? { ...prev, notes: e.target.value } : null)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              placeholder="Notas del ajuste"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">
                          {journey.adjustments?.lunchStartTime && journey.adjustments?.lunchEndTime && (
                            <div>Almuerzo: {journey.adjustments.lunchStartTime} - {journey.adjustments.lunchEndTime}</div>
                          )}
                          {journey.adjustments?.notes && (
                            <div className="text-gray-500">{journey.adjustments.notes}</div>
                          )}
                          {!journey.adjustments?.lunchStartTime && !journey.adjustments?.notes && (
                            <span className="text-gray-400">Sin ajustes</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === journey.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSave}
                            className="text-green-600 hover:text-green-900"
                            title="Guardar"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(journey)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar ajustes"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
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
      </div>
    </DashboardLayout>
  )
}