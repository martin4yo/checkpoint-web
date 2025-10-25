'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { FileText, Save, Building2 } from 'lucide-react'
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Campos Obligatorios de Legajos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure qué campos son obligatorios al crear o editar un legajo
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-hover flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>

        {/* Tenant Filter - Only for Superusers */}
        {currentUser?.superuser && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-secondary" />
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

        {/* Secciones de Configuración */}
        <div className="space-y-6">
          {/* Datos Personales */}
          <Section
            title="Datos Personales"
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
            fields={config.requiredFields.contactosEmergencia}
            fieldLabels={{
              required: 'Al menos un contacto de emergencia'
            }}
            onToggle={(field) => handleToggleField('contactosEmergencia', field)}
          />

          {/* Datos Laborales */}
          <Section
            title="Datos Laborales"
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
            fields={config.requiredFields.formacion}
            fieldLabels={{
              required: 'Al menos un registro de formación académica'
            }}
            onToggle={(field) => handleToggleField('formacion', field)}
          />

          {/* Capacitaciones */}
          <Section
            title="Capacitaciones"
            fields={config.requiredFields.capacitaciones}
            fieldLabels={{
              required: 'Al menos una capacitación'
            }}
            onToggle={(field) => handleToggleField('capacitaciones', field)}
          />

          {/* Documentos */}
          <Section
            title="Documentos"
            fields={config.requiredFields.documentos}
            fieldLabels={{
              required: 'Al menos un documento adjunto'
            }}
            onToggle={(field) => handleToggleField('documentos', field)}
          />

          {/* Datos Administrativos */}
          <Section
            title="Datos Administrativos"
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
  fields: FieldConfig
  fieldLabels: { [key: string]: string }
  onToggle: (field: string) => void
}

function Section({ title, fields, fieldLabels, onToggle }: SectionProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {Object.entries(fields).map(([field, required]) => (
          <label key={field} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input
              type="checkbox"
              checked={Boolean(required)}
              onChange={() => onToggle(field)}
              className="h-5 w-5 text-secondary focus:ring-secondary border-gray-300 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-700">{fieldLabels[field] || field}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
