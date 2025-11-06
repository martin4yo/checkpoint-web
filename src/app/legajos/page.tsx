'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import {
  FileText,
  User,
  Users,
  Edit2,
  X,
  UserCircle,
  UsersIcon,
  Briefcase,
  DollarSign,
  GraduationCap,
  FileArchive,
  Settings,
  Building2,
  Sliders
} from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import DatosPersonalesForm from '@/components/legajos/DatosPersonalesForm'
import DatosFamiliaresForm from '@/components/legajos/DatosFamiliaresForm'
import DatosLaboralesForm from '@/components/legajos/DatosLaboralesForm'
import RemuneracionForm from '@/components/legajos/RemuneracionForm'
import FormacionForm from '@/components/legajos/FormacionForm'
import DocumentosForm from '@/components/legajos/DocumentosForm'
import DatosAdministrativosForm from '@/components/legajos/DatosAdministrativosForm'
import CamposPersonalizadosForm from '@/components/legajos/CamposPersonalizadosForm'
import {
  LegajoCompleto,
  LegajoDatosPersonales,
  LegajoDatosFamiliares,
  ContactoEmergencia,
  LegajoDatosLaborales,
  LegajoDatosRemuneracion,
  Formacion,
  Capacitacion,
  Documento,
  LegajoDatosAdministrativos
} from '@/types/legajo'

interface Tenant {
  id: string
  name: string
  slug: string
}

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
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  legajo?: Legajo | null
}

interface CurrentUser {
  id: string
  tenantId: string
  superuser: boolean
}

