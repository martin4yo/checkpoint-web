'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, Smartphone, Trash2, Bell, BellOff } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'

interface PushDevice {
  id: string
  deviceId: string
  platform: string
  description: string
  createdAt: string
  updatedAt: string
}

export default function PushDevicesPage() {
  const [devices, setDevices] = useState<PushDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    deviceId: '',
    pushToken: '',
    platform: 'android',
    description: '',
    adminSecret: ''
  })
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    deviceId: string;
    description: string
  }>({
    isOpen: false,
    deviceId: '',
    description: ''
  })

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/admin/push-tokens')
      if (response.ok) {
        const data = await response.json()
        setDevices(data.data)
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/push-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        fetchDevices()
        resetForm()
        alert('Dispositivo registrado exitosamente')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving device:', error)
      alert('Error al registrar dispositivo')
    }
  }

  const handleDeleteClick = (device: PushDevice) => {
    setDeleteConfirm({
      isOpen: true,
      deviceId: device.deviceId,
      description: device.description
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch('/api/admin/push-tokens', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: deleteConfirm.deviceId,
          adminSecret: '' // Se puede configurar en variables de entorno
        })
      })

      if (response.ok) {
        fetchDevices()
        alert('Dispositivo desactivado exitosamente')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting device:', error)
      alert('Error al desactivar dispositivo')
    }
  }

  const resetForm = () => {
    setFormData({
      deviceId: '',
      pushToken: '',
      platform: 'android',
      description: '',
      adminSecret: ''
    })
    setShowForm(false)
  }

  const testMonitoring = async () => {
    try {
      const response = await fetch('/api/cron/journey-monitor', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Monitoreo ejecutado: ${data.data.journeysChecked} jornadas verificadas, ${data.data.alertsSent} alertas enviadas`)
      } else {
        alert('Error ejecutando monitoreo')
      }
    } catch (error) {
      console.error('Error testing monitoring:', error)
      alert('Error ejecutando monitoreo')
    }
  }

  const testNotification = async () => {
    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        const successCount = data.data.results.filter((r: { success: boolean }) => r.success).length
        alert(`Notificación de prueba enviada: ${successCount}/${data.data.tokensFound} dispositivos`)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error testing notification:', error)
      alert('Error enviando notificación de prueba')
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Dispositivos de Notificación" titleIcon={<Bell className="h-8 w-8 text-gray-600" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dispositivos de Notificación">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Dispositivos Administrativos ({devices.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Dispositivos que reciben alertas de jornadas inactivas
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={testNotification}
              className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Bell className="mr-2 h-4 w-4" />
              Probar Notificación
            </button>
            <button
              onClick={testMonitoring}
              className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Bell className="mr-2 h-4 w-4" />
              Probar Monitoreo
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Dispositivo
            </button>
          </div>
        </div>

        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Sistema de Notificaciones Push
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>• Los dispositivos registrados aquí recibirán alertas cuando las jornadas se vuelvan inactivas</p>
                <p>• Alerta por falta de heartbeat: 15 minutos sin señal de vida</p>
                <p>• Alerta por falta de movimiento: 45 minutos sin cambio de ubicación</p>
                <p>• Configurar Firebase Admin SDK en variables de entorno para activar</p>
              </div>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Registrar Dispositivo Administrativo
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID del Dispositivo
                  </label>
                  <input
                    type="text"
                    value={formData.deviceId}
                    onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="ej: admin-phone-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plataforma
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="android">Android</option>
                    <option value="ios">iOS</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token FCM/APNS
                  </label>
                  <textarea
                    value={formData.pushToken}
                    onChange={(e) => setFormData({ ...formData, pushToken: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    rows={3}
                    placeholder="Token obtenido desde la app móvil"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="ej: Teléfono del Supervisor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clave Admin (opcional)
                  </label>
                  <input
                    type="password"
                    value={formData.adminSecret}
                    onChange={(e) => setFormData({ ...formData, adminSecret: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Solo si está configurada en .env"
                  />
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
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Registrar
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
                  Dispositivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plataforma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.map((device) => (
                <tr key={device.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Smartphone className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {device.deviceId}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {device.id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      device.platform === 'android'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {device.platform === 'android' ? 'Android' : 'iOS'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {device.description || 'Sin descripción'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(device.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDeleteClick(device)}
                      className="inline-flex items-center text-red-600 hover:text-red-900"
                      title="Desactivar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {devices.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <BellOff className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No hay dispositivos administrativos registrados</p>
              <p className="text-sm">Registra dispositivos para recibir alertas de jornadas inactivas</p>
            </div>
          )}
        </div>

        {/* Modal de Confirmación */}
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, deviceId: '', description: '' })}
          onConfirm={handleDeleteConfirm}
          title="Desactivar Dispositivo"
          message={
            <div>
              <p>¿Estás seguro de que quieres desactivar este dispositivo?</p>
              <p className="font-medium mt-2 text-gray-900">&quot;{deleteConfirm.description}&quot;</p>
              <p className="text-sm mt-2 text-gray-600">
                El dispositivo dejará de recibir notificaciones de alertas.
              </p>
            </div>
          }
          confirmText="Desactivar"
          cancelText="Cancelar"
          type="danger"
        />
      </div>
    </DashboardLayout>
  )
}