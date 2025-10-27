'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Shield, CheckCircle, XCircle, Clock, Trash2, Search, Filter } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'

interface BiometricData {
  id: string
  userId: string
  tenantId: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    isActive: boolean
  }
  tenant: {
    id: string
    name: string
    slug: string
  }
  methods: {
    face: boolean
    fingerprint: boolean
    pin: boolean
    qr: boolean
  }
  consentSigned: boolean
  consentDate: string | null
  enrolledAt: string
  lastUsedAt: string | null
  isActive: boolean
}

export default function BiometricPage() {
  const [biometricData, setBiometricData] = useState<BiometricData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTenant, setFilterTenant] = useState('')
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    fetchBiometricData()
  }, [])

  const fetchBiometricData = async () => {
    try {
      const response = await fetch('/api/biometric-data')
      if (response.ok) {
        const data = await response.json()
        setBiometricData(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching biometric data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    const confirmed = await confirm({
      title: 'Eliminar datos biométricos',
      message: `¿Estás seguro de eliminar todos los datos biométricos de ${userName}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    })

    if (confirmed) {
      try {
        const response = await fetch(`/api/biometric-data?userId=${userId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchBiometricData()
          alert('Datos biométricos eliminados correctamente')
        } else {
          alert('Error al eliminar datos biométricos')
        }
      } catch (error) {
        console.error('Error deleting biometric data:', error)
        alert('Error al eliminar datos biométricos')
      }
    }
  }

  const filteredData = biometricData.filter((data) => {
    const matchesSearch =
      data.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTenant = filterTenant === '' || data.tenantId === filterTenant

    return matchesSearch && matchesTenant
  })

  const tenants = Array.from(new Set(biometricData.map(d => d.tenant.name))).map(name => {
    const tenant = biometricData.find(d => d.tenant.name === name)?.tenant
    return tenant!
  })

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMethodCount = (methods: BiometricData['methods']) => {
    return Object.values(methods).filter(Boolean).length
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="text-purple-600" size={32} />
              Datos Biométricos
            </h1>
            <p className="text-gray-600 mt-1">
              Administra los registros biométricos de los usuarios
            </p>
          </div>
          <div className="bg-purple-50 px-4 py-2 rounded-lg">
            <div className="text-sm text-purple-600 font-semibold">
              {filteredData.length} {filteredData.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search size={16} className="inline mr-2" />
                Buscar usuario
              </label>
              <input
                type="text"
                placeholder="Nombre, apellido o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter size={16} className="inline mr-2" />
                Filtrar por tenant
              </label>
              <select
                value={filterTenant}
                onChange={(e) => setFilterTenant(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todos los tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-2 text-gray-600">Cargando datos...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Shield className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay datos biométricos registrados
            </h3>
            <p className="text-gray-600">
              Los usuarios deben registrar sus datos desde la app móvil
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Métodos
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consentimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último uso
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((data) => (
                    <tr key={data.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {data.user.firstName} {data.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{data.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{data.tenant.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex gap-1">
                            {data.methods.face && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800" title="Rostro">
                                👤
                              </span>
                            )}
                            {data.methods.fingerprint && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800" title="Huella">
                                👆
                              </span>
                            )}
                            {data.methods.pin && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800" title="PIN">
                                🔢
                              </span>
                            )}
                            {data.methods.qr && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800" title="QR">
                                📱
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            ({getMethodCount(data.methods)})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {data.consentSigned ? (
                          <CheckCircle className="inline text-green-500" size={20} />
                        ) : (
                          <XCircle className="inline text-red-500" size={20} />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock size={14} className="mr-1 text-gray-400" />
                          {formatDate(data.enrolledAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(data.lastUsedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {data.isActive && data.user.isActive ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDelete(data.userId, `${data.user.firstName} ${data.user.lastName}`)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Eliminar datos biométricos"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog />
    </DashboardLayout>
  )
}
