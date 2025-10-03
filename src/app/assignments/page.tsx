'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, Trash2, Users, Link as LinkIcon } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'

interface Assignment {
  id: string
  userId: string
  placeId: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  place: {
    id: string
    name: string
    address: string
  }
}

interface User {
  id: string
  name: string
  email: string
}

interface Place {
  id: string
  name: string
  address: string
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    userId: '',
    placeId: '',
  })
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; assignmentId: string; userName: string; placeName: string }>({
    isOpen: false,
    assignmentId: '',
    userName: '',
    placeName: ''
  })

  useEffect(() => {
    fetchAssignments()
    fetchUsers()
    fetchPlaces()
  }, [])

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/assignments')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.filter((u: { isActive: boolean }) => u.isActive))
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
        setPlaces(data.filter((p: { isActive: boolean }) => p.isActive))
      }
    } catch (error) {
      console.error('Error fetching places:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.userId || !formData.placeId) {
      alert('Por favor selecciona un usuario y un lugar')
      return
    }

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchAssignments()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al crear asignación')
      }
    } catch (error) {
      console.error('Error saving assignment:', error)
      alert('Error al crear asignación')
    }
  }

  const handleDeleteClick = (assignment: Assignment) => {
    setDeleteConfirm({
      isOpen: true,
      assignmentId: assignment.id,
      userName: assignment.user.name,
      placeName: assignment.place.name
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteConfirm.assignmentId }),
      })

      if (response.ok) {
        fetchAssignments()
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
    }
  }

  const resetForm = () => {
    setFormData({ userId: '', placeId: '' })
    setShowForm(false)
  }


  const getAvailablePlaces = () => {
    if (!formData.userId) return places

    const userAssignments = assignments.filter(a => a.userId === formData.userId)
    const assignedPlaceIds = userAssignments.map(a => a.placeId)
    return places.filter(place => !assignedPlaceIds.includes(place.id))
  }

  if (loading) {
    return (
      <DashboardLayout title="Asignaciones Usuario-Lugar" titleIcon={<LinkIcon className="h-8 w-8 text-gray-600" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Asignaciones Usuario-Lugar" titleIcon={<LinkIcon className="h-8 w-8 text-gray-600" />}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Lista de Asignaciones ({assignments.length})
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Asignación
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Nueva Asignación
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value, placeId: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar usuario...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lugar
                  </label>
                  <select
                    value={formData.placeId}
                    onChange={(e) => setFormData({ ...formData, placeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                    disabled={!formData.userId}
                  >
                    <option value="">Seleccionar lugar...</option>
                    {getAvailablePlaces().map((place) => (
                      <option key={place.id} value={place.id}>
                        {place.name} - {place.address}
                      </option>
                    ))}
                  </select>
                  {!formData.userId && (
                    <p className="text-sm text-gray-500 mt-1">
                      Primero selecciona un usuario
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Crear Asignación
                </button>
              </div>
            </form>
          </div>
        )}

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
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Asignación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{assignment.user.name}</div>
                      <div className="text-sm text-gray-500">{assignment.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{assignment.place.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {assignment.place.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(assignment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDeleteClick(assignment)}
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
          {assignments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay asignaciones registradas
            </div>
          )}
        </div>

        {/* Resumen por usuario */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Users className="mr-2 h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">
              Resumen por Usuario
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => {
              const userAssignments = assignments.filter(a => a.userId === user.id)
              return (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">{userAssignments.length}</span> lugares asignados
                  </div>
                  {userAssignments.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">Lugares:</div>
                      <ul className="text-xs text-gray-600 mt-1">
                        {userAssignments.map(a => (
                          <li key={a.id}>• {a.place.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Modal de Confirmación de Eliminación */}
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, assignmentId: '', userName: '', placeName: '' })}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Asignación"
          message={
            <div>
              <p>¿Estás seguro de que quieres eliminar esta asignación?</p>
              <p className="font-medium mt-2 text-gray-900">
                {deleteConfirm.userName} → {deleteConfirm.placeName}
              </p>
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