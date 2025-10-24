'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { FileText, User, Users, Edit2 } from 'lucide-react'

interface Legajo {
  id: string
  numeroLegajo: string
  datosPersonales?: {
    dni?: string
    cuil?: string
  }
  datosLaborales?: {
    puesto?: string
    area?: string
    fechaIngreso?: string
  }
}

interface User {
  id: string
  name: string
  email: string
  isActive: boolean
  legajo?: Legajo | null
}

export default function LegajosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedLegajo, setSelectedLegajo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('personal')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/legajos')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (user: User) => {
    setSelectedUser(user)

    // Si el usuario tiene legajo, traer todos sus datos
    if (user.legajo) {
      try {
        const response = await fetch(`/api/legajos?legajoId=${user.legajo.id}`)
        if (response.ok) {
          const fullLegajo = await response.json()
          setSelectedLegajo(fullLegajo)
        }
      } catch (error) {
        console.error('Error fetching legajo details:', error)
      }
    } else {
      // Si no tiene legajo, inicializar vacío
      setSelectedLegajo(null)
    }

    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedUser(null)
    setSelectedLegajo(null)
    setActiveTab('personal')
  }

  if (loading) {
    return (
      <DashboardLayout title="Legajos" titleIcon={<FileText className="h-8 w-8 text-gray-600" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Legajos" titleIcon={<FileText className="h-8 w-8 text-gray-600" />}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            <Users className="inline h-5 w-5 mr-2" />
            Legajos de Empleados ({users.length})
          </h2>
        </div>

        {/* Grilla de Usuarios/Legajos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Legajo N°
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DNI / CUIL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puesto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Ingreso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.legajo?.numeroLegajo || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-8 w-8 rounded-full bg-gray-200 p-2 text-gray-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.legajo?.datosPersonales?.dni || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.legajo?.datosPersonales?.cuil || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.legajo?.datosLaborales?.puesto || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.legajo?.datosLaborales?.area || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.legajo?.datosLaborales?.fechaIngreso
                      ? new Date(user.legajo.datosLaborales.fechaIngreso).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-success/10 text-success'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-secondary hover:text-secondary-hover"
                      title={user.legajo ? 'Editar Legajo' : 'Crear Legajo'}
                    >
                      <Edit2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay usuarios registrados
            </div>
          )}
        </div>

        {/* Modal de Edición/Creación */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg border-2 border-gray-300 p-6 w-full max-w-5xl my-8 mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {selectedLegajo
                    ? `Legajo N° ${selectedLegajo.numeroLegajo} - ${selectedUser.name}`
                    : `Crear Legajo - ${selectedUser.name}`
                  }
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-4 overflow-x-auto">
                  {[
                    { id: 'personal', label: '📋 Datos Personales', icon: '📋' },
                    { id: 'familiares', label: '👨‍👩‍👧‍👦 Datos Familiares', icon: '👨‍👩‍👧‍👦' },
                    { id: 'laborales', label: '💼 Datos Laborales', icon: '💼' },
                    { id: 'remuneracion', label: '💰 Remuneración', icon: '💰' },
                    { id: 'formacion', label: '🎓 Formación', icon: '🎓' },
                    { id: 'documentos', label: '📄 Documentos', icon: '📄' },
                    { id: 'administrativos', label: '⚙️ Administrativos', icon: '⚙️' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap
                        ${activeTab === tab.id
                          ? 'border-secondary text-secondary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Contenido de las Tabs */}
              <div className="mt-4">
                {activeTab === 'personal' && (
                  <div className="space-y-4">
                    <p className="text-gray-500">Formulario de datos personales (en desarrollo)</p>
                  </div>
                )}
                {activeTab === 'familiares' && (
                  <div className="space-y-4">
                    <p className="text-gray-500">Formulario de datos familiares (en desarrollo)</p>
                  </div>
                )}
                {activeTab === 'laborales' && (
                  <div className="space-y-4">
                    <p className="text-gray-500">Formulario de datos laborales (en desarrollo)</p>
                  </div>
                )}
                {activeTab === 'remuneracion' && (
                  <div className="space-y-4">
                    <p className="text-gray-500">Formulario de remuneración (en desarrollo)</p>
                  </div>
                )}
                {activeTab === 'formacion' && (
                  <div className="space-y-4">
                    <p className="text-gray-500">Formulario de formación (en desarrollo)</p>
                  </div>
                )}
                {activeTab === 'documentos' && (
                  <div className="space-y-4">
                    <p className="text-gray-500">Gestión de documentos (en desarrollo)</p>
                  </div>
                )}
                {activeTab === 'administrativos' && (
                  <div className="space-y-4">
                    <p className="text-gray-500">Datos administrativos (en desarrollo)</p>
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cerrar
                </button>
                <button
                  className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-hover"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
