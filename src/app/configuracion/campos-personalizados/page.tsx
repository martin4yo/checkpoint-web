'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Settings, Plus, Edit3, Trash2, X, GripVertical } from 'lucide-react'

interface CustomField {
  id: string
  fieldName: string
  fieldType: string
  defaultValue: string | null
  isRequired: boolean
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Texto corto' },
  { value: 'TEXTAREA', label: 'Texto largo' },
  { value: 'NUMBER', label: 'Número' },
  { value: 'DATE', label: 'Fecha' },
  { value: 'SELECT', label: 'Lista desplegable' },
  { value: 'CHECKBOX', label: 'Sí/No (Checkbox)' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Teléfono' },
]

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [formData, setFormData] = useState({
    fieldName: '',
    fieldType: 'TEXT',
    defaultValue: '',
    isRequired: false,
    order: 0
  })

  useEffect(() => {
    fetchFields()
  }, [])

  const fetchFields = async () => {
    try {
      const response = await fetch('/api/legajos/custom-fields')
      if (response.ok) {
        const data = await response.json()
        setFields(data.customFields || [])
      }
    } catch (error) {
      console.error('Error fetching custom fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingField(null)
    setFormData({
      fieldName: '',
      fieldType: 'TEXT',
      defaultValue: '',
      isRequired: false,
      order: fields.length
    })
    setShowModal(true)
  }

  const handleEdit = (field: CustomField) => {
    setEditingField(field)
    setFormData({
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      defaultValue: field.defaultValue || '',
      isRequired: field.isRequired,
      order: field.order
    })
    setShowModal(true)
  }

  const handleDelete = async (fieldId: string) => {
    if (!confirm('¿Está seguro de eliminar este campo? Se eliminarán todos los valores asociados.')) return

    try {
      const response = await fetch(`/api/legajos/custom-fields?id=${fieldId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchFields()
      } else {
        alert('Error al eliminar campo')
      }
    } catch (error) {
      console.error('Error deleting field:', error)
      alert('Error al eliminar campo')
    }
  }

  const handleSave = async () => {
    if (!formData.fieldName.trim()) {
      alert('El nombre del campo es requerido')
      return
    }

    try {
      const url = '/api/legajos/custom-fields'
      const method = editingField ? 'PUT' : 'POST'
      const body = editingField
        ? { id: editingField.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        fetchFields()
        setShowModal(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar campo')
      }
    } catch (error) {
      console.error('Error saving field:', error)
      alert('Error al guardar campo')
    }
  }

  const getFieldTypeLabel = (type: string) => {
    return FIELD_TYPES.find(t => t.value === type)?.label || type
  }

  if (loading) {
    return (
      <DashboardLayout title="Campos Personalizados" titleIcon={<Settings className="h-8 w-8 text-gray-600" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Campos Personalizados de Legajos" titleIcon={<Settings className="h-8 w-8 text-gray-600" />}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Define campos adicionales personalizados para los legajos de tu empresa
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-palette-yellow bg-secondary hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Campo
          </button>
        </div>

        {/* Lista de campos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {fields.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay campos personalizados. Crea uno para comenzar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre del Campo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Dato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor por Defecto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requerido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fields.map((field) => (
                    <tr key={field.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <GripVertical className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{field.order}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{field.fieldName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getFieldTypeLabel(field.fieldType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {field.defaultValue || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {field.isRequired ? (
                          <span className="text-red-600 font-medium">Sí</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {field.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(field)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(field.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de creación/edición */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
              <div
                className="fixed inset-0 backdrop-blur-sm bg-black/10 transition-all"
                onClick={() => setShowModal(false)}
              />

              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingField ? 'Editar Campo' : 'Nuevo Campo'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Campo *
                      </label>
                      <input
                        type="text"
                        value={formData.fieldName}
                        onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                        placeholder="Ej: Talla de Ropa"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Dato *
                      </label>
                      <select
                        value={formData.fieldType}
                        onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        {FIELD_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor por Defecto
                      </label>
                      <input
                        type="text"
                        value={formData.defaultValue}
                        onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                        placeholder="Opcional"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      {formData.fieldType === 'SELECT' && (
                        <p className="mt-1 text-xs text-gray-500">
                          Para SELECT, ingresa opciones separadas por coma. Ej: Pequeño,Mediano,Grande
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Orden de Visualización
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isRequired}
                        onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Campo obligatorio
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={handleSave}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-secondary text-base font-medium text-palette-yellow hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
