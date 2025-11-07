'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, Edit2, Trash2, Tag, DollarSign, Calendar, CalendarRange, Paperclip, Building2 } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { DynamicIcon, availableIcons, availableColors } from '@/lib/lucide-icons'

interface Tenant {
  id: string
  name: string
  slug: string
}

interface NoveltyType {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
  requiresAmount: boolean
  requiresDate: boolean
  requiresDateRange: boolean
  allowsAttachments: boolean
  isActive: boolean
  createdAt: string
  tenant: Tenant
  _count?: {
    novelties: number
  }
}

interface CurrentUser {
  id: string
  tenantId: string
  superuser: boolean
}

export default function NoveltyTypesPage() {
  const [noveltyTypes, setNoveltyTypes] = useState<NoveltyType[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [filterTenantId, setFilterTenantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState<NoveltyType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'FileText',
    requiresAmount: false,
    requiresDate: false,
    requiresDateRange: false,
    allowsAttachments: false,
    isActive: true
  })
  const { confirm, ConfirmDialog } = useConfirm()

  const fetchNoveltyTypes = useCallback(async () => {
    try {
      const url = filterTenantId
        ? `/api/novelty-types?tenantId=${filterTenantId}`
        : '/api/novelty-types'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setNoveltyTypes(data.noveltyTypes)
        setCurrentUser(data.currentUser)

        // Fetch tenants if user is superuser (only on first load)
        if (data.currentUser.superuser && tenants.length === 0) {
          fetchTenants()
        }
      }
    } catch (error) {
      console.error('Error fetching novelty types:', error)
    } finally {
      setLoading(false)
    }
  }, [filterTenantId, tenants.length])

  useEffect(() => {
    fetchNoveltyTypes()
  }, [fetchNoveltyTypes])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants')
      if (response.ok) {
        const data = await response.json()
        setTenants(data)
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingType ? '/api/novelty-types' : '/api/novelty-types'
      const method = editingType ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingType ? { ...formData, id: editingType.id } : formData),
      })

      if (response.ok) {
        await fetchNoveltyTypes()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar tipo de novedad')
      }
    } catch (error) {
      console.error('Error saving novelty type:', error)
      alert('Error al guardar tipo de novedad')
    }
  }

  const handleEdit = (type: NoveltyType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
      color: type.color,
      icon: type.icon,
      requiresAmount: type.requiresAmount,
      requiresDate: type.requiresDate,
      requiresDateRange: type.requiresDateRange,
      allowsAttachments: type.allowsAttachments,
      isActive: type.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Tipo de Novedad',
      message: `¿Estás seguro de que quieres eliminar el tipo "${name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    })

    if (confirmed) {
      try {
        const response = await fetch('/api/novelty-types', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })

        if (response.ok) {
          await fetchNoveltyTypes()
        } else {
          const error = await response.json()
          alert(error.error || 'Error al eliminar tipo de novedad')
        }
      } catch (error) {
        console.error('Error deleting novelty type:', error)
        alert('Error al eliminar tipo de novedad')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: 'FileText',
      requiresAmount: false,
      requiresDate: false,
      requiresDateRange: false,
      allowsAttachments: false,
      isActive: true
    })
    setEditingType(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <DashboardLayout title="Tipos de Novedades" titleIcon={<Tag className="h-8 w-8 text-gray-600" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Tipos de Novedades" titleIcon={<Tag className="h-8 w-8 text-gray-600" />}>
      <ConfirmDialog />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Lista de Tipos ({noveltyTypes.length})
          </h2>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="inline-flex items-center bg-secondary text-palette-yellow px-4 py-2 rounded-lg hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Tipo
          </button>
        </div>

        {/* Tenant Filter - Only for Superusers */}
        {currentUser?.superuser && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-gray-400" />
              <select
                value={filterTenantId}
                onChange={(e) => setFilterTenantId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
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
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingType ? 'Editar Tipo de Novedad' : 'Nuevo Tipo de Novedad'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="ej: Vacaciones, Días de estudio..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    rows={3}
                    placeholder="Descripción opcional del tipo de novedad..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icono
                    </label>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: formData.color }}
                      >
                        <DynamicIcon name={formData.icon} className="h-5 w-5 text-white" />
                      </div>
                      <select
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        {availableIcons.map((icon) => (
                          <option key={icon.name} value={icon.name}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {availableColors.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.hex })}
                          className={`w-8 h-8 rounded-md transition-all ${
                            formData.color === color.hex
                              ? 'ring-2 ring-offset-2 ring-black scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Configuración de Campos</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="requiresAmount"
                        checked={formData.requiresAmount}
                        onChange={(e) => setFormData({ ...formData, requiresAmount: e.target.checked })}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label htmlFor="requiresAmount" className="ml-3 flex items-center text-sm text-gray-700">
                        <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                        Requiere Importe
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="requiresDate"
                        checked={formData.requiresDate}
                        onChange={(e) => setFormData({ ...formData, requiresDate: e.target.checked })}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label htmlFor="requiresDate" className="ml-3 flex items-center text-sm text-gray-700">
                        <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                        Requiere Fecha Única
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="requiresDateRange"
                        checked={formData.requiresDateRange}
                        onChange={(e) => setFormData({ ...formData, requiresDateRange: e.target.checked })}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label htmlFor="requiresDateRange" className="ml-3 flex items-center text-sm text-gray-700">
                        <CalendarRange className="h-4 w-4 mr-1 text-purple-600" />
                        Requiere Rango de Fechas
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allowsAttachments"
                        checked={formData.allowsAttachments}
                        onChange={(e) => setFormData({ ...formData, allowsAttachments: e.target.checked })}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label htmlFor="allowsAttachments" className="ml-3 flex items-center text-sm text-gray-700">
                        <Paperclip className="h-4 w-4 mr-1 text-gray-600" />
                        Permite Archivos Adjuntos
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Activo
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-secondary text-palette-yellow px-4 py-2 rounded-md hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors"
                  >
                    {editingType ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Types Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                {currentUser?.superuser && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campos Configurados
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Novedades
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {noveltyTypes.map((type) => (
                <tr key={type.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: type.color }}
                      >
                        <DynamicIcon name={type.icon} className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{type.name}</div>
                        {type.description && (
                          <div className="text-xs text-gray-500">{type.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  {currentUser?.superuser && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{type.tenant.name}</div>
                      <div className="text-xs text-gray-500">{type.tenant.slug}</div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {type.requiresAmount && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Importe
                        </span>
                      )}
                      {type.requiresDate && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          <Calendar className="h-3 w-3 mr-1" />
                          Fecha
                        </span>
                      )}
                      {type.requiresDateRange && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          <CalendarRange className="h-3 w-3 mr-1" />
                          Rango
                        </span>
                      )}
                      {type.allowsAttachments && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          <Paperclip className="h-3 w-3 mr-1" />
                          Archivos
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{type._count?.novelties || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {type.isActive ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(type)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(type.id, type.name)}
                      className="text-red-600 hover:text-red-900 ml-2"
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {noveltyTypes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay tipos de novedades definidos
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
