'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { FileText, Save, Building2, CheckSquare, Info, User, Users, Briefcase, DollarSign, GraduationCap, FileArchive, Settings } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'

interface Tenant {
  id: string
  name: string
  slug: string
}

interface FieldConfig {
  [key: string]: boolean | { [subKey: string]: boolean }
}

interface LegajoConfig {
  id: string | null
  tenantId: string
  requiredFields: {
    datosPersonales: FieldConfig
    datosFamiliares: FieldConfig
    contactosEmergencia: FieldConfig
    datosLaborales: FieldConfig
    datosRemuneracion: FieldConfig
    formacion: FieldConfig
    capacitaciones: FieldConfig
    documentos: FieldConfig
    datosAdministrativos: FieldConfig
  }
  createdAt: string | null
  updatedAt: string | null
}

interface CurrentUser {
  id: string
  tenantId: string
  superuser: boolean
}

export default function LegajoConfigPage() {
  const { confirm, ConfirmDialog } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<LegajoConfig | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchConfig()
    }
  }, [currentUser, selectedTenantId])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')

      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data)

        // Si es superuser, cargar tenants
        if (data.superuser) {
          fetchTenants()
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

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

  const fetchConfig = async () => {
    try {
      const url = selectedTenantId
        ? `/api/legajo-config?tenantId=${selectedTenantId}`
        : '/api/legajo-config'

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Error fetching legajo config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleField = (section: string, field: string) => {
    if (!config) return

    setConfig({
      ...config,
      requiredFields: {
        ...config.requiredFields,
        [section]: {
          ...config.requiredFields[section as keyof typeof config.requiredFields],
          [field]: !config.requiredFields[section as keyof typeof config.requiredFields][field as keyof typeof config.requiredFields[keyof typeof config.requiredFields]]
        }
      }
    })
  }

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    try {
      const response = await fetch('/api/legajo-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requiredFields: config.requiredFields,
          tenantId: selectedTenantId || currentUser?.tenantId
        })
      })

      if (response.ok) {
        await confirm({
          title: 'Éxito',
          message: 'La configuración de legajos ha sido guardada exitosamente',
          confirmText: 'Aceptar',
          type: 'info'
        })
        await fetchConfig()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar configuración')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      await confirm({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al guardar configuración',
        confirmText: 'Entendido',
        type: 'danger'
      })
    } finally {
      setSaving(false)
    }
  }

  const getTotalRequiredFields = () => {
    if (!config) return 0
    let count = 0
    Object.values(config.requiredFields).forEach(section => {
      Object.values(section).forEach(value => {
        if (value === true) count++
      })
    })
    return count
  }

  if (loading) {
    return (
      <DashboardLayout title="Configuración de Legajos" titleIcon={<FileText className="h-8 w-8 text-gray-600" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!config) {
    return (
      <DashboardLayout title="Configuración de Legajos" titleIcon={<FileText className="h-8 w-8 text-gray-600" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Error al cargar la configuración</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Configuración de Legajos" titleIcon={<FileText className="h-8 w-8 text-gray-600" />}>
      <ConfirmDialog />
      <div className="space-y-6">
        {/* Header con descripción mejorada */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-1">
              <div className="flex-shrink-0">
                <CheckSquare className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Configuración de Campos Obligatorios de Legajos
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• Configure qué campos son obligatorios al crear o editar un legajo de empleado</p>
                  <p>• Los campos marcados como obligatorios deberán ser completados antes de guardar un legajo</p>
                  <p>• Total de campos obligatorios configurados: {getTotalRequiredFields()}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-4 px-6 py-3 bg-secondary text-palette-yellow rounded-lg hover:bg-secondary-hover font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </div>

        {/* Tenant Filter - Only for Superusers */}
        {currentUser?.superuser && (
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-secondary">
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-secondary" />
              <label className="text-sm font-medium text-gray-700">Configurar para:</label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
                <option value="">Mi tenant ({currentUser?.tenantId ? tenants.find(t => t.id === currentUser.tenantId)?.name || 'Actual' : 'Actual'})</option>
                {tenants.filter(t => t.id !== currentUser?.tenantId).map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Grid de Secciones de Configuración */}
        <div className="columns-2 gap-6 space-y-6">
          {/* Datos Personales */}
          <Section
            title="Datos Personales"
            icon={<User className="h-5 w-5" />}
            color="bg-blue-50 border-blue-200"
            iconColor="text-blue-600"
            fields={config.requiredFields.datosPersonales}
            fieldLabels={{
              dni: 'DNI',
              cuil: 'CUIL',
              emailPersonal: 'Email Personal',
              emailCorporativo: 'Email Corporativo',
              telefono: 'Teléfono',
              telefonoAlternativo: 'Teléfono Alternativo',
              fechaNacimiento: 'Fecha de Nacimiento',
              lugarNacimiento: 'Lugar de Nacimiento',
              nacionalidad: 'Nacionalidad',
              sexo: 'Sexo',
              estadoCivil: 'Estado Civil',
              domicilio: 'Domicilio',
              localidad: 'Localidad',
              provincia: 'Provincia',
              codigoPostal: 'Código Postal'
            }}
            onToggle={(field) => handleToggleField('datosPersonales', field)}
          />

          {/* Datos Familiares */}
          <Section
            title="Datos Familiares"
            icon={<Users className="h-5 w-5" />}
            color="bg-green-50 border-green-200"
            iconColor="text-green-600"
            fields={config.requiredFields.datosFamiliares}
            fieldLabels={{
              hijosACargo: 'Hijos a Cargo',
              grupoFamiliarACargo: 'Grupo Familiar a Cargo (al menos uno)'
            }}
            onToggle={(field) => handleToggleField('datosFamiliares', field)}
          />

          {/* Contactos de Emergencia */}
          <Section
            title="Contactos de Emergencia"
            icon={<User className="h-5 w-5" />}
            color="bg-red-50 border-red-200"
            iconColor="text-red-600"
            fields={config.requiredFields.contactosEmergencia}
            fieldLabels={{
              required: 'Al menos un contacto de emergencia'
            }}
            onToggle={(field) => handleToggleField('contactosEmergencia', field)}
          />

          {/* Datos Laborales */}
          <Section
            title="Datos Laborales"
            icon={<Briefcase className="h-5 w-5" />}
            color="bg-purple-50 border-purple-200"
            iconColor="text-purple-600"
            fields={config.requiredFields.datosLaborales}
            fieldLabels={{
              puesto: 'Puesto',
              area: 'Área',
              sector: 'Sector',
              supervisor: 'Supervisor',
              fechaIngreso: 'Fecha de Ingreso',
              fechaEgreso: 'Fecha de Egreso',
              motivoEgreso: 'Motivo de Egreso',
              tipoContrato: 'Tipo de Contrato',
              jornada: 'Jornada',
              modalidad: 'Modalidad',
              ubicacion: 'Ubicación'
            }}
            onToggle={(field) => handleToggleField('datosLaborales', field)}
          />

          {/* Remuneración */}
          <Section
            title="Remuneración"
            icon={<DollarSign className="h-5 w-5" />}
            color="bg-yellow-50 border-yellow-200"
            iconColor="text-yellow-600"
            fields={config.requiredFields.datosRemuneracion}
            fieldLabels={{
              salarioBasico: 'Salario Básico',
              tipoLiquidacion: 'Tipo de Liquidación',
              banco: 'Banco',
              cbu: 'CBU',
              obraSocial: 'Obra Social',
              arl: 'ARL',
              adicionales: 'Adicionales (al menos uno)',
              beneficios: 'Beneficios (al menos uno)'
            }}
            onToggle={(field) => handleToggleField('datosRemuneracion', field)}
          />

          {/* Formación */}
          <Section
            title="Formación"
            icon={<GraduationCap className="h-5 w-5" />}
            color="bg-indigo-50 border-indigo-200"
            iconColor="text-indigo-600"
            fields={config.requiredFields.formacion}
            fieldLabels={{
              required: 'Al menos un registro de formación académica'
            }}
            onToggle={(field) => handleToggleField('formacion', field)}
          />

          {/* Capacitaciones */}
          <Section
            title="Capacitaciones"
            icon={<GraduationCap className="h-5 w-5" />}
            color="bg-teal-50 border-teal-200"
            iconColor="text-teal-600"
            fields={config.requiredFields.capacitaciones}
            fieldLabels={{
              required: 'Al menos una capacitación'
            }}
            onToggle={(field) => handleToggleField('capacitaciones', field)}
          />

          {/* Documentos */}
          <Section
            title="Documentos"
            icon={<FileArchive className="h-5 w-5" />}
            color="bg-orange-50 border-orange-200"
            iconColor="text-orange-600"
            fields={config.requiredFields.documentos}
            fieldLabels={{
              required: 'Al menos un documento adjunto'
            }}
            onToggle={(field) => handleToggleField('documentos', field)}
          />

          {/* Datos Administrativos */}
          <Section
            title="Datos Administrativos"
            icon={<Settings className="h-5 w-5" />}
            color="bg-gray-50 border-gray-200"
            iconColor="text-gray-600"
            fields={config.requiredFields.datosAdministrativos}
            fieldLabels={{
              legajoFisico: 'Número de Legajo Físico',
              observaciones: 'Observaciones'
            }}
            onToggle={(field) => handleToggleField('datosAdministrativos', field)}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

interface SectionProps {
  title: string
  icon: React.ReactNode
  color: string
  iconColor: string
  fields: FieldConfig
  fieldLabels: { [key: string]: string }
  onToggle: (field: string) => void
}

function Section({ title, icon, color, iconColor, fields, fieldLabels, onToggle }: SectionProps) {
  const requiredCount = Object.values(fields).filter(v => v === true).length
  const totalCount = Object.keys(fields).length

  return (
    <div className={`bg-white rounded-lg overflow-hidden transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.3)] hover:-translate-y-1 transform mb-6 break-inside-avoid`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${color} ${iconColor}`}>
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {requiredCount}/{totalCount}
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(fields).map(([field, required]) => (
            <label key={field} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={Boolean(required)}
                  onChange={() => onToggle(field)}
                  className="h-5 w-5 focus:ring-secondary border-gray-300 rounded cursor-pointer transition-all"
                  style={{ accentColor: '#352151' }}
                />
              </div>
              <span className={`text-sm flex-1 transition-colors ${required ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {fieldLabels[field] || field}
              </span>
              {required && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                  Obligatorio
                </span>
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
