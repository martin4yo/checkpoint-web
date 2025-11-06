'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { FileBarChart, Plus, Edit3, Trash2, Star, X, UserCircle, Briefcase, DollarSign, Settings, Users, GraduationCap, FileArchive } from 'lucide-react'

interface ExportProfile {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  selectedFields: Record<string, unknown>
  includeJourneyData: boolean
  journeyDateRange: string | null
  createdAt: string
  updatedAt: string
}

interface SelectedFields {
  datosPersonales?: string[]
  datosFamiliares?: string[]
  datosLaborales?: string[]
  datosRemuneracion?: string[]
  datosAdministrativos?: string[]
  formacion?: boolean
  capacitaciones?: boolean
  documentos?: boolean
}

// Definición de campos disponibles por sección
const AVAILABLE_FIELDS = {
  datosPersonales: [
    { key: 'numeroLegajo', label: 'Número de Legajo' },
    { key: 'firstName', label: 'Nombre' },
    { key: 'lastName', label: 'Apellido' },
    { key: 'dni', label: 'DNI' },
    { key: 'cuil', label: 'CUIL' },
    { key: 'fechaNacimiento', label: 'Fecha de Nacimiento' },
    { key: 'genero', label: 'Género' },
    { key: 'estadoCivil', label: 'Estado Civil' },
    { key: 'nacionalidad', label: 'Nacionalidad' },
    { key: 'domicilioCalle', label: 'Calle' },
    { key: 'domicilioNumero', label: 'Número' },
    { key: 'domicilioLocalidad', label: 'Localidad' },
    { key: 'domicilioProvincia', label: 'Provincia' },
    { key: 'telefonoCelular', label: 'Teléfono Celular' },
    { key: 'emailPersonal', label: 'Email Personal' },
  ],
  datosLaborales: [
    { key: 'fechaIngreso', label: 'Fecha de Ingreso' },
    { key: 'fechaEgreso', label: 'Fecha de Egreso' },
    { key: 'tipoContrato', label: 'Tipo de Contrato' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'puesto', label: 'Puesto' },
    { key: 'area', label: 'Área' },
    { key: 'ubicacion', label: 'Ubicación/Sucursal' },
    { key: 'modalidadTrabajo', label: 'Modalidad de Trabajo' },
    { key: 'obraSocial', label: 'Obra Social' },
    { key: 'sindicato', label: 'Sindicato' },
  ],
  datosRemuneracion: [
    { key: 'salarioBasico', label: 'Salario Básico' },
    { key: 'tipoLiquidacion', label: 'Tipo de Liquidación' },
    { key: 'banco', label: 'Banco' },
    { key: 'cbu', label: 'CBU' },
  ],
  datosAdministrativos: [
    { key: 'estadoEmpleado', label: 'Estado del Empleado' },
    { key: 'diasVacacionesAnuales', label: 'Días de Vacaciones Anuales' },
    { key: 'diasVacacionesDisponibles', label: 'Días de Vacaciones Disponibles' },
  ],
  datosFamiliares: [
    { key: 'grupoFamiliarACargo', label: 'Grupo Familiar a Cargo' },
  ]
}

