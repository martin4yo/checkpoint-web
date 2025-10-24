'use client'

import { useEffect, useState } from 'react'
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
  Building2
} from 'lucide-react'
import DatosPersonalesForm from '@/components/legajos/DatosPersonalesForm'
import DatosFamiliaresForm from '@/components/legajos/DatosFamiliaresForm'
import DatosLaboralesForm from '@/components/legajos/DatosLaboralesForm'
import RemuneracionForm from '@/components/legajos/RemuneracionForm'
import FormacionForm from '@/components/legajos/FormacionForm'
import DocumentosForm from '@/components/legajos/DocumentosForm'
import DatosAdministrativosForm from '@/components/legajos/DatosAdministrativosForm'
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
  name: string
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
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [filterTenantId, setFilterTenantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedLegajo, setSelectedLegajo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('personal')
  const [saving, setSaving] = useState(false)

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
  const [datosAdministrativos, setDatosAdministrativos] = useState<LegajoDatosAdministrativos>({})

  useEffect(() => {
    fetchUsers()
  }, [filterTenantId])

  const fetchUsers = async () => {
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

  const handleEdit = async (user: User) => {
    setSelectedUser(user)

    // Si el usuario tiene legajo, traer todos sus datos
    if (user.legajo) {
      try {
        const response = await fetch(`/api/legajos?legajoId=${user.legajo.id}`)
        if (response.ok) {
          const fullLegajo = await response.json()
          setSelectedLegajo(fullLegajo)

          // Populate all form states
          setNumeroLegajo(fullLegajo.numeroLegajo || '')
          setDatosPersonales(fullLegajo.datosPersonales || {})
          setDatosFamiliares(fullLegajo.datosFamiliares || { grupoFamiliarACargo: [] })
          setContactosEmergencia(fullLegajo.contactosEmergencia || [])
          setDatosLaborales(fullLegajo.datosLaborales || {})
          setDatosRemuneracion(fullLegajo.datosRemuneracion || { adicionales: [], beneficios: [] })
          setFormacion(fullLegajo.formacion || [])
          setCapacitaciones(fullLegajo.capacitaciones || [])
          setDocumentos(fullLegajo.documentos || [])
          setDatosAdministrativos(fullLegajo.datosAdministrativos || {})
        }
      } catch (error) {
        console.error('Error fetching legajo details:', error)
      }
    } else {
      // Si no tiene legajo, inicializar vacío
      setSelectedLegajo(null)
      // Generate new legajo number (simple auto-increment based on user count)
      const newNumero = String(users.length + 1).padStart(3, '0')
      setNumeroLegajo(newNumero)

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
    }

    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedUser(null)
    setSelectedLegajo(null)
    setActiveTab('personal')

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
    if (!selectedUser) return

    // Basic validations
    if (!numeroLegajo.trim()) {
      alert('Número de legajo es requerido')
      return
    }

    // Validate DNI format (8 digits)
    if (datosPersonales.dni && !/^\d{7,8}$/.test(datosPersonales.dni)) {
      alert('DNI debe tener 7 u 8 dígitos')
      setActiveTab('personal')
      return
    }

    // Validate CUIL format (XX-XXXXXXXX-X)
    if (datosPersonales.cuil && !/^\d{2}-?\d{8}-?\d{1}$/.test(datosPersonales.cuil.replace(/-/g, ''))) {
      alert('CUIL debe tener el formato XX-XXXXXXXX-X')
      setActiveTab('personal')
      return
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (datosPersonales.emailPersonal && !emailRegex.test(datosPersonales.emailPersonal)) {
      alert('Email personal no tiene un formato válido')
      setActiveTab('personal')
      return
    }
    if (datosPersonales.emailCorporativo && !emailRegex.test(datosPersonales.emailCorporativo)) {
      alert('Email corporativo no tiene un formato válido')
      setActiveTab('personal')
      return
    }

    // Validate CBU format (22 digits)
    if (datosRemuneracion.cbu && !/^\d{22}$/.test(datosRemuneracion.cbu)) {
      alert('CBU debe tener exactamente 22 dígitos')
      setActiveTab('remuneracion')
      return
    }

    // Validate salary is positive
    if (datosRemuneracion.salarioBasico && datosRemuneracion.salarioBasico <= 0) {
      alert('El salario básico debe ser mayor a cero')
      setActiveTab('remuneracion')
      return
    }

    setSaving(true)

    try {
      let legajoId = selectedLegajo?.id

      // If legajo doesn't exist, create it first
      if (!selectedLegajo) {
        const createResponse = await fetch('/api/legajos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
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

      // Update all legajo data
      const updateResponse = await fetch('/api/legajos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          legajoId: legajoId,
          datosPersonales,
          datosFamiliares,
          contactosEmergencia,
          datosLaborales,
          datosRemuneracion,
          formacion,
          capacitaciones,
          documentos,
          datosAdministrativos,
        }),
      })

      if (!updateResponse.ok) {
        const error = await updateResponse.json()
        throw new Error(error.error || 'Error al actualizar legajo')
      }

      // Success!
      alert('Legajo guardado exitosamente')
      await fetchUsers()
      closeModal()
    } catch (error) {
      console.error('Error saving legajo:', error)
      alert(error instanceof Error ? error.message : 'Error al guardar legajo')
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            <Users className="inline h-5 w-5 mr-2" />
            Legajos de Empleados ({users.length})
          </h2>
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
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border-2 border-gray-300 p-6 w-full max-w-7xl h-[80vh] flex flex-col">
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
                  <X className="h-6 w-6" />
                </button>
              </div>

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
                  />
                )}
                {activeTab === 'familiares' && (
                  <DatosFamiliaresForm
                    datosFamiliares={datosFamiliares}
                    contactosEmergencia={contactosEmergencia}
                    onChangeFamiliares={setDatosFamiliares}
                    onChangeContactos={setContactosEmergencia}
                  />
                )}
                {activeTab === 'laborales' && (
                  <DatosLaboralesForm
                    data={datosLaborales}
                    onChange={setDatosLaborales}
                  />
                )}
                {activeTab === 'remuneracion' && (
                  <RemuneracionForm
                    data={datosRemuneracion}
                    onChange={setDatosRemuneracion}
                  />
                )}
                {activeTab === 'formacion' && (
                  <FormacionForm
                    formacion={formacion}
                    capacitaciones={capacitaciones}
                    onChangeFormacion={setFormacion}
                    onChangeCapacitaciones={setCapacitaciones}
                  />
                )}
                {activeTab === 'documentos' && (
                  <DocumentosForm
                    documentos={documentos}
                    onChange={setDocumentos}
                  />
                )}
                {activeTab === 'administrativos' && (
                  <DatosAdministrativosForm
                    data={datosAdministrativos}
                    onChange={setDatosAdministrativos}
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
                  className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
