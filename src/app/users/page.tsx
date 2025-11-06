'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Users, Search } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'

interface Tenant {
  id: string
  name: string
  slug: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  tenantId: string
  supervisorId?: string | null
  superuser: boolean
  authorizesNovelties: boolean
  isActive: boolean
  createdAt: string
  tenant: Tenant
  supervisor?: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  _count?: {
    assignments: number
    checkpoints: number
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    tenantId: '',
    supervisorId: '',
    superuser: false,
    authorizesNovelties: false,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTenantId, setFilterTenantId] = useState('')
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    fetchUsers()
    fetchTenants()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])

        // Identify current user (first superuser found, or first user)
        const superUser = (data.users || []).find((u: User) => u.superuser)
        setCurrentUser(superUser || data.users?.[0] || null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      ...(formData.password && { password: formData.password }),
      tenantId: formData.tenantId,
      supervisorId: formData.supervisorId || null,
      superuser: formData.superuser,
      authorizesNovelties: formData.authorizesNovelties,
    }

    try {
      const response = await fetch('/api/users', {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser ? { ...userData, id: editingUser.id } : userData),
      })

      if (response.ok) {
        fetchUsers()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar usuario')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Error al guardar usuario')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      tenantId: user.tenantId,
      supervisorId: user.supervisorId || '',
      superuser: user.superuser,
      authorizesNovelties: user.authorizesNovelties || false,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string, userName: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Usuario',
      message: (
        <div>
          ¿Estás seguro de que quieres eliminar al usuario <strong>{userName}</strong>?
          <br />
          <span className="text-sm text-gray-500 mt-2 block">
            Esta acción no se puede deshacer.
          </span>
        </div>
      ),
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      )
    })

    if (confirmed) {
      try {
        const response = await fetch('/api/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })

        if (response.ok) {
          fetchUsers()
        }
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  const toggleUserStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/users/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      tenantId: tenants[0]?.id || '',
      supervisorId: '',
      superuser: false,
      authorizesNovelties: false,
    })
    setEditingUser(null)
    setShowForm(false)
  }

  // Filter users based on search term and tenant filter
  const filteredUsers = users.filter(user => {
    // Filter by tenant
    if (filterTenantId && user.tenantId !== filterTenantId) {
      return false
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
      const matchesName = fullName.includes(searchLower)
      const matchesEmail = user.email.toLowerCase().includes(searchLower)
      const matchesTenantName = user.tenant.name.toLowerCase().includes(searchLower)
      const matchesTenantSlug = user.tenant.slug.toLowerCase().includes(searchLower)
      const matchesRole = user.superuser
        ? 'superusuario'.includes(searchLower)
        : 'usuario'.includes(searchLower)
      const matchesStatus = user.isActive
        ? 'activo'.includes(searchLower)
        : 'inactivo'.includes(searchLower)

      return matchesName || matchesEmail || matchesTenantName || matchesTenantSlug || matchesRole || matchesStatus
    }

    return true
  })

  // Only superusers can edit tenant and superuser fields
  const canEditTenant = currentUser?.superuser
  const canEditSuperuser = currentUser?.superuser

  if (loading) {
    return (
      <DashboardLayout title="Gestión de Usuarios" titleIcon={<Users className="h-8 w-8 text-gray-600" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Gestión de Usuarios" titleIcon={<Users className="h-8 w-8 text-gray-600" />}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Lista de Usuarios ({filteredUsers.length}{filteredUsers.length !== users.length && ` de ${users.length}`})
          </h2>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="inline-flex items-center bg-secondary text-palette-yellow px-4 py-2 rounded-lg hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email, tenant, rol o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={filterTenantId}
                onChange={(e) => setFilterTenantId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
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

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña {editingUser && '(dejar vacío para mantener actual)'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required={!editingUser}
                  />
                </div>
                {canEditTenant && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tenant
                    </label>
                    <select
                      value={formData.tenantId}
                      onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    >
                      <option value="">Seleccionar tenant...</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supervisor
                  </label>
                  <select
                    value={formData.supervisorId}
                    onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Sin supervisor</option>
                    {users
                      .filter(u => u.id !== editingUser?.id && u.tenantId === formData.tenantId)
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="space-y-3 border-t border-gray-200 pt-4">
                {canEditSuperuser && editingUser && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="superuser"
                      checked={formData.superuser}
                      onChange={(e) => setFormData({ ...formData, superuser: e.target.checked })}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <label htmlFor="superuser" className="ml-2 block text-sm font-medium text-gray-900">
                      Super Usuario
                    </label>
                    <span className="ml-2 text-xs text-gray-500">(puede gestionar todos los tenants y usuarios)</span>
                  </div>
                )}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="authorizesNovelties"
                    checked={formData.authorizesNovelties}
                    onChange={(e) => setFormData({ ...formData, authorizesNovelties: e.target.checked })}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <label htmlFor="authorizesNovelties" className="ml-2 block text-sm font-medium text-gray-900">
                    Autoriza Novedades
                  </label>
                  <span className="ml-2 text-xs text-gray-500">(puede aprobar o rechazar novedades)</span>
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
                  className="px-4 py-2 bg-secondary text-palette-yellow rounded-md hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors"
                >
                  {editingUser ? 'Actualizar' : 'Crear'}
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
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supervisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
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
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.tenant.name}</div>
                    <div className="text-xs text-gray-500">{user.tenant.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.supervisor ? (
                      <div>
                        <div className="text-sm text-gray-900">{user.supervisor.firstName} {user.supervisor.lastName}</div>
                        <div className="text-xs text-gray-500">{user.supervisor.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Sin supervisor</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.superuser ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        Superusuario
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Usuario
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="inline-flex items-center text-blue-600 hover:text-blue-900"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user.id, user.isActive)}
                      className="inline-flex items-center text-yellow-600 hover:text-yellow-900"
                      title={user.isActive ? "Desactivar" : "Activar"}
                    >
                      {user.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
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
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {users.length === 0
                ? 'No hay usuarios registrados'
                : 'No se encontraron usuarios con los filtros aplicados'}
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog />
    </DashboardLayout>
  )
}