export default function ExportProfilesPage() {
  const [profiles, setProfiles] = useState<ExportProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ExportProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    selectedFields: {} as SelectedFields
  })

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/legajos/export-profiles')
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles || [])
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingProfile(null)
    setFormData({
      name: '',
      description: '',
      isDefault: false,
      selectedFields: {}
    })
    setShowModal(true)
  }

  const handleEdit = (profile: ExportProfile) => {
    setEditingProfile(profile)
    setFormData({
      name: profile.name,
      description: profile.description || '',
      isDefault: profile.isDefault,
      selectedFields: profile.selectedFields
    })
    setShowModal(true)
  }

  const handleDelete = async (profileId: string) => {
    if (!confirm('¿Está seguro de eliminar este perfil?')) return

    try {
      const response = await fetch(`/api/legajos/export-profiles?id=${profileId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchProfiles()
      } else {
        alert('Error al eliminar perfil')
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Error al eliminar perfil')
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('El nombre es requerido')
      return
    }

    try {
      const url = '/api/legajos/export-profiles'
      const method = editingProfile ? 'PUT' : 'POST'
      const body = editingProfile
        ? { id: editingProfile.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        fetchProfiles()
        setShowModal(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar perfil')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error al guardar perfil')
    }
  }

  const toggleField = (section: keyof SelectedFields, field: string) => {
    setFormData(prev => {
      const selectedFields = { ...prev.selectedFields }
      if (!selectedFields[section] || !Array.isArray(selectedFields[section])) {
        selectedFields[section] = [] as unknown as string[] & boolean
      }
      const fields = selectedFields[section] as string[]
      const index = fields.indexOf(field)

      if (index > -1) {
        selectedFields[section] = fields.filter(f => f !== field) as unknown as string[] & boolean
      } else {
        selectedFields[section] = [...fields, field] as unknown as string[] & boolean
      }

      return { ...prev, selectedFields }
    })
  }

  const isFieldSelected = (section: keyof SelectedFields, field: string) => {
    const sectionFields = formData.selectedFields[section]
    return Array.isArray(sectionFields) && sectionFields.includes(field)
  }

  if (loading) {
    return (
      <DashboardLayout title="Perfiles de Exportación" titleIcon={<FileBarChart className="h-8 w-8 text-gray-600" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Perfiles de Exportación" titleIcon={<FileBarChart className="h-8 w-8 text-gray-600" />}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Gestiona plantillas de exportación para reportes de jornadas con datos de legajo
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-palette-yellow bg-secondary hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Perfil
          </button>
        </div>

        {/* Lista de perfiles */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {profiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay perfiles de exportación. Crea uno para comenzar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Predeterminado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profiles.map((profile) => {
                    const totalFields = Object.values(profile.selectedFields || {})
                      .reduce((sum, fields) => (sum as number) + (Array.isArray(fields) ? fields.length : 0), 0)

                    return (
                      <tr key={profile.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{profile.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {profile.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {totalFields} campos
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {profile.isDefault && (
                            <Star className="h-5 w-5 text-yellow-500 fill-current" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(profile)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(profile.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de creación/edición */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 backdrop-blur-sm bg-black/10 transition-all"
              onClick={() => setShowModal(false)}
            />

            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col z-50">
              {/* Header - Fixed */}
              <div className="bg-white px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingProfile ? 'Editar Perfil' : 'Nuevo Perfil'}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="overflow-y-auto flex-1 px-6 py-4">
                <div className="space-y-4">
                    {/* Nombre y descripción */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Liquidación Mensual"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descripción opcional del perfil"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Marcar como predeterminado
                      </label>
                    </div>

                    {/* Grilla de selección de campos */}
                    <div className="border-t pt-4 mt-4 pb-4">
                      <h4 className="font-medium text-gray-900 mb-4">Campos a Exportar</h4>

                      {/* Grilla con columnas por sección - Primera fila */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 auto-rows-max">
                        {/* Columna: Datos Personales */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                            <UserCircle className="h-5 w-5 text-gray-600 mr-2" />
                            <h5 className="font-medium text-gray-900 text-sm">Datos Personales</h5>
                          </div>
                          <div className="space-y-2">
                            {AVAILABLE_FIELDS.datosPersonales.map(field => (
                              <label key={field.key} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={isFieldSelected('datosPersonales', field.key)}
                                  onChange={() => toggleField('datosPersonales', field.key)}
                                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{field.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Columna: Datos Laborales */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                            <Briefcase className="h-5 w-5 text-gray-600 mr-2" />
                            <h5 className="font-medium text-gray-900 text-sm">Datos Laborales</h5>
                          </div>
                          <div className="space-y-2">
                            {AVAILABLE_FIELDS.datosLaborales.map(field => (
                              <label key={field.key} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={isFieldSelected('datosLaborales', field.key)}
                                  onChange={() => toggleField('datosLaborales', field.key)}
                                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{field.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Columna: Remuneración */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                            <DollarSign className="h-5 w-5 text-gray-600 mr-2" />
                            <h5 className="font-medium text-gray-900 text-sm">Remuneración</h5>
                          </div>
                          <div className="space-y-2">
                            {AVAILABLE_FIELDS.datosRemuneracion.map(field => (
                              <label key={field.key} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={isFieldSelected('datosRemuneracion', field.key)}
                                  onChange={() => toggleField('datosRemuneracion', field.key)}
                                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{field.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Columna: Administrativos */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                            <Settings className="h-5 w-5 text-gray-600 mr-2" />
                            <h5 className="font-medium text-gray-900 text-sm">Administrativos</h5>
                          </div>
                          <div className="space-y-2">
                            {AVAILABLE_FIELDS.datosAdministrativos.map(field => (
                              <label key={field.key} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={isFieldSelected('datosAdministrativos', field.key)}
                                  onChange={() => toggleField('datosAdministrativos', field.key)}
                                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{field.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Grilla con columnas por sección - Segunda fila */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max">
                        {/* Columna: Datos Familiares */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                            <Users className="h-5 w-5 text-gray-600 mr-2" />
                            <h5 className="font-medium text-gray-900 text-sm">Datos Familiares</h5>
                          </div>
                          <div className="space-y-2">
                            {AVAILABLE_FIELDS.datosFamiliares.map(field => (
                              <label key={field.key} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={isFieldSelected('datosFamiliares', field.key)}
                                  onChange={() => toggleField('datosFamiliares', field.key)}
                                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{field.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Columna: Formación */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                            <GraduationCap className="h-5 w-5 text-gray-600 mr-2" />
                            <h5 className="font-medium text-gray-900 text-sm">Formación</h5>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={formData.selectedFields.formacion || false}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  selectedFields: {
                                    ...formData.selectedFields,
                                    formacion: e.target.checked
                                  }
                                })}
                                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">Incluir Formación</span>
                            </label>
                          </div>
                        </div>

                        {/* Columna: Capacitaciones */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                            <GraduationCap className="h-5 w-5 text-gray-600 mr-2" />
                            <h5 className="font-medium text-gray-900 text-sm">Capacitaciones</h5>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={formData.selectedFields.capacitaciones || false}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  selectedFields: {
                                    ...formData.selectedFields,
                                    capacitaciones: e.target.checked
                                  }
                                })}
                                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">Incluir Capacitaciones</span>
                            </label>
                          </div>
                        </div>

                        {/* Columna: Documentos */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                            <FileArchive className="h-5 w-5 text-gray-600 mr-2" />
                            <h5 className="font-medium text-gray-900 text-sm">Documentos</h5>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={formData.selectedFields.documentos || false}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  selectedFields: {
                                    ...formData.selectedFields,
                                    documentos: e.target.checked
                                  }
                                })}
                                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">Incluir Documentos</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Footer - Fixed */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex-shrink-0 flex flex-row-reverse gap-3">
                <button
                  onClick={handleSave}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-secondary text-base font-medium text-palette-yellow hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary sm:text-sm"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