export default function LegajosPage() {
  const { confirm, ConfirmDialog } = useConfirm()
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [filterTenantId, setFilterTenantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedLegajo, setSelectedLegajo] = useState<LegajoCompleto | null>(null)
  const [activeTab, setActiveTab] = useState('personal')
  const [saving, setSaving] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [fieldConfig, setFieldConfig] = useState<Record<string, unknown> | null>(null)

  // Form data states
  const [numeroLegajo, setNumeroLegajo] = useState('')
  const [datosPersonales, setDatosPersonales] = useState<LegajoDatosPersonales>({})
  const [datosFamiliares, setDatosFamiliares] = useState<LegajoDatosFamiliares>({ grupoFamiliarACargo: [] })
  const [contactosEmergencia, setContactosEmergencia] = useState<ContactoEmergencia[]>([])
  const [datosLaborales, setDatosLaborales] = useState<LegajoDatosLaborales>({})
  const [datosRemuneracion, setDatosRemuneracion] = useState<LegajoDatosRemuneracion>({ adicionales: [], beneficios: [] })
  const [formacion, setFormacion] = useState<Formacion[]>([])
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})
  const [datosAdministrativos, setDatosAdministrativos] = useState<LegajoDatosAdministrativos>({})

  const fetchUsers = useCallback(async () => {
    try {
      const url = filterTenantId
        ? `/api/legajos?tenantId=${filterTenantId}`
        : '/api/legajos'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setCurrentUser(data.currentUser)

        // Fetch tenants if user is superuser (only on first load)
        if (data.currentUser.superuser && tenants.length === 0) {
          fetchTenants()
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [filterTenantId, tenants.length])

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

  const fetchFieldConfig = useCallback(async () => {
    try {
      const url = filterTenantId
        ? `/api/legajo-config?tenantId=${filterTenantId}`
        : '/api/legajo-config'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setFieldConfig(data.requiredFields)
      }
    } catch (error) {
      console.error('Error fetching field config:', error)
    }
  }, [filterTenantId])

  useEffect(() => {
    fetchUsers()
    fetchFieldConfig()
  }, [filterTenantId, fetchUsers, fetchFieldConfig])

  // Helper function to convert ISO DateTime back to YYYY-MM-DD for date inputs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convertDatesToInputFormat = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj

    if (Array.isArray(obj)) {
      return obj.map(item => convertDatesToInputFormat(item))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const converted: any = {}
    for (const key in obj) {
      const value = obj[key]
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        // Convert ISO DateTime to YYYY-MM-DD for date inputs
        converted[key] = value.split('T')[0]
      } else if (typeof value === 'object' && value !== null) {
        converted[key] = convertDatesToInputFormat(value)
      } else {
        converted[key] = value
      }
    }
    return converted
  }

  const handleNewLegajo = () => {
    // Get users without legajo
    const usersWithoutLegajo = users.filter(u => !u.legajo)
    setAvailableUsers(usersWithoutLegajo)

    // Reset all states
    setSelectedUser(null)
    setSelectedLegajo(null)
    setIsCreatingNew(true)

    // Reset numero legajo for manual input
    setNumeroLegajo('')

    // Reset all form states
    setDatosPersonales({})
    setDatosFamiliares({ grupoFamiliarACargo: [] })
    setContactosEmergencia([])
    setDatosLaborales({})
    setDatosRemuneracion({ adicionales: [], beneficios: [] })
    setFormacion([])
    setCapacitaciones([])
    setDocumentos([])
    setDatosAdministrativos({})
    setCustomFieldValues({})

    setShowModal(true)
  }

  const handleEdit = async (user: User) => {
    setIsCreatingNew(false)
    setSelectedUser(user)

    // Si el usuario tiene legajo, traer todos sus datos
    if (user.legajo) {
      try {
        const response = await fetch(`/api/legajos?legajoId=${user.legajo.id}`)
        if (response.ok) {
          const fullLegajo = await response.json()
          setSelectedLegajo(fullLegajo)

          // Populate all form states (convert dates back to YYYY-MM-DD format)
          setNumeroLegajo(fullLegajo.numeroLegajo || '')
          setDatosPersonales(convertDatesToInputFormat(fullLegajo.datosPersonales || {}))
          setDatosFamiliares(convertDatesToInputFormat(fullLegajo.datosFamiliares || { grupoFamiliarACargo: [] }))
          setContactosEmergencia(convertDatesToInputFormat(fullLegajo.contactosEmergencia || []))
          setDatosLaborales(convertDatesToInputFormat(fullLegajo.datosLaborales || {}))
          setDatosRemuneracion(convertDatesToInputFormat(fullLegajo.datosRemuneracion || { adicionales: [], beneficios: [] }))
          setFormacion(convertDatesToInputFormat(fullLegajo.formacion || []))
          setCapacitaciones(convertDatesToInputFormat(fullLegajo.capacitaciones || []))
          setDocumentos(convertDatesToInputFormat(fullLegajo.documentos || []))
          setDatosAdministrativos(convertDatesToInputFormat(fullLegajo.datosAdministrativos || {}))

          // Cargar valores de campos personalizados
          const customValues: Record<string, string> = {}
          if (fullLegajo.customFieldValues && Array.isArray(fullLegajo.customFieldValues)) {
            fullLegajo.customFieldValues.forEach((cfv: { customFieldId: string; value: string }) => {
              customValues[cfv.customFieldId] = cfv.value
            })
          }
          setCustomFieldValues(customValues)
        }
      } catch (error) {
        console.error('Error fetching legajo details:', error)
      }
    } else {
      // Si no tiene legajo, inicializar vacío
      setSelectedLegajo(null)
      // Reset numero legajo for manual input
      setNumeroLegajo('')

      // Reset all form states
      setDatosPersonales({})
      setDatosFamiliares({ grupoFamiliarACargo: [] })
      setContactosEmergencia([])
      setDatosLaborales({})
      setDatosRemuneracion({ adicionales: [], beneficios: [] })
      setFormacion([])
      setCapacitaciones([])
      setDocumentos([])
      setDatosAdministrativos({})
      setCustomFieldValues({})
    }

    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedUser(null)
    setSelectedLegajo(null)
    setActiveTab('personal')
    setIsCreatingNew(false)
    setAvailableUsers([])

    // Reset all form states
    setNumeroLegajo('')
    setDatosPersonales({})
    setDatosFamiliares({ grupoFamiliarACargo: [] })
    setContactosEmergencia([])
    setDatosLaborales({})
    setDatosRemuneracion({ adicionales: [], beneficios: [] })
    setFormacion([])
    setCapacitaciones([])
    setDocumentos([])
    setDatosAdministrativos({})
  }

  const handleSave = async () => {
    if (!selectedUser) {
      await confirm({
        title: 'Usuario Requerido',
        message: 'Debe seleccionar un empleado para crear el legajo',
        confirmText: 'Entendido',
        type: 'warning'
      })
      return
    }

    // Basic validations
    if (!numeroLegajo.trim()) {
      await confirm({
        title: 'Campo Requerido',
        message: 'El número de legajo es requerido',
        confirmText: 'Entendido',
        type: 'warning'
      })
      return
    }

    // Dynamic validations based on field configuration
    if (fieldConfig) {
      // Validate Datos Personales
      if (fieldConfig.datosPersonales) {
        const personalFields = {
          dni: { value: datosPersonales.dni, label: 'DNI' },
          cuil: { value: datosPersonales.cuil, label: 'CUIL' },
          emailPersonal: { value: datosPersonales.emailPersonal, label: 'Email Personal' },
          emailCorporativo: { value: datosPersonales.emailCorporativo, label: 'Email Corporativo' },
          telefonoFijo: { value: datosPersonales.telefonoFijo, label: 'Teléfono Fijo' },
          telefonoCelular: { value: datosPersonales.telefonoCelular, label: 'Teléfono Celular' },
          fechaNacimiento: { value: datosPersonales.fechaNacimiento, label: 'Fecha de Nacimiento' },
          nacionalidad: { value: datosPersonales.nacionalidad, label: 'Nacionalidad' },
          genero: { value: datosPersonales.genero, label: 'Género' },
          estadoCivil: { value: datosPersonales.estadoCivil, label: 'Estado Civil' },
          domicilioCalle: { value: datosPersonales.domicilioCalle, label: 'Calle' },
          domicilioNumero: { value: datosPersonales.domicilioNumero, label: 'Número' },
          domicilioLocalidad: { value: datosPersonales.domicilioLocalidad, label: 'Localidad' },
          domicilioProvincia: { value: datosPersonales.domicilioProvincia, label: 'Provincia' },
          domicilioCP: { value: datosPersonales.domicilioCP, label: 'Código Postal' }
        }

        for (const [field, { value, label }] of Object.entries(personalFields)) {
          if (fieldConfig.datosPersonales[field] && !value) {
            await confirm({
              title: 'Campo Requerido',
              message: `El campo "${label}" es obligatorio`,
              confirmText: 'Entendido',
              type: 'warning'
            })
            setActiveTab('personal')
            return
          }
        }
      }

      // Validate Datos Familiares
      if (fieldConfig.datosFamiliares) {
        if (fieldConfig.datosFamiliares.hijosACargo && datosFamiliares.hijosACargo === undefined) {
          await confirm({
            title: 'Campo Requerido',
            message: 'Debe indicar si tiene hijos a cargo',
            confirmText: 'Entendido',
            type: 'warning'
          })
          setActiveTab('familiares')
          return
        }

        if (fieldConfig.datosFamiliares.grupoFamiliarACargo && (!datosFamiliares.grupoFamiliarACargo || datosFamiliares.grupoFamiliarACargo.length === 0)) {
          await confirm({
            title: 'Campo Requerido',
            message: 'Debe agregar al menos un integrante del grupo familiar',
            confirmText: 'Entendido',
            type: 'warning'
          })
          setActiveTab('familiares')
          return
        }
      }

      // Validate Contactos de Emergencia
      if (fieldConfig.contactosEmergencia?.required && (!contactosEmergencia || contactosEmergencia.length === 0)) {
        await confirm({
          title: 'Campo Requerido',
          message: 'Debe agregar al menos un contacto de emergencia',
          confirmText: 'Entendido',
          type: 'warning'
        })
        setActiveTab('familiares')
        return
      }

      // Validate Datos Laborales
      if (fieldConfig.datosLaborales) {
        const laboralFields = {
          puesto: { value: datosLaborales.puesto, label: 'Puesto' },
          area: { value: datosLaborales.area, label: 'Área' },
          sector: { value: datosLaborales.sector, label: 'Sector' },
          supervisor: { value: datosLaborales.supervisor, label: 'Supervisor' },
          fechaIngreso: { value: datosLaborales.fechaIngreso, label: 'Fecha de Ingreso' },
          tipoContrato: { value: datosLaborales.tipoContrato, label: 'Tipo de Contrato' },
          jornada: { value: datosLaborales.jornada, label: 'Jornada' },
          modalidad: { value: datosLaborales.modalidad, label: 'Modalidad' },
          ubicacion: { value: datosLaborales.ubicacion, label: 'Ubicación' }
        }

        for (const [field, { value, label }] of Object.entries(laboralFields)) {
          if (fieldConfig.datosLaborales[field] && !value) {
            await confirm({
              title: 'Campo Requerido',
              message: `El campo "${label}" es obligatorio`,
              confirmText: 'Entendido',
              type: 'warning'
            })
            setActiveTab('laborales')
            return
          }
        }
      }

      // Validate Remuneración
      if (fieldConfig.datosRemuneracion) {
        const remuneracionFields = {
          salarioBasico: { value: datosRemuneracion.salarioBasico, label: 'Salario Básico' },
          tipoLiquidacion: { value: datosRemuneracion.tipoLiquidacion, label: 'Tipo de Liquidación' },
          banco: { value: datosRemuneracion.banco, label: 'Banco' },
          cbu: { value: datosRemuneracion.cbu, label: 'CBU' },
          obraSocial: { value: datosRemuneracion.obraSocial, label: 'Obra Social' },
          arl: { value: datosRemuneracion.arl, label: 'ARL' }
        }

        for (const [field, { value, label }] of Object.entries(remuneracionFields)) {
          if (fieldConfig.datosRemuneracion[field] && !value) {
            await confirm({
              title: 'Campo Requerido',
              message: `El campo "${label}" es obligatorio`,
              confirmText: 'Entendido',
              type: 'warning'
            })
            setActiveTab('remuneracion')
            return
          }
        }

        if (fieldConfig.datosRemuneracion.adicionales && (!datosRemuneracion.adicionales || datosRemuneracion.adicionales.length === 0)) {
          await confirm({
            title: 'Campo Requerido',
            message: 'Debe agregar al menos un adicional',
            confirmText: 'Entendido',
            type: 'warning'
          })
          setActiveTab('remuneracion')
          return
        }

        if (fieldConfig.datosRemuneracion.beneficios && (!datosRemuneracion.beneficios || datosRemuneracion.beneficios.length === 0)) {
          await confirm({
            title: 'Campo Requerido',
            message: 'Debe agregar al menos un beneficio',
            confirmText: 'Entendido',
            type: 'warning'
          })
          setActiveTab('remuneracion')
          return
        }
      }

      // Validate Formación
      if (fieldConfig.formacion?.required && (!formacion || formacion.length === 0)) {
        await confirm({
          title: 'Campo Requerido',
          message: 'Debe agregar al menos un registro de formación académica',
          confirmText: 'Entendido',
          type: 'warning'
        })
        setActiveTab('formacion')
        return
      }

      // Validate Capacitaciones
      if (fieldConfig.capacitaciones?.required && (!capacitaciones || capacitaciones.length === 0)) {
        await confirm({
          title: 'Campo Requerido',
          message: 'Debe agregar al menos una capacitación',
          confirmText: 'Entendido',
          type: 'warning'
        })
        setActiveTab('formacion')
        return
      }

      // Validate Documentos
      if (fieldConfig.documentos?.required && (!documentos || documentos.length === 0)) {
        await confirm({
          title: 'Campo Requerido',
          message: 'Debe agregar al menos un documento',
          confirmText: 'Entendido',
          type: 'warning'
        })
        setActiveTab('documentos')
        return
      }

      // Validate Datos Administrativos
      if (fieldConfig.datosAdministrativos) {
        if (fieldConfig.datosAdministrativos.legajoFisico && !datosAdministrativos.legajoFisico) {
          await confirm({
            title: 'Campo Requerido',
            message: 'El número de legajo físico es obligatorio',
            confirmText: 'Entendido',
            type: 'warning'
          })
          setActiveTab('administrativos')
          return
        }

        if (fieldConfig.datosAdministrativos.observaciones && !datosAdministrativos.observaciones) {
          await confirm({
            title: 'Campo Requerido',
            message: 'Las observaciones son obligatorias',
            confirmText: 'Entendido',
            type: 'warning'
          })
          setActiveTab('administrativos')
          return
        }
      }
    }

    // Format validations (always apply, regardless of required status)
    // Validate DNI format (8 digits)
    if (datosPersonales.dni && !/^\d{7,8}$/.test(datosPersonales.dni)) {
      await confirm({
        title: 'Validación de DNI',
        message: 'El DNI debe tener 7 u 8 dígitos',
        confirmText: 'Entendido',
        type: 'warning'
      })
      setActiveTab('personal')
      return
    }

    // Validate CUIL format (XX-XXXXXXXX-X)
    if (datosPersonales.cuil && !/^\d{2}-\d{8}-\d{1}$/.test(datosPersonales.cuil)) {
      await confirm({
        title: 'Validación de CUIL',
        message: 'El CUIL debe tener el formato XX-XXXXXXXX-X (ejemplo: 20-22301759-3)',
        confirmText: 'Entendido',
        type: 'warning'
      })
      setActiveTab('personal')
      return
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (datosPersonales.emailPersonal && !emailRegex.test(datosPersonales.emailPersonal)) {
      await confirm({
        title: 'Validación de Email',
        message: 'El email personal no tiene un formato válido',
        confirmText: 'Entendido',
        type: 'warning'
      })
      setActiveTab('personal')
      return
    }
    if (datosPersonales.emailCorporativo && !emailRegex.test(datosPersonales.emailCorporativo)) {
      await confirm({
        title: 'Validación de Email',
        message: 'El email corporativo no tiene un formato válido',
        confirmText: 'Entendido',
        type: 'warning'
      })
      setActiveTab('personal')
      return
    }

    // Validate CBU format (22 digits)
    if (datosRemuneracion.cbu && !/^\d{22}$/.test(datosRemuneracion.cbu)) {
      await confirm({
        title: 'Validación de CBU',
        message: 'El CBU debe tener exactamente 22 dígitos',
        confirmText: 'Entendido',
        type: 'warning'
      })
      setActiveTab('remuneracion')
      return
    }

    // Validate salary is positive
    if (datosRemuneracion.salarioBasico && datosRemuneracion.salarioBasico <= 0) {
      await confirm({
        title: 'Validación de Salario',
        message: 'El salario básico debe ser mayor a cero',
        confirmText: 'Entendido',
        type: 'warning'
      })
      setActiveTab('remuneracion')
      return
    }

    setSaving(true)

    try {
      let legajoId = selectedLegajo?.id

      // Helper function to clean empty strings from objects (convert to null/undefined for DateTime fields)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cleanData = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj

        if (Array.isArray(obj)) {
          return obj.map(item => cleanData(item))
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cleaned: any = {}
        for (const key in obj) {
          const value = obj[key]
          if (value === '' || value === undefined) {
            // Skip empty strings and undefined values
            continue
          }
          if (typeof value === 'object' && value !== null) {
            cleaned[key] = cleanData(value)
          } else {
            cleaned[key] = value
          }
        }
        return cleaned
      }

      // If legajo doesn't exist, create it first
      if (!selectedLegajo) {
        const createResponse = await fetch('/api/legajos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: selectedUser.id,
            numeroLegajo: numeroLegajo,
          }),
        })

        if (!createResponse.ok) {
          const error = await createResponse.json()
          throw new Error(error.error || 'Error al crear legajo')
        }

        const newLegajo = await createResponse.json()
        legajoId = newLegajo.id
      }

      // Update all legajo data (clean empty strings before sending)
      const updateResponse = await fetch('/api/legajos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          legajoId: legajoId,
          datosPersonales: cleanData(datosPersonales),
          datosFamiliares: cleanData(datosFamiliares),
          contactosEmergencia: cleanData(contactosEmergencia),
          datosLaborales: cleanData(datosLaborales),
          datosRemuneracion: cleanData(datosRemuneracion),
          formacion: cleanData(formacion),
          capacitaciones: cleanData(capacitaciones),
          documentos: cleanData(documentos),
          datosAdministrativos: cleanData(datosAdministrativos),
          customFieldValues: customFieldValues,
        }),
      })

      if (!updateResponse.ok) {
        const error = await updateResponse.json()
        throw new Error(error.error || 'Error al actualizar legajo')
      }

      // Success!
      await confirm({
        title: 'Éxito',
        message: 'El legajo ha sido guardado exitosamente',
        confirmText: 'Aceptar',
        type: 'info'
      })
      await fetchUsers()
      closeModal()
    } catch (error) {
      console.error('Error saving legajo:', error)
      await confirm({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al guardar legajo',
        confirmText: 'Entendido',
        type: 'danger'
      })
    } finally {
      setSaving(false)
    }
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
      <ConfirmDialog />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            <Users className="inline h-5 w-5 mr-2" />
            Legajos de Empleados ({users.filter(u => u.legajo).length})
          </h2>
          <button
            onClick={handleNewLegajo}
            className="px-4 py-2 bg-secondary text-palette-yellow rounded-md hover:bg-secondary-hover flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Nuevo Legajo</span>
          </button>
        </div>

        {/* Tenant Filter - Only for Superusers */}
        {currentUser?.superuser && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-secondary" />
              <select
                value={filterTenantId}
                onChange={(e) => setFilterTenantId(e.target.value)}
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
              {users.filter(user => user.legajo).map((user) => (
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
                          {user.firstName} {user.lastName}
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
          {users.filter(u => u.legajo).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay legajos creados aún. Use el botón &quot;Nuevo Legajo&quot; para crear uno.
            </div>
          )}
        </div>

        {/* Modal de Edición/Creación */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border-2 border-gray-300 p-6 w-full max-w-[1400px] h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {isCreatingNew
                    ? 'Crear Nuevo Legajo'
                    : selectedLegajo
                    ? `Legajo N° ${selectedLegajo.numeroLegajo} - ${selectedUser?.firstName} ${selectedUser?.lastName}`
                    : `Crear Legajo - ${selectedUser?.firstName} ${selectedUser?.lastName}`
                  }
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* User Selector - Only for new legajo creation */}
              {isCreatingNew && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Empleado
                  </label>
                  <select
                    value={selectedUser?.id || ''}
                    onChange={(e) => {
                      const user = availableUsers.find(u => u.id === e.target.value)
                      setSelectedUser(user || null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                  >
                    <option value="">-- Seleccione un empleado --</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                  {availableUsers.length === 0 && (
                    <p className="mt-2 text-sm text-orange-600">
                      No hay usuarios disponibles sin legajo. Todos los usuarios ya tienen un legajo asignado.
                    </p>
                  )}
                </div>
              )}

              {/* Número de Legajo */}
              {selectedUser && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Legajo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={numeroLegajo}
                    onChange={(e) => setNumeroLegajo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="Ej: LEG-001, 00123, etc."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ingrese el número de legajo personalizado
                  </p>
                </div>
              )}

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-4 flex-shrink-0">
                <nav className="-mb-px flex space-x-2">
                  {[
                    { id: 'personal', label: 'Datos Personales', icon: UserCircle },
                    { id: 'familiares', label: 'Datos Familiares', icon: UsersIcon },
                    { id: 'laborales', label: 'Datos Laborales', icon: Briefcase },
                    { id: 'remuneracion', label: 'Remuneración', icon: DollarSign },
                    { id: 'formacion', label: 'Formación', icon: GraduationCap },
                    { id: 'documentos', label: 'Documentos', icon: FileArchive },
                    { id: 'administrativos', label: 'Administrativos', icon: Settings },
                    { id: 'personalizados', label: 'Campos Personalizados', icon: Sliders },
                  ].map((tab) => {
                    const IconComponent = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2
                          ${activeTab === tab.id
                            ? 'border-secondary text-secondary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Contenido de las Tabs */}
              <div className="flex-1 overflow-y-auto pl-1 pr-4">
                {activeTab === 'personal' && (
                  <DatosPersonalesForm
                    data={datosPersonales}
                    onChange={setDatosPersonales}
                    fieldConfig={fieldConfig}
                  />
                )}
                {activeTab === 'familiares' && (
                  <DatosFamiliaresForm
                    datosFamiliares={datosFamiliares}
                    contactosEmergencia={contactosEmergencia}
                    onChangeFamiliares={setDatosFamiliares}
                    onChangeContactos={setContactosEmergencia}
                    fieldConfig={fieldConfig}
                  />
                )}
                {activeTab === 'laborales' && (
                  <DatosLaboralesForm
                    data={datosLaborales}
                    onChange={setDatosLaborales}
                    fieldConfig={fieldConfig}
                  />
                )}
                {activeTab === 'remuneracion' && (
                  <RemuneracionForm
                    data={datosRemuneracion}
                    onChange={setDatosRemuneracion}
                    fieldConfig={fieldConfig}
                  />
                )}
                {activeTab === 'formacion' && (
                  <FormacionForm
                    formacion={formacion}
                    capacitaciones={capacitaciones}
                    onChangeFormacion={setFormacion}
                    onChangeCapacitaciones={setCapacitaciones}
                    fieldConfig={fieldConfig}
                  />
                )}
                {activeTab === 'documentos' && (
                  <DocumentosForm
                    documentos={documentos}
                    onChange={setDocumentos}
                    fieldConfig={fieldConfig}
                  />
                )}
                {activeTab === 'administrativos' && (
                  <DatosAdministrativosForm
                    data={datosAdministrativos}
                    onChange={setDatosAdministrativos}
                    fieldConfig={fieldConfig}
                  />
                )}
                {activeTab === 'personalizados' && (
                  <CamposPersonalizadosForm
                    legajoId={selectedUser?.legajo?.id}
                    values={customFieldValues}
                    onChange={setCustomFieldValues}
                  />
                )}
              </div>

              {/* Botones de Acción */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  disabled={saving}
                >
                  Cerrar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-secondary text-palette-yellow rounded-md hover:bg-secondary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
